"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ChevronRight,
  TrendingUp,
  Tag,
  Lightbulb,
  Copy,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockAIInsights } from "@/lib/mock-data";
import type { AIInsight } from "@/lib/types";

interface AIPanelProps {
  open: boolean;
  onClose: () => void;
  documentName?: string;
}

const insightIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: X,
};

const insightColors = {
  info: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  warning: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  error: "text-red-500 bg-red-500/10 border-red-500/20",
};

function InsightCard({ insight }: { insight: AIInsight }) {
  const Icon = insightIcons[insight.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-xl border",
        insightColors[insight.type]
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn("mt-0.5 p-1 rounded-lg", insightColors[insight.type])}>
          <Icon className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-xs font-semibold text-foreground">{insight.title}</p>
            {insight.confidence && (
              <span className="text-[10px] text-muted-foreground shrink-0">{insight.confidence}%</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
          {insight.entities && insight.entities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {insight.entities.map((entity, i) => (
                <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-background/60 border border-border text-foreground/70">
                  {entity}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AIPanel({ open, onClose, documentName }: AIPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="w-80 flex flex-col h-full border-l border-border bg-background overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Insights</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                  <span className="text-[10px] text-muted-foreground">Active</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Context */}
            {documentName && (
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Analyzing</p>
                <p className="text-xs font-medium text-foreground truncate">{documentName}</p>
              </div>
            )}

            {/* AI Thinking State */}
            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center gap-2.5 mb-3">
                <Wand2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">AI Analysis</span>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  Complete
                </Badge>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Document parsing", done: true },
                  { label: "Entity extraction", done: true },
                  { label: "Cross-validation", done: true },
                  { label: "Risk assessment", done: true },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0", step.done ? "bg-emerald-500/15" : "bg-muted")}>
                      <CheckCircle2 className={cn("w-2.5 h-2.5", step.done ? "text-emerald-500" : "text-muted-foreground")} />
                    </div>
                    <span className={cn("text-xs", step.done ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold">Insights</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{mockAIInsights.length} found</span>
              </div>
              {mockAIInsights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>

            {/* Extracted Entities */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold">Key Entities</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Acme Corporation", "DigitalFlow Ltd.", "$12,451.88", "Jan 15, 2026", "INV-2025-4891", "Net 30", "USD", "Q4 2025"].map((entity, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/8 text-primary/80 border border-primary/15 cursor-default hover:bg-primary/15 transition-colors"
                  >
                    {entity}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Confidence Score */}
            <div className="mx-4 mb-4 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold">Overall Confidence</span>
                </div>
                <span className="text-sm font-bold text-emerald-500">98%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "98%" }}
                  transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Very high confidence — all critical fields verified
              </p>
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold">Quick Actions</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Copy extracted JSON", icon: Copy },
                  { label: "Re-analyze document", icon: RefreshCw },
                  { label: "Generate summary report", icon: Sparkles },
                ].map((action, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-primary/30 transition-all text-left group"
                  >
                    <action.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30 ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
