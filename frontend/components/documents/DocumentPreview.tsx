"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, User, Scale, FileBarChart,
  Sparkles, ChevronLeft, ChevronRight,
  Loader2, CheckCircle2, Eye, Maximize2,
  ScanLine, Brain, AlertCircle, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document } from "@/lib/types";

const docTypeConfig = {
  invoice: { icon: FileText, color: "text-violet-500", label: "Invoice" },
  resume: { icon: User, color: "text-blue-500", label: "Resume" },
  contract: { icon: Scale, color: "text-amber-500", label: "Contract" },
  report: { icon: FileBarChart, color: "text-teal-500", label: "Report" },
  unknown: { icon: FileText, color: "text-muted-foreground", label: "Document" },
};

// Simulated document text content for the preview
const mockDocContent: Record<string, { pages: string[] }> = {
  doc_001: {
    pages: [
      `ACME CORPORATION
1200 Market Street, San Francisco, CA 94102
Tax ID: US94-1234567

                                    INVOICE

Invoice Number:  INV-2025-4891
Issue Date:      December 15, 2025
Due Date:        January 15, 2026

BILL TO:
DigitalFlow Ltd.
42 Innovation Drive
Austin, TX 78701

─────────────────────────────────────────────────────
DESCRIPTION                      QTY   UNIT    TOTAL
─────────────────────────────────────────────────────
Q4 2025 Consulting Services        1   7,500   $7,500.00
Platform Integration — Phase 2     1   2,375   $2,375.00
Technical Support (40h)           40      25   $1,000.00
─────────────────────────────────────────────────────
                                        SUBTOTAL  $10,875.00
                                        TAX 14.5%  $1,576.88
                                        TOTAL     $12,451.88

Payment Terms: Net 30
Bank Account: ****4821
Wire Reference: INV-2025-4891`,
    ],
  },
  doc_002: {
    pages: [
      `SARAH MITCHELL
San Francisco, CA  ·  sarah.mitchell@email.com  ·  +1 (415) 555-0192
linkedin.com/in/sarahmitchell  ·  github.com/smitchell-dev

──────────────────────────────────────────────────────
SENIOR FULL-STACK DEVELOPER
──────────────────────────────────────────────────────

SUMMARY
Senior Full-Stack Developer with 8+ years of experience building
scalable web applications at Google and Stripe. Expert in React,
TypeScript, Node.js, Python. Strong cloud infrastructure background.

EXPERIENCE

Stripe                                         2022 — Present
Senior Software Engineer
Led payment infrastructure team handling $2B+ annual transaction
volume. Architected real-time fraud detection service (Node.js, Go).

Google                                         2018 — 2022
Software Engineer II
Built features for Google Workspace used by 3M+ enterprise customers.
Reduced page load by 40% through performance optimization.

──────────────────────────────────────────────────────
SKILLS

Frontend    React, TypeScript, Next.js, Vue.js
Backend     Node.js, Python, Go, GraphQL
Database    PostgreSQL, Redis, MongoDB
Cloud       AWS, GCP, Kubernetes, Terraform

EDUCATION
B.Sc. Computer Science  ·  Stanford University  ·  2016

LANGUAGES
English (Native)  ·  French (Fluent)  ·  Spanish (Conversational)`,
    ],
  },
};

// The "extraction scan" animation — lines that appear highlighted
const extractionHighlights: Record<string, { line: number; field: string; delay: number }[]> = {
  doc_001: [
    { line: 1, field: "company_name", delay: 0.3 },
    { line: 6, field: "invoice_number", delay: 0.8 },
    { line: 7, field: "issue_date", delay: 1.2 },
    { line: 8, field: "due_date", delay: 1.6 },
    { line: 22, field: "total_amount", delay: 2.1 },
    { line: 23, field: "tax_amount", delay: 2.5 },
  ],
  doc_002: [
    { line: 1, field: "full_name", delay: 0.3 },
    { line: 2, field: "email", delay: 0.7 },
    { line: 6, field: "current_title", delay: 1.1 },
    { line: 9, field: "summary", delay: 1.6 },
    { line: 14, field: "current_company", delay: 2.0 },
    { line: 34, field: "education_degree", delay: 2.5 },
  ],
};

interface DocumentPreviewProps {
  document: Document | null;
  isAnalyzing?: boolean;
}

function ScanOverlay({ docId, active }: { docId: string; active: boolean }) {
  const highlights = extractionHighlights[docId] || [];

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Scanning beam */}
          <motion.div
            initial={{ top: "5%" }}
            animate={{ top: ["5%", "90%", "5%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
            style={{ position: "absolute" }}
          />

          {/* Extracted field callouts */}
          {highlights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: h.delay, duration: 0.3 }}
              className="absolute right-3 flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5"
              style={{ top: `${6 + i * 13}%` }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary">{h.field}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DocumentPreview({ document, isAnalyzing = false }: DocumentPreviewProps) {
  const [page, setPage] = useState(0);
  const [scanActive, setScanActive] = useState(false);

  const content = document ? mockDocContent[document.id] : null;
  const pages = content?.pages || [""];
  const totalPages = document?.pages || pages.length;
  const typeConf = document ? docTypeConfig[document.type] : docTypeConfig.unknown;
  const Icon = typeConf.icon;

  // Trigger scan animation on document change
  useEffect(() => {
    if (document && document.status === "completed") {
      setScanActive(true);
      const t = setTimeout(() => setScanActive(false), 4000);
      return () => clearTimeout(t);
    }
  }, [document?.id]);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5"
        >
          <div className="w-20 h-20 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto">
            <Eye className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-medium text-muted-foreground">No document selected</p>
            <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
              Select a document from the list to preview its content and extraction results.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={cn("p-1.5 rounded-lg bg-background", typeConf.color)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate max-w-52">{document.name}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{typeConf.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {document.status === "completed" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setScanActive(true); setTimeout(() => setScanActive(false), 4500); }}
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all",
                scanActive
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground border-transparent hover:border-border"
              )}
            >
              <ScanLine className="w-3 h-3" />
              {scanActive ? "Scanning…" : "Re-scan"}
            </motion.button>
          )}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-[11px] text-muted-foreground px-1">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto p-6 relative bg-background">
        {/* Failed overlay */}
        <AnimatePresence>
          {document.status === "failed" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm gap-3 px-8"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-center max-w-sm">
                <p className="text-sm font-semibold text-foreground">Extraction echouee</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {document.errorMessage?.match(/429|quota|rate_limit|rate limit/i)
                    ? "Limite Groq atteinte (quota ou rate limit). Attends 1 min et reessaie, ou entre une autre cle dans Settings."
                    : document.errorMessage?.slice(0, 200) ?? "Une erreur est survenue lors de l'analyse."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending / demo — not yet analyzed */}
        <AnimatePresence>
          {!isAnalyzing && document.status === "pending" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm gap-3 px-8"
            >
              <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center max-w-xs">
                <p className="text-sm font-semibold text-foreground">Pas encore analyse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {document.id.startsWith("demo_")
                    ? "Document de demonstration. Uploade un vrai fichier pour lancer l'extraction IA."
                    : "En attente de traitement. L'analyse demarrera automatiquement."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Processing overlay — only while actively processing */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-4"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">AI is analyzing</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Extracting structured data…</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {["Parsing", "Classifying", "Extracting"].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.4 }}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground"
                    >
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      {step}
                      {i < 2 && <span className="text-muted-foreground/30 ml-1">·</span>}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page render */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${document.id}-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {/* Document paper */}
            <div className="relative bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <ScanOverlay docId={document.id} active={scanActive} />

              {content?.pages[page] ? (
                <pre className="p-8 text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                  {content.pages[page]}
                </pre>
              ) : (
                <div className="p-8 space-y-3">
                  {/* Simulated document lines for docs without content */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn("p-2 rounded-lg", typeConf.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="h-4 bg-gray-100 rounded w-48 mb-1.5" />
                      <div className="h-3 bg-gray-50 rounded w-32" />
                    </div>
                  </div>
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3 bg-gray-50 rounded"
                      style={{ width: `${55 + Math.sin(i * 1.4) * 35}%`, opacity: 0.6 + i * 0.02 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confidence badge when completed */}
            {document.status === "completed" && document.confidence && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 mt-4"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-full px-3 py-1.5 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>
                    <strong className="text-foreground">{document.extractedFields} fields</strong> extracted
                    with <strong className="text-emerald-600">{document.confidence}% confidence</strong>
                  </span>
                  <Sparkles className="w-3 h-3 text-primary/60" />
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
