export type DocumentStatus = "processing" | "completed" | "failed" | "pending";
export type DocumentType = "invoice" | "resume" | "contract" | "report" | "unknown";

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  size: number;
  pages?: number;
  uploadedAt: string;
  processedAt?: string;
  thumbnail?: string;
  confidence?: number;
  extractedFields?: number;
  summary?: string;
  errorMessage?: string;
  /** Local test file served from /public/samples — triggers real Groq upload */
  sampleUrl?: string;
}

export interface ExtractionField {
  key: string;
  value: string | number | boolean | string[] | null;
  confidence: number;
  type: "string" | "number" | "date" | "currency" | "email" | "phone" | "array";
}

export interface ExtractionResult {
  documentId: string;
  documentType: DocumentType;
  fields: ExtractionField[];
  rawJson: Record<string, unknown>;
  summary: string;
  keyInsights: string[];
  actionItems: string[];
  warnings: string[];
  confidence: number;
  processingTime: number;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  icon: string;
  documentsProcessed: number;
  lastRun?: string;
  status: "active" | "paused" | "draft";
  schema: Record<string, string>;
  category: string;
}

export interface MetricCard {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  trend: "up" | "down" | "neutral";
  icon: string;
}

export interface ActivityItem {
  id: string;
  type: "upload" | "export" | "extraction" | "automation" | "analysis";
  documentName: string;
  documentType: DocumentType;
  timestamp: string;
  status: "success" | "error" | "warning";
  details?: string;
}

export interface AIInsight {
  type: "info" | "warning" | "success" | "error";
  title: string;
  description: string;
  confidence?: number;
  entities?: string[];
}
