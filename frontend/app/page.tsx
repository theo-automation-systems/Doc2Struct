"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { mockDocuments, mockDashboardMetrics } from "@/lib/mock-data";
import { UploadZone } from "@/components/documents/UploadZone";
import {
  FileText, User, Scale, FileBarChart,
  ArrowRight, CheckCircle2, Clock, Target,
  Sparkles, ChevronRight, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Template cards data
const templates = [
  {
    id: "invoice",
    label: "Invoice Processing",
    description: "Extract vendor, amounts, tax, line items and due dates automatically.",
    icon: FileText,
    color: "text-violet-500",
    bg: "bg-violet-500/8 hover:bg-violet-500/12",
    border: "border-violet-500/15 hover:border-violet-500/30",
    fields: ["Invoice #", "Vendor", "Total", "Due date", "Line items"],
    count: "1,284 processed",
  },
  {
    id: "resume",
    label: "Resume Parsing",
    description: "Parse skills, experience, education and contact details from any CV.",
    icon: User,
    color: "text-blue-500",
    bg: "bg-blue-500/8 hover:bg-blue-500/12",
    border: "border-blue-500/15 hover:border-blue-500/30",
    fields: ["Name", "Skills", "Experience", "Education", "Languages"],
    count: "847 processed",
  },
  {
    id: "contract",
    label: "Contract Analysis",
    description: "Identify parties, key clauses, obligations and risk flags in legal documents.",
    icon: Scale,
    color: "text-amber-500",
    bg: "bg-amber-500/8 hover:bg-amber-500/12",
    border: "border-amber-500/15 hover:border-amber-500/30",
    fields: ["Parties", "Effective date", "Value", "Obligations", "Risks"],
    count: "312 processed",
  },
  {
    id: "report",
    label: "Report Summarization",
    description: "Extract KPIs, highlights, risks and action items from business reports.",
    icon: FileBarChart,
    color: "text-teal-500",
    bg: "bg-teal-500/8 hover:bg-teal-500/12",
    border: "border-teal-500/15 hover:border-teal-500/30",
    fields: ["Revenue", "Net profit", "Growth", "Key metrics", "Risks"],
    count: "156 processed",
  },
];

const kpis = [
  { label: "Documents processed", value: "2,847", change: "+18%", icon: FileText },
  { label: "Extraction accuracy", value: "96.2%", change: "+2.1pp", icon: Target },
  { label: "Time saved", value: "142 h", change: "this month", icon: Clock },
];

const recentDocs = mockDocuments.filter(d => d.status === "completed").slice(0, 4);

const docTypeConfig = {
  invoice: { icon: FileText, color: "text-violet-500 bg-violet-500/10" },
  resume: { icon: User, color: "text-blue-500 bg-blue-500/10" },
  contract: { icon: Scale, color: "text-amber-500 bg-amber-500/10" },
  report: { icon: FileBarChart, color: "text-teal-500 bg-teal-500/10" },
  unknown: { icon: FileText, color: "text-muted-foreground bg-muted" },
};

export default function DashboardPage() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <MainLayout title="Home" subtitle="AI document processing platform">
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-12 space-y-16">

        {/* Hero Section */}
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
              Doc2Struct reads any document — invoices, CVs, contracts, reports —
              and returns clean, structured JSON ready for your workflows.
            </p>
          </div>

          {/* Upload Area */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <UploadZone />
          </div>

          <div className="flex items-center gap-3">
            <Link href="/documents">
              <Button variant="outline" size="sm" className="h-9 text-sm gap-2">
                Browse documents <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, XLSX, TXT — up to 50 MB
            </p>
          </div>
        </motion.div>

        {/* 3 KPIs — minimal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="grid grid-cols-3 gap-4"
        >
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border"
            >
              <div className="p-2 rounded-xl bg-muted">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Automation Templates */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="space-y-5"
        >
          <div>
            <h3 className="text-base font-semibold text-foreground">Automation templates</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Choose a preset to extract specific fields from your document type.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                whileHover={{ y: -2 }}
                className={cn(
                  "group relative p-5 rounded-2xl border cursor-pointer transition-all duration-200",
                  tpl.bg, tpl.border
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-2 rounded-xl bg-background/60", tpl.color)}>
                    <tpl.icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {tpl.count}
                  </div>
                </div>

                <p className="text-sm font-semibold text-foreground mb-1">{tpl.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {tpl.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {tpl.fields.map((field) => (
                    <span
                      key={field}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-background/70 border border-border text-muted-foreground"
                    >
                      {field}
                    </span>
                  ))}
                </div>

                <div className={cn(
                  "absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all",
                  "flex items-center gap-1 text-xs font-medium", tpl.color
                )}>
                  Use template <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Documents — clean list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Recent documents</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Latest processed files</p>
            </div>
            <Link href="/documents">
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
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className={cn("p-1.5 rounded-lg shrink-0", conf.color)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {doc.extractedFields && (
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {doc.extractedFields} fields
                      </span>
                    )}
                    {doc.confidence && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${doc.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{doc.confidence}%</span>
                      </div>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </div>
      </div>
    </MainLayout>
  );
}
