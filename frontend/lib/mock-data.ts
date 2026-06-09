import type { Document, ExtractionResult, Automation, ActivityItem, AIInsight } from "./types";

/**
 * Sample test documents — real PDFs in /public/samples, not pre-analyzed.
 * Click Analyze in the preview to run AI extraction.
 */
export const sampleDocuments: Document[] = [
  {
    id: "sample_invoice",
    name: "sample-invoice.pdf",
    type: "invoice",
    status: "pending",
    size: 6000,
    pages: 1,
    uploadedAt: "2026-01-01T00:00:00Z",
    sampleUrl: "/samples/sample-invoice.pdf",
  },
  {
    id: "sample_resume",
    name: "sample-resume.pdf",
    type: "resume",
    status: "pending",
    size: 5500,
    pages: 1,
    uploadedAt: "2026-01-01T00:00:00Z",
    sampleUrl: "/samples/sample-resume.pdf",
  },
  {
    id: "sample_contract",
    name: "sample-contract.pdf",
    type: "contract",
    status: "pending",
    size: 5800,
    pages: 1,
    uploadedAt: "2026-01-01T00:00:00Z",
    sampleUrl: "/samples/sample-contract.pdf",
  },
  {
    id: "sample_report",
    name: "sample-report.pdf",
    type: "report",
    status: "pending",
    size: 5900,
    pages: 1,
    uploadedAt: "2026-01-01T00:00:00Z",
    sampleUrl: "/samples/sample-report.pdf",
  },
];

/** Stale API uploads hidden from the default workspace list (dev/demo pollution). */
export const HIDDEN_API_DOC_NAMES = new Set(["client-capex-request.pdf"]);

/** @deprecated use sampleDocuments */
export const mockDocuments = sampleDocuments;

export const mockExtractionResults: Record<string, ExtractionResult> = {};

export const SAMPLE_DOC_IDS = new Set(sampleDocuments.map((d) => d.id));

/** Optional enterprise demo PDFs — upload manually to test unknown/internal forms. */
export const DEMO_ENTERPRISE_SAMPLES = [
  {
    name: "client-capex-request.pdf",
    sampleUrl: "/samples/client-capex-request.pdf",
  },
  {
    name: "client-it-access-request.pdf",
    sampleUrl: "/samples/client-it-access-request.pdf",
  },
] as const;

/** @deprecated use DEMO_ENTERPRISE_SAMPLES */
export const DEMO_CAPEX_SAMPLE = DEMO_ENTERPRISE_SAMPLES[0];

/** Resolve local PDF URL for preview (samples + re-uploaded sample files) */
export function resolveSamplePdfUrl(doc: Document): string | null {
  if (doc.sampleUrl) return doc.sampleUrl;
  const match = sampleDocuments.find((s) => s.name === doc.name);
  if (match?.sampleUrl) return match.sampleUrl;
  const enterprise = DEMO_ENTERPRISE_SAMPLES.find((s) => s.name === doc.name);
  return enterprise?.sampleUrl ?? null;
}

/** @deprecated use SAMPLE_DOC_IDS */
export const DEMO_DOC_IDS = SAMPLE_DOC_IDS;

export function mergeWithSampleDocuments(
  apiDocs: Document[],
  hiddenSampleIds?: Set<string>
): Document[] {
  const apiNames = new Set(apiDocs.map((d) => d.name));
  const hidden = hiddenSampleIds ?? new Set<string>();
  const samples = sampleDocuments.filter(
    (d) => !apiNames.has(d.name) && !hidden.has(d.id)
  );
  return [...apiDocs, ...samples];
}

/** Update API docs in the list without re-injecting samples from the catalog. */
export function upsertApiDocument(
  prev: Document[],
  apiDoc: Document,
  removeIds: string[] = [],
): Document[] {
  const removed = new Set(removeIds);
  const apiNames = new Set([apiDoc.name]);

  const apiDocs = [
    apiDoc,
    ...prev.filter(
      (d) =>
        !SAMPLE_DOC_IDS.has(d.id) &&
        d.id !== apiDoc.id &&
        !removed.has(d.id)
    ),
  ];
  apiDocs.forEach((d) => apiNames.add(d.name));

  const keptSamples = prev.filter(
    (d) =>
      SAMPLE_DOC_IDS.has(d.id) &&
      !removed.has(d.id) &&
      !apiNames.has(d.name)
  );

  return [...apiDocs, ...keptSamples];
}

/** @deprecated */
export const mergeWithDemoDocuments = mergeWithSampleDocuments;

export const mockAutomations: Automation[] = [
  {
    id: "auto_001",
    name: "Invoice Processing",
    description: "Automatically extract vendor details, amounts, dates, and line items from invoices. Export to accounting software.",
    icon: "FileText",
    documentsProcessed: 1284,
    lastRun: "2025-12-18T09:24:00Z",
    status: "active",
    category: "Finance",
    schema: {
      invoice_number: "string",
      vendor_name: "string",
      total_amount: "currency",
      due_date: "date",
      tax_amount: "currency",
      line_items: "array",
    },
  },
  {
    id: "auto_002",
    name: "Resume Screening",
    description: "Parse CVs and resumes to extract skills, experience, education. Score candidates against job requirements automatically.",
    icon: "User",
    documentsProcessed: 847,
    lastRun: "2025-12-17T14:12:00Z",
    status: "active",
    category: "HR",
    schema: {
      full_name: "string",
      email: "email",
      years_experience: "number",
      skills: "array",
      education: "string",
      current_company: "string",
    },
  },
  {
    id: "auto_003",
    name: "Contract Analyzer",
    description: "Extract key contract clauses, parties, terms, obligations, and risk flags from legal documents.",
    icon: "Scale",
    documentsProcessed: 312,
    lastRun: "2025-12-17T11:30:00Z",
    status: "active",
    category: "Legal",
    schema: {
      parties: "array",
      effective_date: "date",
      expiry_date: "date",
      total_value: "currency",
      obligations: "array",
      termination_clause: "string",
    },
  },
  {
    id: "auto_004",
    name: "Financial Report Parser",
    description: "Extract KPIs, metrics, revenue figures, and trends from quarterly and annual financial reports.",
    icon: "BarChart",
    documentsProcessed: 156,
    lastRun: "2025-12-16T16:45:00Z",
    status: "active",
    category: "Finance",
    schema: {
      revenue: "currency",
      net_profit: "currency",
      growth_rate: "number",
      key_metrics: "array",
      period: "string",
      highlights: "array",
    },
  },
  {
    id: "auto_005",
    name: "Medical Records Extractor",
    description: "Parse patient records, lab results, and medical reports for healthcare data management.",
    icon: "HeartPulse",
    documentsProcessed: 89,
    lastRun: "2025-12-15T09:00:00Z",
    status: "paused",
    category: "Healthcare",
    schema: {
      patient_name: "string",
      date_of_birth: "date",
      diagnosis: "string",
      medications: "array",
      physician: "string",
    },
  },
  {
    id: "auto_006",
    name: "Purchase Order Processor",
    description: "Extract supplier info, item lists, quantities, and pricing from purchase order documents.",
    icon: "ShoppingCart",
    documentsProcessed: 0,
    status: "draft",
    category: "Procurement",
    schema: {
      po_number: "string",
      supplier: "string",
      items: "array",
      total: "currency",
      delivery_date: "date",
    },
  },
];

export const mockActivityItems: ActivityItem[] = [
  {
    id: "act_001",
    type: "extraction",
    documentName: "Invoice_Acme_Corp_Q4-2025.pdf",
    documentType: "invoice",
    timestamp: "2025-12-18T09:24:38Z",
    status: "success",
    details: "14 fields extracted — 98% confidence",
  },
  {
    id: "act_002",
    type: "upload",
    documentName: "Resume_James_Park_DataScientist.pdf",
    documentType: "resume",
    timestamp: "2025-12-18T09:45:00Z",
    status: "success",
    details: "214 KB — processing started",
  },
  {
    id: "act_003",
    type: "export",
    documentName: "Invoice_Acme_Corp_Q4-2025.pdf",
    documentType: "invoice",
    timestamp: "2025-12-18T09:26:00Z",
    status: "success",
    details: "Exported to CSV",
  },
  {
    id: "act_004",
    type: "extraction",
    documentName: "Resume_Sarah_Mitchell_SeniorDev.pdf",
    documentType: "resume",
    timestamp: "2025-12-17T14:12:52Z",
    status: "success",
    details: "22 fields extracted — 96% confidence",
  },
  {
    id: "act_005",
    type: "automation",
    documentName: "Contract_NDA_TechVentures_2025.pdf",
    documentType: "contract",
    timestamp: "2025-12-17T11:31:14Z",
    status: "success",
    details: "Contract Analyzer — 18 clauses identified",
  },
  {
    id: "act_006",
    type: "analysis",
    documentName: "Q3_Financial_Report_2025.pdf",
    documentType: "report",
    timestamp: "2025-12-16T16:47:02Z",
    status: "success",
    details: "31 KPIs extracted — AI summary generated",
  },
  {
    id: "act_007",
    type: "extraction",
    documentName: "Annual_Report_GlobalTech_2024.pdf",
    documentType: "report",
    timestamp: "2025-12-14T15:12:00Z",
    status: "error",
    details: "File too large — processing failed",
  },
  {
    id: "act_008",
    type: "export",
    documentName: "Partnership_Agreement_Nexus_2025.pdf",
    documentType: "contract",
    timestamp: "2025-12-15T08:35:00Z",
    status: "success",
    details: "Exported to JSON + Notion",
  },
];

export const mockAIInsights: AIInsight[] = [
  {
    type: "success",
    title: "Invoice Verified",
    description: "All financial figures cross-validated. Tax calculations are accurate. No anomalies detected.",
    confidence: 98,
  },
  {
    type: "warning",
    title: "Missing Tax ID",
    description: "Vendor tax identification number not found in document. May require manual verification before payment.",
    confidence: 85,
  },
  {
    type: "info",
    title: "Payment Due Soon",
    description: "Invoice INV-2025-4891 is due in 28 days. Recommend scheduling payment this week.",
    confidence: 99,
    entities: ["January 15, 2026", "Net 30", "$12,451.88"],
  },
  {
    type: "info",
    title: "Similar Invoices Found",
    description: "3 previous invoices from Acme Corporation found in database. Average amount: $10,200.",
    confidence: 91,
    entities: ["Acme Corporation", "$10,200 avg"],
  },
];

export const mockDashboardMetrics = [
  { label: "Documents Processed", value: "2,847", change: 18.4, changeLabel: "vs last month", trend: "up" as const, icon: "FileText" },
  { label: "Extraction Accuracy", value: "96.2%", change: 2.1, changeLabel: "vs last month", trend: "up" as const, icon: "Target" },
  { label: "Automations Run", value: "689", change: 31.2, changeLabel: "vs last month", trend: "up" as const, icon: "Zap" },
  { label: "Time Saved", value: "142h", change: 24.8, changeLabel: "vs last month", trend: "up" as const, icon: "Clock" },
];

export const mockChartData = {
  documentTypes: [
    { name: "Invoices", value: 1284, color: "#6366f1" },
    { name: "Resumes", value: 847, color: "#8b5cf6" },
    { name: "Contracts", value: 456, color: "#14b8a6" },
    { name: "Reports", value: 260, color: "#f59e0b" },
  ],
  weeklyActivity: [
    { day: "Mon", documents: 42, extractions: 38 },
    { day: "Tue", documents: 58, extractions: 54 },
    { day: "Wed", documents: 71, extractions: 68 },
    { day: "Thu", documents: 49, extractions: 45 },
    { day: "Fri", documents: 83, extractions: 79 },
    { day: "Sat", documents: 24, extractions: 21 },
    { day: "Sun", documents: 18, extractions: 16 },
  ],
  confidenceTrend: [
    { month: "Jul", accuracy: 91.2 },
    { month: "Aug", accuracy: 92.8 },
    { month: "Sep", accuracy: 93.4 },
    { month: "Oct", accuracy: 94.1 },
    { month: "Nov", accuracy: 95.3 },
    { month: "Dec", accuracy: 96.2 },
  ],
};

