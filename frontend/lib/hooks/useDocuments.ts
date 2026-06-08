"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  listDocuments, getDocument, getExtraction,
  uploadDocument, deleteDocument,
  toFrontendDocument, toFrontendExtraction,
  checkBackendHealth,
  type APIDocument,
} from "@/lib/api";
import { mockDocuments, mockExtractionResults } from "@/lib/mock-data";
import type { Document, ExtractionResult } from "@/lib/types";

interface UseDocumentsReturn {
  documents: Document[];
  extractions: Record<string, ExtractionResult>;
  loading: boolean;
  backendOnline: boolean;
  backendChecking: boolean;
  upload: (file: File) => Promise<Document | null>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [extractions, setExtractions] = useState<Record<string, ExtractionResult>>(mockExtractionResults);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [backendChecking, setBackendChecking] = useState(true);

  // Polling refs — track which docs are still processing
  const pollingRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const groqKey = (): string | undefined => {
    if (typeof window === "undefined") return undefined;
    const key = localStorage.getItem("groq_api_key")?.trim();
    // Only send client key if valid — otherwise Railway/server GROQ_API_KEY is used
    if (key?.startsWith("gsk_")) return key;
    return undefined;
  };

  // ── Health check ────────────────────────────────────────────────────────────
  useEffect(() => {
    checkBackendHealth().then(online => {
      setBackendOnline(online);
      setBackendChecking(false);
      if (online) loadDocuments();
    });
  }, []);

  // ── Load documents from API ─────────────────────────────────────────────────
  const loadDocuments = useCallback(async () => {
    try {
      const apiDocs = await listDocuments({ limit: 100 });
      const frontendDocs = apiDocs.map(toFrontendDocument);

      // Real API docs replace demo mocks when any exist
      setDocuments(frontendDocs.length > 0 ? frontendDocs : mockDocuments);

      // Start polling for docs still processing
      apiDocs
        .filter(d => d.status === "processing" || d.status === "pending")
        .forEach(d => startPolling(d.id));

      // Load extractions for completed API docs
      apiDocs
        .filter(d => d.status === "completed")
        .forEach(d => loadExtraction(d.id));
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // ── Load extraction for one doc ─────────────────────────────────────────────
  const loadExtraction = useCallback(async (docId: string) => {
    if (extractions[docId]) return; // already loaded
    try {
      const apiExtraction = await getExtraction(docId);
      setExtractions(prev => ({
        ...prev,
        [docId]: toFrontendExtraction(apiExtraction),
      }));
    } catch {
      // Extraction not ready yet or unavailable
    }
  }, [extractions]);

  // ── Polling for processing docs ─────────────────────────────────────────────
  const startPolling = useCallback((docId: string) => {
    if (pollingRefs.current[docId]) return; // already polling

    const MAX_POLLS = 90; // 3 minutes max (90 × 2s)
    let pollCount = 0;

    const interval = setInterval(async () => {
      pollCount++;

      // Timeout — stop polling and mark as failed
      if (pollCount > MAX_POLLS) {
        clearInterval(pollingRefs.current[docId]);
        delete pollingRefs.current[docId];
        setDocuments(prev => prev.map(d =>
          d.id === docId ? { ...d, status: "failed" as const } : d
        ));
        return;
      }

      try {
        const doc = await getDocument(docId);
        const frontendDoc = toFrontendDocument(doc);

        setDocuments(prev =>
          prev.map(d => d.id === docId ? frontendDoc : d)
        );

        if (doc.status === "completed") {
          clearInterval(pollingRefs.current[docId]);
          delete pollingRefs.current[docId];
          await loadExtraction(docId);
        } else if (doc.status === "failed") {
          clearInterval(pollingRefs.current[docId]);
          delete pollingRefs.current[docId];
        }
      } catch {
        clearInterval(pollingRefs.current[docId]);
        delete pollingRefs.current[docId];
      }
    }, 2000); // poll every 2s

    pollingRefs.current[docId] = interval;
  }, [loadExtraction]);

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
      const frontendDoc = toFrontendDocument(apiDoc);

      setDocuments(prev => [frontendDoc, ...prev.filter(d => !d.id.startsWith("demo_"))]);

      if (apiDoc.status === "processing" || apiDoc.status === "pending") {
        startPolling(apiDoc.id);
      } else if (apiDoc.status === "completed") {
        await loadExtraction(apiDoc.id);
      }

      return frontendDoc;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [backendOnline, startPolling, loadExtraction]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const remove = useCallback(async (id: string) => {
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
  }, [backendOnline]);

  // ── Refresh ─────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setBackendChecking(true);
    const online = await checkBackendHealth();
    setBackendOnline(online);
    setBackendChecking(false);
    if (online) await loadDocuments();
  }, [loadDocuments]);

  return { documents, extractions, loading, backendOnline, backendChecking, upload, remove, refresh };
}
