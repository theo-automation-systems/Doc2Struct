"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { mockDocuments } from "@/lib/mock-data";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  X,
  Loader2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const exportFormats = [
  {
    id: "csv",
    label: "CSV Export",
    description: "Comma-separated values — compatible with Excel, Google Sheets, and all BI tools.",
    icon: FileSpreadsheet,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    ext: ".csv",
  },
  {
    id: "json",
    label: "JSON Export",
    description: "Structured JSON data — perfect for APIs, databases, and developer workflows.",
    icon: FileJson,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    ext: ".json",
  },
  {
    id: "excel",
    label: "Excel Export",
    description: "Microsoft Excel format with formatted tables and multiple sheets.",
    icon: FileSpreadsheet,
    color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    ext: ".xlsx",
  },
  {
    id: "notion",
    label: "Notion Database",
    description: "Export directly to a Notion database. Requires Notion API integration.",
    icon: ExternalLink,
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    ext: "Notion",
    premium: true,
  },
];

const recentExports = [
  { name: "Invoice_Acme_Corp_Q4-2025", format: "CSV", date: "Today at 09:26", size: "4.2 KB", status: "success" },
  { name: "Partnership_Agreement_Nexus_2025", format: "JSON + Notion", date: "Dec 15 at 08:35", size: "8.7 KB", status: "success" },
  { name: "Resume_Sarah_Mitchell", format: "JSON", date: "Dec 17 at 14:15", size: "3.1 KB", status: "success" },
  { name: "Q3_Financial_Report_2025", format: "Excel", date: "Dec 16 at 17:00", size: "22.4 KB", status: "success" },
];

interface ExportModalProps {
  doc: typeof mockDocuments[0] | null;
  onClose: () => void;
}

function ExportModal({ doc, onClose }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => { setExporting(false); setDone(true); }, 1800);
  };

  if (!doc) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-semibold">Export Document</p>
            <p className="text-xs text-muted-foreground truncate max-w-[280px]">{doc.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </motion.div>
            <p className="text-sm font-semibold mb-1">Export Complete!</p>
            <p className="text-xs text-muted-foreground mb-5">
              Your file has been exported as {exportFormats.find(f => f.id === selectedFormat)?.ext}
            </p>
            <Button size="sm" onClick={onClose} className="text-xs">Done</Button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Format</p>
            <div className="grid grid-cols-2 gap-2">
              {exportFormats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    selectedFormat === fmt.id
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-border/80 bg-muted/30"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2 border", fmt.color)}>
                    <fmt.icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{fmt.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{fmt.description}</p>
                  {fmt.premium && (
                    <Badge className="mt-1.5 text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20">Pro</Badge>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={onClose}>Cancel</Button>
              <Button size="sm" className="flex-1 h-9 text-xs gap-1.5" onClick={handleExport} disabled={exporting}>
                {exporting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting...</>
                ) : (
                  <><Download className="w-3.5 h-3.5" /> Export Now</>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function ExportsPage() {
  const [exportModalDoc, setExportModalDoc] = useState<typeof mockDocuments[0] | null>(null);

  const completedDocs = mockDocuments.filter((d) => d.status === "completed");

  return (
    <MainLayout title="Exports" subtitle="Download extracted data in your preferred format">
      <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Format Cards */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Available Formats</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {exportFormats.map((fmt, i) => (
              <motion.div
                key={fmt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={cn(
                  "p-4 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all group cursor-default",
                  fmt.color.split(" ")[1] === "bg-emerald-500/10" ? "hover:border-emerald-500/30" :
                  fmt.color.split(" ")[1] === "bg-blue-500/10" ? "hover:border-blue-500/30" :
                  fmt.color.split(" ")[1] === "bg-teal-500/10" ? "hover:border-teal-500/30" :
                  "hover:border-violet-500/30"
                )}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3 border", fmt.color)}>
                  <fmt.icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">{fmt.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{fmt.description}</p>
                {fmt.premium && (
                  <Badge className="mt-2 text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20">Pro Feature</Badge>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Documents */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Ready to Export</h3>
                <p className="text-xs text-muted-foreground">{completedDocs.length} documents available</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <Package className="w-3 h-3" /> Bulk Export
              </Button>
            </div>
            <div className="space-y-2">
              {completedDocs.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-muted/30 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{doc.type} · {doc.extractedFields} fields</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-all text-primary hover:text-primary"
                    onClick={() => setExportModalDoc(doc)}
                  >
                    <Download className="w-3 h-3" /> Export
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Exports */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Recent Exports</h3>
                <p className="text-xs text-muted-foreground">Your export history</p>
              </div>
              <button className="text-xs text-primary hover:text-primary/80 font-medium">View all</button>
            </div>
            <div className="space-y-2">
              {recentExports.map((exp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{exp.name}</p>
                    <p className="text-[11px] text-muted-foreground">{exp.format} · {exp.size} · {exp.date}</p>
                  </div>
                  <button className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Notion Integration CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/8 to-transparent p-5 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Connect Notion Integration</p>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                  Export extracted data directly to Notion databases. Automate your document-to-Notion workflow in seconds.
                </p>
              </div>
            </div>
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 shrink-0">
              Connect Notion <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </motion.div>
      </div>
      </div>

      <AnimatePresence>
        {exportModalDoc && (
          <ExportModal doc={exportModalDoc} onClose={() => setExportModalDoc(null)} />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
