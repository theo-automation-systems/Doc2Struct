"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { UploadZone } from "@/components/documents/UploadZone";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { getStats, listDocuments, toFrontendDocument } from "@/lib/api";
import {
  FileText, User, Scale, FileBarChart,
  ArrowRight, Target, CheckCircle2,
  Sparkles, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Document } from "@/lib/types";

const docTypeConfig = {
  invoice: { icon: FileText, color: "text-violet-500 bg-violet-500/10" },
  resume: { icon: User, color: "text-blue-500 bg-blue-500/10" },
  contract: { icon: Scale, color: "text-amber-500 bg-amber-500/10" },
  report: { icon: FileBarChart, color: "text-teal-500 bg-teal-500/10" },
  unknown: { icon: FileText, color: "text-muted-foreground bg-muted" },
};

export default function DashboardPage() {
  const router = useRouter();
  const { upload } = useDocuments();
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [stats, setStats] = useState<{
    processed: number;
    accuracy: number;
    completed: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      getStats().catch(() => null),
      listDocuments({ limit: 20 }).catch(() => []),
    ]).then(([s, docs]) => {
      if (s) {
        setStats({
          processed: s.documents_processed,
          accuracy: s.extraction_accuracy,
          completed: 0,
        });
      }
      const completed = docs
        .filter((d) => d.status === "completed")
        .map(toFrontendDocument)
        .slice(0, 5);
      setRecentDocs(completed);
      if (s) {
        setStats((prev) => prev ? { ...prev, completed: completed.length } : null);
      }
    });
  }, []);

  const handleUpload = async (file: File) => {
    const doc = await upload(file);
    if (doc) {
      router.push(`/workspace?doc=${doc.id}`);
    }
  };

  const showKpis = stats && stats.processed > 0;

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12 space-y-12">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-medium text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                AI Processing Active
              </div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight leading-snug">
                Upload a document.<br />
                <span className="text-muted-foreground font-normal">Get structured data instantly.</span>
              </h2>
              <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
                Doc2Struct reads invoices, CVs, contracts and reports —
                and returns clean, structured JSON via Groq.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <UploadZone onFileAccepted={handleUpload} />
            </div>

            <div className="flex items-center gap-3">
              <Link href="/workspace">
                <Button variant="outline" size="sm" className="h-9 text-sm gap-2">
                  Open workspace <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, XLSX, TXT — up to 50 MB
              </p>
            </div>
          </motion.div>

          {showKpis && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border">
                <div className="p-2 rounded-xl bg-muted">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{stats!.processed}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Documents processed</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border">
                <div className="p-2 rounded-xl bg-muted">
                  <Target className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{stats!.accuracy}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Avg. extraction confidence</p>
                </div>
              </div>
            </motion.div>
          )}

          {recentDocs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Recent documents</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Latest processed files</p>
                </div>
                <Link href="/workspace">
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground">
                    View all <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                {recentDocs.map((doc, i) => {
                  const conf = docTypeConfig[doc.type];
                  const Icon = conf.icon;
                  return (
                    <Link key={doc.id} href={`/workspace?doc=${doc.id}`}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group"
                      >
                        <div className={cn("p-1.5 rounded-lg shrink-0", conf.color)}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                        </div>
                        {doc.confidence && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs text-muted-foreground">{doc.confidence}%</span>
                          </div>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}

          {recentDocs.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40" />
              No analyzed documents yet — upload a file or try the sample documents in the workspace.
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
