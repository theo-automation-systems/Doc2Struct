"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { ExtractionResultPanel } from "@/components/extraction/ExtractionResult";
import { AIFindingsPanel } from "@/components/documents/AIFindingsPanel";
import { UploadZone } from "@/components/documents/UploadZone";
import { useDocuments } from "@/lib/hooks/useDocuments";
import {
  FileText, User, Scale, FileBarChart,
  CheckCircle2, Loader2, XCircle, Clock,
  Search, X, Upload,
  ChevronRight, MoreHorizontal, Download, Trash2,
  Layers, Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Document, DocumentType } from "@/lib/types";

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
}: {
  doc: Document;
  selected: boolean;
  onClick: () => void;
  index: number;
  onDelete?: () => void;
}) {
  const typeConf = docTypeConfig[doc.type];
  const statusConf = statusConfig[doc.status];
  const TypeIcon = typeConf.icon;
  const StatusIcon = statusConf.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
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
          <span className="text-muted-foreground/30">-</span>
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
      <div className="shrink-0 flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="w-3 h-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem className="gap-2 text-xs">
              <Layers className="w-3.5 h-3.5" /> View extraction
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-xs">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-xs text-red-500 focus:text-red-500"
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export default function DocumentsPage() {
  const { documents, extractions, loading, backendOnline, backendChecking, upload, remove, refresh } = useDocuments();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [typeFilter, setTypeFilter] = useState<DocumentType | "all">("all");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "extraction">("preview");

  // Select first doc once list loads
  useEffect(() => {
    if (!selectedDoc && documents.length > 0) setSelectedDoc(documents[0]);
  }, [documents, selectedDoc]);

  // Keep selected doc in sync with polling updates (status, error, etc.)
  useEffect(() => {
    if (!selectedDoc) return;
    const updated = documents.find(d => d.id === selectedDoc.id);
    if (!updated) return;
    const changed =
      updated.status !== selectedDoc.status ||
      updated.confidence !== selectedDoc.confidence ||
      updated.errorMessage !== selectedDoc.errorMessage ||
      updated.summary !== selectedDoc.summary;
    if (changed) setSelectedDoc(updated);
  }, [documents, selectedDoc]);

  const filtered = documents.filter((doc) => {
    const matchType = typeFilter === "all" || doc.type === typeFilter;
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const extraction = selectedDoc ? extractions[selectedDoc.id] ?? null : null;
  const isAnalyzing = selectedDoc?.status === "processing";
  const completedCount = documents.filter(d => d.status === "completed").length;
  const pageSubtitle = `${documents.length} documents - ${completedCount} processed`;

  const handleUpload = async (file: File) => {
    const newDoc = await upload(file);
    if (newDoc) setSelectedDoc(newDoc);
    setShowUpload(false);
  };

  const handleDelete = async (id: string) => {
    if (selectedDoc?.id === id) setSelectedDoc(null);
    await remove(id);
  };

  return (
    <MainLayout
      title="Documents"
      subtitle={pageSubtitle}
      documentName={selectedDoc?.name}
    >
      {/* Backend status bar */}
      <div className={cn(
        "flex items-center justify-between px-4 py-1.5 text-[11px] border-b border-border shrink-0 transition-colors",
        backendChecking ? "bg-muted/50 text-muted-foreground"
          : backendOnline ? "bg-emerald-500/5 text-emerald-600" : "bg-amber-500/5 text-amber-600"
      )}>
        <div className="flex items-center gap-1.5">
          {backendChecking
            ? <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Connexion au backend Railway...</span>
            : backendOnline
            ? <span className="flex items-center gap-1.5"><Wifi className="w-3 h-3" /> Backend connecte - extractions IA actives</span>
            : <span className="flex items-center gap-1.5"><WifiOff className="w-3 h-3" /> Backend hors ligne - donnees de demonstration</span>
          }
        </div>
        <button onClick={refresh} className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          Actualiser
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── PANEL 1: Document List (240px) ── */}
        <div className="w-60 shrink-0 flex flex-col border-r border-border bg-background">
          {/* List header */}
          <div className="px-4 pt-4 pb-3 space-y-2.5 border-b border-border">
            {/* Search */}
            <div className="flex items-center gap-2 bg-muted rounded-lg px-2.5 py-2 border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-all">
              <Search className="w-3 h-3 text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Upload button */}
            <button
              onClick={() => setShowUpload(!showUpload)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                showUpload
                  ? "bg-primary text-white border-primary"
                  : "bg-muted text-muted-foreground border-transparent hover:border-border hover:text-foreground"
              )}
            >
              <Upload className="w-3 h-3 shrink-0" />
              Upload document
            </button>
          </div>

          {/* Inline upload zone */}
          <AnimatePresence>
            {showUpload && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border"
              >
                <div className="p-3">
                  <UploadZone onFileAccepted={handleUpload} compact />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type filter pills */}
          <div className="px-3 py-2 border-b border-border flex gap-1 overflow-x-auto">
            {filterTypes.map((ft) => (
              <button
                key={ft.value}
                onClick={() => setTypeFilter(ft.value)}
                className={cn(
                  "text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap transition-all shrink-0",
                  typeFilter === ft.value
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {ft.label}
              </button>
            ))}
          </div>

          {/* Doc list */}
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
                    onClick={() => { setSelectedDoc(doc); setActiveTab("preview"); }}
                    index={i}
                    onDelete={() => handleDelete(doc.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── PANEL 2: Document Preview (center, flexible) ── */}
        <div className="flex-1 min-w-0 flex flex-col border-r border-border overflow-hidden">
          {selectedDoc ? (
            <>
              {/* Tab bar: Preview / Extraction */}
              <div className="flex items-center gap-0 border-b border-border px-5 bg-muted/20 shrink-0">
                {(["preview", "extraction"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "relative px-4 py-3 text-xs font-semibold capitalize transition-colors",
                      activeTab === tab
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      />
                    )}
                    {tab === "extraction" && extraction && (
                      <span className="ml-1.5 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        {extraction.fields.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeTab === "preview" ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full overflow-hidden"
                    >
                      <DocumentPreview
                        document={selectedDoc}
                        isAnalyzing={isAnalyzing}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="extraction"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full overflow-y-auto p-6"
                    >
                      {extraction ? (
                        <ExtractionResultPanel result={extraction} />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                            <Layers className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {isAnalyzing ? "Extraction in progress…" : "No extraction data"}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-xs">
                            {isAnalyzing
                              ? "The AI is processing this document. Results will appear shortly."
                              : "This document has not been processed yet."}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground">Select a document</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Choose a file from the list to preview
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── PANEL 3: AI Findings sidebar ── */}
        <AnimatePresence>
          {selectedDoc && extraction && (
            <motion.div
              key={selectedDoc.id}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 272, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="shrink-0 overflow-hidden border-l border-border bg-background flex flex-col"
            >
              {/* Panel header */}
              <div className="px-4 py-3 border-b border-border shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {selectedDoc.name.split(".").slice(0, -1).join(".").slice(0, 28) || selectedDoc.name.slice(0, 28)}
                </p>
              </div>
              <AIFindingsPanel
                result={extraction}
                processingTime={extraction.processingTime}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </MainLayout>
  );
}
