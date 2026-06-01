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
  upload: (file: File) => Promise<string | null>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [extractions, setExtractions] = useState<Record<string, ExtractionResult>>(mockExtractionResults);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Polling refs — track which docs are still processing
  const pollingRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const openaiKey = (): string | undefined => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem("openai_api_key") ?? undefined;
  };

  // ── Health check ────────────────────────────────────────────────────────────
  useEffect(() => {
    checkBackendHealth().then(online => {
      setBackendOnline(online);
      if (online) loadDocuments();
    });
  }, []);

  // ── Load documents from API ─────────────────────────────────────────────────
  const loadDocuments = useCallback(async () => {
    try {
      const apiDocs = await listDocuments({ limit: 100 });
      const frontendDocs = apiDocs.map(toFrontendDocument);

      // Merge API docs with mock docs (API docs take priority by id)
      const apiIds = new Set(frontendDocs.map(d => d.id));
      const merged = [
        ...frontendDocs,
        ...mockDocuments.filter(d => !apiIds.has(d.id)),
      ];
      setDocuments(merged);

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
  const upload = useCallback(async (file: File): Promise<string | null> => {
    if (!backendOnline) {
      console.warn("Backend offline — upload simulated");
      return null;
    }
    setLoading(true);
    try {
      const apiDoc = await uploadDocument(file, openaiKey());
      const frontendDoc = toFrontendDocument(apiDoc);

      setDocuments(prev => [frontendDoc, ...prev]);

      if (apiDoc.status === "processing" || apiDoc.status === "pending") {
        startPolling(apiDoc.id);
      }

      return apiDoc.id;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [backendOnline, startPolling]);

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
    const online = await checkBackendHealth();
    setBackendOnline(online);
    if (online) await loadDocuments();
  }, [loadDocuments]);

  return { documents, extractions, loading, backendOnline, upload, remove, refresh };
}
