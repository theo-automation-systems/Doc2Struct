"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { ExtractionResultPanel } from "@/components/extraction/ExtractionResult";
import { ExportActions } from "@/components/workspace/ExportActions";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { SAMPLE_DOC_IDS } from "@/lib/mock-data";
import {
  FileText, User, Scale, FileBarChart,
  CheckCircle2, Loader2, XCircle, Clock,
  Search, X, Upload,
  Trash2,
  Layers, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document, DocumentType } from "@/lib/types";

import {
  ACCEPTED_FILE_ACCEPT,
  isAcceptedFile,
  unsupportedFileMessage,
} from "@/lib/accepted-file-types";

const docTypeConfig = {
  invoice: { icon: FileText, color: "text-violet-500 bg-violet-500/10", label: "Invoice" },
  resume: { icon: User, color: "text-blue-500 bg-blue-500/10", label: "Resume" },
  contract: { icon: Scale, color: "text-amber-500 bg-amber-500/10", label: "Contract" },
  report: { icon: FileBarChart, color: "text-teal-500 bg-teal-500/10", label: "Report" },
  unknown: { icon: FileText, color: "text-muted-foreground bg-muted", label: "Document" },
};

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-emerald-500" },
  processing: { icon: Loader2, color: "text-primary animate-spin" },
  failed: { icon: XCircle, color: "text-red-500" },
  pending: { icon: Clock, color: "text-amber-500" },
};

const filterTypes: { label: string; value: DocumentType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Invoices", value: "invoice" },
  { label: "Resumes", value: "resume" },
  { label: "Contracts", value: "contract" },
  { label: "Reports", value: "report" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DocListItem({
  doc,
  selected,
  onClick,
  index,
  onDelete,
  canDelete,
}: {
  doc: Document;
  selected: boolean;
  onClick: () => void;
  index: number;
  onDelete?: () => void;
  canDelete?: boolean;
}) {
  const typeConf = docTypeConfig[doc.type];
  const statusConf = statusConfig[doc.status];
  const TypeIcon = typeConf.icon;
  const StatusIcon = statusConf.icon;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 px-3 py-3 mx-2 rounded-xl cursor-pointer transition-all",
        selected
          ? "bg-primary/8 border border-primary/15"
          : "border border-transparent hover:bg-muted/50"
      )}
    >
      <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", typeConf.color)}>
        <TypeIcon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-semibold leading-tight truncate",
          selected ? "text-foreground" : "text-foreground/80"
        )}>
          {doc.name.split(".").slice(0, -1).join(".") || doc.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <StatusIcon className={cn("w-2.5 h-2.5 shrink-0", statusConf.color)} />
          <span className="text-[10px] text-muted-foreground capitalize">{doc.status}</span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-[10px] text-muted-foreground">{formatDate(doc.uploadedAt)}</span>
        </div>
        {doc.status === "completed" && doc.confidence && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-14 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${doc.confidence}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{doc.confidence}%</span>
          </div>
        )}
      </div>
      {canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          title="Delete"
          className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all text-muted-foreground hover:text-red-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

export function DocumentWorkspace() {
  const {
    documents, extractions, loading, analyzingDocId, analyzeError,
    upload, analyze, remove, getPreviewUrl,
  } = useDocuments();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [typeFilter, setTypeFilter] = useState<DocumentType | "all">("all");
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get("doc");
    const openUpload = params.get("upload") === "1";

    if (docId && documents.length > 0) {
      const match = documents.find((d) => d.id === docId);
      if (match) setSelectedDoc(match);
      window.history.replaceState({}, "", "/workspace");
    } else if (openUpload) {
      window.history.replaceState({}, "", "/workspace");
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  }, [documents]);

  useEffect(() => {
    if (!selectedDoc && documents.length > 0) setSelectedDoc(documents[0]);
  }, [documents, selectedDoc]);

  useEffect(() => {
    if (!selectedDoc) return;
    const updated = documents.find(d => d.id === selectedDoc.id);
    if (!updated) {
      // Sample replaced by API upload (new id) — follow the in-flight analysis
      const replacement =
        (analyzingDocId && documents.find(d => d.id === analyzingDocId)) ??
        documents.find(d => d.name === selectedDoc.name && d.status === "processing") ??
        documents.find(d => d.name === selectedDoc.name);
      if (replacement) setSelectedDoc(replacement);
      return;
    }
    const changed =
      updated.status !== selectedDoc.status ||
      updated.confidence !== selectedDoc.confidence ||
      updated.errorMessage !== selectedDoc.errorMessage ||
      updated.summary !== selectedDoc.summary;
    if (changed) setSelectedDoc(updated);
  }, [documents, selectedDoc, analyzingDocId]);

  const filtered = documents.filter((doc) => {
    const matchType = typeFilter === "all" || doc.type === typeFilter;
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const activeDocId = analyzingDocId ?? selectedDoc?.id ?? null;
  const activeDoc = activeDocId ? documents.find(d => d.id === activeDocId) ?? selectedDoc : selectedDoc;
  const extraction = activeDoc ? extractions[activeDoc.id] ?? null : null;
  const isAnalyzing = analyzingDocId != null;
  const canExport = !!selectedDoc && selectedDoc.status === "completed" && !SAMPLE_DOC_IDS.has(selectedDoc.id);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAcceptedFile(file)) {
      setUploadWarning(unsupportedFileMessage([file.name]));
      return;
    }
    setUploadWarning(null);
    const newDoc = await upload(file);
    if (newDoc) setSelectedDoc(newDoc);
  };

  useEffect(() => {
    if (!uploadWarning) return;
    const t = setTimeout(() => setUploadWarning(null), 8000);
    return () => clearTimeout(t);
  }, [uploadWarning]);

  const handleDelete = async (id: string) => {
    if (selectedDoc?.id === id) setSelectedDoc(null);
    await remove(id);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_FILE_ACCEPT}
        onChange={handleFileChange}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-60 shrink-0 flex flex-col border-r border-border bg-background">
          <div className="px-4 pt-4 pb-3 space-y-3 border-b border-border">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-2.5 py-2 border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-all">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
            >
              <Upload className="w-4 h-4 shrink-0" />
              Upload document
            </button>
            {uploadWarning && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-2.5 py-2 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p className="flex-1">{uploadWarning}</p>
                <button
                  type="button"
                  onClick={() => setUploadWarning(null)}
                  className="shrink-0 p-0.5 rounded hover:bg-amber-500/10"
                  aria-label="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-b border-border flex justify-center gap-0.5">
            {filterTypes.map((ft) => (
              <button
                key={ft.value}
                onClick={() => setTypeFilter(ft.value)}
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap transition-all",
                  typeFilter === ft.value
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {ft.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10 px-4">
                <FileText className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No documents</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((doc, i) => (
                  <DocListItem
                    key={doc.id}
                    doc={doc}
                    selected={selectedDoc?.id === doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    index={i}
                    onDelete={() => handleDelete(doc.id)}
                    canDelete
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-muted/10">
          <DocumentPreview
            document={activeDoc ?? selectedDoc}
            previewUrl={getPreviewUrl(activeDoc ?? selectedDoc)}
            extraction={extraction}
            isAnalyzing={isAnalyzing}
            onAnalyze={
              selectedDoc &&
              (selectedDoc.status === "pending" ||
                selectedDoc.status === "failed" ||
                selectedDoc.status === "completed")
                ? async () => {
                    const result = await analyze(selectedDoc);
                    if (result) setSelectedDoc(result);
                  }
                : undefined
            }
            analyzeLoading={loading}
            analyzeError={analyzeError}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col border-l border-border bg-background overflow-hidden">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              AI Analysis
            </p>
            {selectedDoc && (
              <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                {selectedDoc.name.split(".").slice(0, -1).join(".") || selectedDoc.name}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selectedDoc ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Layers className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-xs text-muted-foreground">No document selected</p>
              </div>
            ) : extraction ? (
              <ExtractionResultPanel result={extraction} compact />
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <Loader2 className="w-6 h-6 text-primary animate-spin mb-3" />
                <p className="text-xs text-muted-foreground">Analyzing document…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <Layers className="w-8 h-8 text-muted-foreground/25 mb-3" />
                <p className="text-xs text-muted-foreground">
                  Click Analyze in the preview
                </p>
              </div>
            )}
          </div>

          {selectedDoc && (
            <ExportActions
              documentId={selectedDoc.id}
              documentName={selectedDoc.name}
              disabled={!canExport}
            />
          )}
        </div>
      </div>
    </div>
  );
}
