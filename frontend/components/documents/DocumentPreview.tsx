"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, User, Scale, FileBarChart,
  ChevronLeft, ChevronRight,
  Loader2, Brain, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveSamplePdfUrl } from "@/lib/mock-data";
import { PdfPreviewCanvas } from "@/components/documents/PdfPreviewCanvas";
import type { Document, ExtractionResult } from "@/lib/types";

const docTypeConfig = {
  invoice: { icon: FileText, color: "text-violet-500", label: "Invoice" },
  resume: { icon: User, color: "text-blue-500", label: "Resume" },
  contract: { icon: Scale, color: "text-amber-500", label: "Contract" },
  report: { icon: FileBarChart, color: "text-teal-500", label: "Report" },
  unknown: { icon: FileText, color: "text-muted-foreground", label: "Document" },
};

interface DocumentPreviewProps {
  document: Document | null;
  previewUrl?: string | null;
  extraction?: ExtractionResult | null;
  isAnalyzing?: boolean;
  onAnalyze?: () => void;
  analyzeLoading?: boolean;
  analyzeError?: string | null;
}

function shortenError(msg?: string): string {
  if (!msg) return "Analysis failed. Try uploading again.";
  if (/openai|insufficient_quota/i.test(msg)) return "Legacy upload failed. Delete and re-upload.";
  if (/429|quota|rate_limit|rate limit/i.test(msg)) return "Rate limit reached. Wait a moment and retry.";
  if (/jsonb|asyncpg/i.test(msg)) return "Database error on old upload. Delete and re-upload.";
  return msg.length > 120 ? `${msg.slice(0, 120)}…` : msg;
}

export function DocumentPreview({
  document,
  previewUrl,
  extraction = null,
  isAnalyzing = false,
  onAnalyze,
  analyzeLoading = false,
  analyzeError = null,
}: DocumentPreviewProps) {
  const pdfUrl = previewUrl ?? (document ? resolveSamplePdfUrl(document) : null);
  const isPdf = document?.name.toLowerCase().endsWith(".pdf");
  const totalPages = document?.pages || 1;
  const typeConf = document ? docTypeConfig[document.type] : docTypeConfig.unknown;
  const Icon = typeConf.icon;

  const scanning = isAnalyzing || analyzeLoading;
  const showHighlights =
    !scanning && document?.status === "completed" && !!extraction?.fields.length;

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <FileText className="w-10 h-10 text-muted-foreground/25 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Select a document</p>
      </div>
    );
  }

  return (
    <DocumentPreviewInner
      document={document}
      extraction={extraction}
      pdfUrl={pdfUrl}
      isPdf={!!isPdf}
      totalPages={totalPages}
      typeConf={typeConf}
      Icon={Icon}
      scanning={scanning}
      showHighlights={showHighlights}
      onAnalyze={onAnalyze}
      analyzeLoading={analyzeLoading}
      analyzeError={analyzeError}
    />
  );
}

function DocumentPreviewInner({
  document,
  extraction,
  pdfUrl,
  isPdf,
  totalPages,
  typeConf,
  Icon,
  scanning,
  showHighlights,
  onAnalyze,
  analyzeLoading,
  analyzeError,
}: {
  document: Document;
  extraction: ExtractionResult | null;
  pdfUrl: string | null;
  isPdf: boolean;
  totalPages: number;
  typeConf: (typeof docTypeConfig)[keyof typeof docTypeConfig];
  Icon: React.ElementType;
  scanning: boolean;
  showHighlights: boolean;
  onAnalyze?: () => void;
  analyzeLoading: boolean;
  analyzeError: string | null;
}) {
  const [page, setPage] = useState(0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn("p-1.5 rounded-lg bg-background shrink-0", typeConf.color)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate max-w-48">{document.name}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{typeConf.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {analyzeError && (
            <span className="flex items-center gap-1 text-[11px] text-red-500 max-w-[220px] truncate" title={analyzeError}>
              <AlertCircle className="w-3 h-3 shrink-0" />
              {shortenError(analyzeError)}
            </span>
          )}

          {document.status === "failed" && !analyzeError && (
            <span className="flex items-center gap-1 text-[11px] text-red-500 max-w-[200px] truncate">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {shortenError(document.errorMessage)}
            </span>
          )}

          {(document.status === "pending" ||
            document.status === "failed" ||
            document.status === "completed") &&
            onAnalyze && (
            <button
              onClick={onAnalyze}
              disabled={analyzeLoading}
              className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {analyzeLoading
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing</>
                : <><Brain className="w-3 h-3" /> {document.status === "pending" ? "Analyze" : "Re-analyze"}</>}
            </button>
          )}

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-[11px] text-muted-foreground px-1">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${document.id}-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-xl border border-border shadow-sm overflow-hidden">
              {pdfUrl && isPdf ? (
                <PdfPreviewCanvas
                  url={pdfUrl}
                  page={page}
                  fields={extraction?.fields ?? []}
                  showHighlights={showHighlights}
                  scanning={scanning}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[min(72vh,520px)] px-8 text-center gap-2 bg-white">
                  <FileText className="w-8 h-8 text-muted-foreground/25" />
                  <p className="text-sm text-muted-foreground">Preview unavailable</p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
