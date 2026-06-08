/**
 * Doc2Struct API client
 * Talks to the FastAPI backend at NEXT_PUBLIC_API_URL.
 * Falls back gracefully when the backend is offline.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Railway cold starts can exceed 10s — keep timeouts generous */
const TIMEOUT = {
  health: 30_000,
  read: 25_000,
  upload: 120_000,
} as const;

function fetchWithTimeout(url: string, init: RequestInit = {}, ms: number = TIMEOUT.read) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}

// ── Types matching backend Pydantic models ────────────────────────────────────

export interface APIDocument {
  id: string;
  name: string;
  type: "invoice" | "resume" | "contract" | "report" | "unknown";
  status: "pending" | "processing" | "completed" | "failed";
  size: number;
  pages?: number;
  uploaded_at: string;
  processed_at?: string;
  confidence?: number;
  extracted_fields?: number;
  summary?: string;
  error_message?: string;
}

export interface APIExtractionField {
  key: string;
  value: unknown;
  confidence: number;
  field_type: string;
}

export interface APIExtractionResult {
  document_id: string;
  document_type: string;
  fields: APIExtractionField[];
  raw_json: Record<string, unknown>;
  summary: string;
  key_insights: string[];
  action_items: string[];
  warnings: string[];
  confidence: number;
  processing_time_ms: number;
}

export interface APIStats {
  documents_processed: number;
  extraction_accuracy: number;
  automations_run: number;
  avg_processing_time_ms: number;
}

// ── Health check ──────────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(`${BASE}/health`, {}, TIMEOUT.health);
      if (res.ok) return true;
    } catch {
      // Railway cold start — retry once after a short pause
      if (attempt === 0) await new Promise(r => setTimeout(r, 2000));
    }
  }
  return false;
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function uploadDocument(
  file: File,
  groqApiKey?: string
): Promise<APIDocument> {
  const form = new FormData();
  form.append("file", file);

  const url = new URL(`${BASE}/api/v1/documents/upload`);
  if (groqApiKey) url.searchParams.set("groq_api_key", groqApiKey);

  const res = await fetchWithTimeout(url.toString(), { method: "POST", body: form }, TIMEOUT.upload);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
}

export async function listDocuments(params?: {
  doc_type?: string;
  status?: string;
  limit?: number;
}): Promise<APIDocument[]> {
  const url = new URL(`${BASE}/api/v1/documents/`);
  if (params?.doc_type) url.searchParams.set("doc_type", params.doc_type);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function getDocument(id: string): Promise<APIDocument> {
  const res = await fetchWithTimeout(`${BASE}/api/v1/documents/${id}`);
  if (!res.ok) throw new Error("Document not found");
  return res.json();
}

export async function getExtraction(id: string): Promise<APIExtractionResult> {
  const res = await fetchWithTimeout(`${BASE}/api/v1/documents/${id}/extraction`);
  if (res.status === 202) throw new Error("PROCESSING"); // still running
  if (!res.ok) throw new Error("Extraction not available");
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  await fetch(`${BASE}/api/v1/documents/${id}`, { method: "DELETE" });
}

export async function exportDocument(
  id: string,
  format: "csv" | "json" | "excel"
): Promise<Blob> {
  const res = await fetch(`${BASE}/api/v1/documents/${id}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: id, format }),
  });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

export async function getStats(): Promise<APIStats> {
  const res = await fetchWithTimeout(`${BASE}/api/v1/stats`, {}, TIMEOUT.health);
  if (!res.ok) throw new Error("Stats unavailable");
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert API document to the frontend Document type */
export function toFrontendDocument(d: APIDocument) {
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    status: d.status,
    size: d.size,
    pages: d.pages,
    uploadedAt: d.uploaded_at,
    processedAt: d.processed_at,
    confidence: d.confidence,
    extractedFields: d.extracted_fields,
    summary: d.summary,
    errorMessage: d.error_message,
  };
}

/** Convert API extraction to the frontend ExtractionResult type */
export function toFrontendExtraction(e: APIExtractionResult) {
  return {
    documentId: e.document_id,
    documentType: e.document_type as any,
    fields: e.fields.map(f => ({
      key: f.key,
      value: f.value as any,
      confidence: f.confidence,
      type: f.field_type as any,
    })),
    rawJson: e.raw_json,
    summary: e.summary,
    keyInsights: e.key_insights,
    actionItems: e.action_items,
    warnings: e.warnings,
    confidence: e.confidence,
    processingTime: e.processing_time_ms,
  };
}
