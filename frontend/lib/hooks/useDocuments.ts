"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  listDocuments, getDocument, getExtraction,
  uploadDocument, analyzeDocument, deleteDocument,
  toFrontendDocument, toFrontendExtraction,
  checkBackendHealth,
  type APIDocument,
} from "@/lib/api";
import {
  mockExtractionResults,
  mergeWithSampleDocuments, upsertApiDocument, SAMPLE_DOC_IDS,
  resolveSamplePdfUrl, HIDDEN_API_DOC_NAMES,
} from "@/lib/mock-data";
import { notificationsEnabled } from "@/lib/notifications-prefs";
import { getHiddenSampleIds, hideSampleDoc } from "@/lib/sample-prefs";
import type { Document, ExtractionResult } from "@/lib/types";

interface UseDocumentsReturn {
  documents: Document[];
  extractions: Record<string, ExtractionResult>;
  loading: boolean;
  analyzingDocId: string | null;
  analyzeError: string | null;
  backendOnline: boolean;
  backendChecking: boolean;
  upload: (file: File) => Promise<Document | null>;
  analyze: (doc: Document) => Promise<Document | null>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  getPreviewUrl: (doc: Document | null) => string | null;
}

async function fetchSampleFile(doc: Document): Promise<File | undefined> {
  const url = doc.sampleUrl ?? resolveSamplePdfUrl(doc);
  if (!url) return undefined;
  const res = await fetch(url);
  if (!res.ok) return undefined;
  const blob = await res.blob();
  return new File([blob], doc.name, { type: blob.type || "application/pdf" });
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [extractions, setExtractions] = useState<Record<string, ExtractionResult>>(mockExtractionResults);
  const [loading, setLoading] = useState(false);
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [backendChecking, setBackendChecking] = useState(true);

  // Polling refs — track which docs are still processing
  const pollingRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  // Keep original File bytes for re-analyze when /analyze is not deployed
  const uploadedFilesRef = useRef<Map<string, File>>(new Map());
  const previewUrlsRef = useRef<Map<string, string>>(new Map());

  const getPreviewUrl = useCallback((doc: Document | null): string | null => {
    if (!doc) return null;

    const sampleUrl = resolveSamplePdfUrl(doc);
    if (sampleUrl) return sampleUrl;

    const cached = previewUrlsRef.current.get(doc.id);
    if (cached) return cached;

    const file = uploadedFilesRef.current.get(doc.id);
    if (!file) return null;

    const blobUrl = URL.createObjectURL(file);
    previewUrlsRef.current.set(doc.id, blobUrl);
    return blobUrl;
  }, []);

  const groqKey = (): string | undefined => {
    if (typeof window === "undefined") return undefined;
    const key = localStorage.getItem("groq_api_key")?.trim();
    // Only send client key if valid — otherwise Railway/server GROQ_API_KEY is used
    if (key?.startsWith("gsk_")) return key;
    return undefined;
  };

  // ── Load documents from API ─────────────────────────────────────────────────
  const loadDocuments = useCallback(async () => {
    try {
      const apiDocs = await listDocuments({ limit: 100 });
      const frontendDocs = apiDocs
        .filter((d) => !HIDDEN_API_DOC_NAMES.has(d.name))
        .map(toFrontendDocument);

      // API docs + sample test PDFs (1 per category, not pre-analyzed)
      setDocuments(mergeWithSampleDocuments(frontendDocs, getHiddenSampleIds()));

      // Poll only docs actively being analyzed
      apiDocs
        .filter(d => d.status === "processing")
        .forEach(d => startPolling(d.id));

      // Load extractions for completed API docs
      apiDocs
        .filter(d => d.status === "completed" && !HIDDEN_API_DOC_NAMES.has(d.name))
        .forEach(d => loadExtraction(d.id));
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // ── Load extraction for one doc ─────────────────────────────────────────────
  const loadExtraction = useCallback(async (docId: string) => {
    try {
      const apiExtraction = await getExtraction(docId);
      setExtractions(prev => {
        if (prev[docId]) return prev;
        return { ...prev, [docId]: toFrontendExtraction(apiExtraction) };
      });
    } catch {
      // Extraction not ready yet or unavailable
    }
  }, []);

  const stopPolling = useCallback((docId: string) => {
    const handle = pollingRefs.current[docId];
    if (handle) {
      clearInterval(handle);
      delete pollingRefs.current[docId];
    }
  }, []);

  const mergePolledDoc = useCallback((docId: string, apiDoc: APIDocument) => {
    const frontendDoc = toFrontendDocument(apiDoc);
    setDocuments(prev =>
      prev.map(d => {
        if (d.id !== docId) return d;
        // Server may still return "pending" while the background job starts
        if (d.status === "processing" && frontendDoc.status === "pending") {
          return d;
        }
        return frontendDoc;
      })
    );
    return apiDoc;
  }, []);

  // ── Polling for processing docs ─────────────────────────────────────────────
  const startPolling = useCallback((docId: string) => {
    if (pollingRefs.current[docId]) return;

    const MAX_POLLS = 90;
    let pollCount = 0;

    const pollOnce = async () => {
      pollCount++;

      if (pollCount > MAX_POLLS) {
        stopPolling(docId);
        setDocuments(prev => prev.map(d =>
          d.id === docId ? { ...d, status: "failed" as const } : d
        ));
        setAnalyzingDocId((current) => (current === docId ? null : current));
        return;
      }

      try {
        const doc = await getDocument(docId);
        mergePolledDoc(docId, doc);

        if (doc.status === "completed") {
          stopPolling(docId);
          setAnalyzingDocId((current) => (current === docId ? null : current));
          if (notificationsEnabled() && typeof document !== "undefined") {
            const companyEmail = localStorage.getItem("company_email");
            console.info(
              `[Doc2Struct] Analysis complete: ${doc.name}` +
              (companyEmail ? ` — email alert for ${companyEmail}` : "")
            );
          }
          await loadExtraction(docId);
        } else if (doc.status === "failed") {
          stopPolling(docId);
          setAnalyzingDocId((current) => (current === docId ? null : current));
        }
      } catch {
        stopPolling(docId);
      }
    };

    void pollOnce();
    pollingRefs.current[docId] = setInterval(() => { void pollOnce(); }, 2000);
  }, [loadExtraction, mergePolledDoc, stopPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRefs.current).forEach(clearInterval);
    };
  }, []);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const upload = useCallback(async (file: File): Promise<Document | null> => {
    if (!backendOnline) {
      console.warn("Backend offline — upload simulated");
      return null;
    }
    setLoading(true);
    try {
      const apiDoc = await uploadDocument(file, groqKey());
      uploadedFilesRef.current.set(apiDoc.id, file);
      const frontendDoc = toFrontendDocument(apiDoc);

      setDocuments(prev => upsertApiDocument(prev, frontendDoc));

      if (apiDoc.status === "processing") {
        startPolling(apiDoc.id);
      }

      return frontendDoc;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [backendOnline, startPolling]);

  const applyAnalyzedDoc = useCallback(async (
    apiDoc: APIDocument,
    removeIds: string[] = [],
    analysisQueued = false,
  ): Promise<Document> => {
    // auto_analyze returns "pending" before the background task flips status
    const displayStatus =
      analysisQueued && apiDoc.status === "pending" ? "processing" as const : apiDoc.status;
    const frontendDoc = toFrontendDocument({ ...apiDoc, status: displayStatus });

    setDocuments(prev => upsertApiDocument(prev, frontendDoc, removeIds));

    for (const id of removeIds) {
      uploadedFilesRef.current.delete(id);
      const blobUrl = previewUrlsRef.current.get(id);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        previewUrlsRef.current.delete(id);
      }
    }

    if (displayStatus === "processing") {
      startPolling(apiDoc.id);
    } else if (apiDoc.status === "completed") {
      await loadExtraction(apiDoc.id);
    }

    return frontendDoc;
  }, [startPolling, loadExtraction]);

  const triggerAnalysis = useCallback(async (
    apiDoc: APIDocument,
    fallbackFile?: File,
    replaceDocId?: string,
  ): Promise<APIDocument> => {
    if (apiDoc.status !== "pending") return apiDoc;

    try {
      return await analyzeDocument(apiDoc.id, groqKey());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      // /analyze not deployed — re-upload with auto_analyze when we have the file
      if (msg === "Not Found") {
        const file =
          fallbackFile ??
          uploadedFilesRef.current.get(apiDoc.id) ??
          await fetchSampleFile({
            id: apiDoc.id,
            name: apiDoc.name,
            type: apiDoc.type,
            status: apiDoc.status,
            size: apiDoc.size,
            uploadedAt: apiDoc.uploaded_at,
          });
        if (file) {
          const newDoc = await uploadDocument(file, groqKey(), { autoAnalyze: true });
          uploadedFilesRef.current.set(newDoc.id, file);
          if (replaceDocId) {
            uploadedFilesRef.current.delete(replaceDocId);
          }
          return newDoc;
        }
        throw new Error(
          "Fichier introuvable pour l'analyse. Supprimez le document et ré-uploadez-le.",
        );
      }
      throw err;
    }
  }, []);

  // ── Analyze (samples: upload+analyze; API docs: /analyze or fallback) ───────
  const analyze = useCallback(async (doc: Document): Promise<Document | null> => {
    setAnalyzeError(null);
    setAnalyzingDocId(doc.id);

    let online = backendOnline;
    if (!online) {
      online = await checkBackendHealth();
      setBackendOnline(online);
    }
    if (!online) {
      setAnalyzeError("Backend hors ligne. Vérifiez votre connexion.");
      setAnalyzingDocId(null);
      return null;
    }

    setLoading(true);
    try {
      let apiDoc: APIDocument;
      let removeIds: string[] = [];

      if (SAMPLE_DOC_IDS.has(doc.id)) {
        const file = await fetchSampleFile(doc);
        if (!file) throw new Error("Fichier sample introuvable.");
        apiDoc = await uploadDocument(file, groqKey(), { autoAnalyze: true });
        uploadedFilesRef.current.set(apiDoc.id, file);
        removeIds = [doc.id];
      } else {
        apiDoc = await getDocument(doc.id);
        const fallbackFile =
          uploadedFilesRef.current.get(doc.id) ??
          await fetchSampleFile(doc);
        const oldDocId = doc.id;

        if (apiDoc.status === "completed" || apiDoc.status === "failed") {
          if (!fallbackFile) {
            throw new Error(
              "Fichier introuvable pour ré-analyser. Supprimez le document et ré-uploadez-le.",
            );
          }
          setExtractions(prev => {
            const next = { ...prev };
            delete next[oldDocId];
            return next;
          });
          apiDoc = await uploadDocument(fallbackFile, groqKey(), { autoAnalyze: true });
          uploadedFilesRef.current.set(apiDoc.id, fallbackFile);
          removeIds = [oldDocId];
        } else {
          apiDoc = await triggerAnalysis(apiDoc, fallbackFile, oldDocId);
          if (apiDoc.id !== oldDocId) {
            removeIds = [oldDocId];
          }
        }
      }

      const queued = apiDoc.status === "pending";
      const result = await applyAnalyzedDoc(apiDoc, removeIds, queued);
      if (result.status === "completed") {
        setAnalyzingDocId(null);
      } else {
        setAnalyzingDocId(result.id);
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "L'analyse a échoué.";
      setAnalyzeError(msg);
      setAnalyzingDocId(null);
      console.error("Analysis failed:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [backendOnline, applyAnalyzedDoc, triggerAnalysis]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const remove = useCallback(async (id: string) => {
    if (SAMPLE_DOC_IDS.has(id)) {
      hideSampleDoc(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      return;
    }
    stopPolling(id);
    uploadedFilesRef.current.delete(id);
    const blobUrl = previewUrlsRef.current.get(id);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      previewUrlsRef.current.delete(id);
    }
    // Optimistic update
    setDocuments(prev => prev.filter(d => d.id !== id));
    setExtractions(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (backendOnline) {
      await deleteDocument(id).catch(console.error);
    }
  }, [backendOnline, stopPolling]);

  // ── Refresh ─────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setBackendChecking(true);
    const online = await checkBackendHealth();
    setBackendOnline(online);
    setBackendChecking(false);
    if (online) await loadDocuments();
  }, [loadDocuments]);

  // Bootstrap on mount — client-only (localStorage must not run during SSR)
  useEffect(() => {
    checkBackendHealth().then(async (online) => {
      setBackendOnline(online);
      setBackendChecking(false);
      if (online) {
        await loadDocuments();
      } else {
        setDocuments(mergeWithSampleDocuments([], getHiddenSampleIds()));
      }
    });
  }, [loadDocuments]);

  return {
    documents, extractions, loading, analyzingDocId, analyzeError,
    backendOnline, backendChecking, upload, analyze, remove, refresh, getPreviewUrl,
  };
}
