"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { ExtractionResultPanel } from "@/components/extraction/ExtractionResult";
import { mockDocuments, mockExtractionResults } from "@/lib/mock-data";
import {
  FileText,
  User,
  Scale,
  FileBarChart,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document } from "@/lib/types";

const docTypeConfig = {
  invoice: { icon: FileText, color: "text-violet-500 bg-violet-500/10" },
  resume: { icon: User, color: "text-blue-500 bg-blue-500/10" },
  contract: { icon: Scale, color: "text-amber-500 bg-amber-500/10" },
  report: { icon: FileBarChart, color: "text-teal-500 bg-teal-500/10" },
  unknown: { icon: FileText, color: "text-muted-foreground bg-muted" },
};

const completedDocs = mockDocuments.filter(d => d.status === "completed" && mockExtractionResults[d.id]);

export default function ExtractionsPage() {
  const [selectedDoc, setSelectedDoc] = useState<Document>(completedDocs[0]);

  return (
    <MainLayout
      title="Extractions"
      subtitle="Browse structured data extracted from your documents"
      documentName={selectedDoc?.name}
    >
      <div className="flex h-full min-h-0">
        {/* Left sidebar — doc list */}
        <div className="w-72 shrink-0 flex flex-col border-r border-border overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                placeholder="Search extractions..."
                className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="px-3 py-3 border-b border-border grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: completedDocs.length, icon: FileText, color: "text-primary" },
              { label: "Accuracy", value: "96%", icon: TrendingUp, color: "text-emerald-500" },
              { label: "Avg time", value: "2.1s", icon: Clock, color: "text-amber-500" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-muted/30">
                <s.icon className={cn("w-3.5 h-3.5", s.color)} />
                <span className="text-sm font-bold text-foreground">{s.value}</span>
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Doc list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-2 py-1">
              Processed Documents
            </p>
            {completedDocs.map((doc, i) => {
              const typeConf = docTypeConfig[doc.type];
              const Icon = typeConf.icon;
              const isSelected = selectedDoc?.id === doc.id;

              return (
                <motion.button
                  key={doc.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedDoc(doc)}
                  className={cn(
                    "w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all",
                    isSelected
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/60 border border-transparent"
                  )}
                >
                  <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", typeConf.color)}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium truncate", isSelected ? "text-foreground" : "text-foreground/80")}>
                      {doc.name.replace(/\.[^.]+$/, "")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                      <span className="text-[10px] text-muted-foreground">{doc.extractedFields} fields · {doc.confidence}%</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedDoc && mockExtractionResults[selectedDoc.id] ? (
            <motion.div
              key={selectedDoc.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-5">
                <h2 className="text-base font-semibold text-foreground">{selectedDoc.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {selectedDoc.type} · {selectedDoc.pages} pages ·
                  Processed {new Date(selectedDoc.processedAt!).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric"
                  })}
                </p>
              </div>
              <ExtractionResultPanel result={mockExtractionResults[selectedDoc.id]} />
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">Select a document</p>
                <p className="text-xs text-muted-foreground mt-1">Choose a processed document to view its extraction results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
