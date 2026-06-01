"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Table2,
  LayoutGrid,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExtractionResult as ExtractionResultType } from "@/lib/types";

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 95 ? "bg-emerald-500" : value >= 80 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      <span className={cn(
        "text-[11px] font-medium",
        value >= 95 ? "text-emerald-500" : value >= 80 ? "text-amber-500" : "text-red-500"
      )}>{value}%</span>
    </div>
  );
}

function FieldRow({ field, index }: { field: ExtractionResultType["fields"][0]; index: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    Array.isArray(field.value) ? field.value.join(", ") : String(field.value ?? "—")
  );

  const displayKey = field.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
    >
      <td className="py-2.5 pl-4 pr-3">
        <span className="text-xs font-medium text-muted-foreground font-mono">{field.key}</span>
        <span className="text-[10px] text-muted-foreground/50 ml-1.5 uppercase">{field.type}</span>
      </td>
      <td className="py-2.5 px-3">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 text-xs bg-background border border-primary rounded-md px-2 py-1 outline-none"
              autoFocus
            />
            <button onClick={() => setEditing(false)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group/val">
            <span className="text-xs font-medium text-foreground">{value}</span>
            <button
              onClick={() => setEditing(true)}
              className="p-0.5 opacity-0 group-hover/val:opacity-100 hover:bg-muted rounded transition-all text-muted-foreground"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </td>
      <td className="py-2.5 pr-4">
        <ConfidenceBar value={field.confidence} />
      </td>
    </motion.tr>
  );
}

type ViewMode = "table" | "cards" | "json";

export function ExtractionResultPanel({ result }: { result: ExtractionResultType }) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [copied, setCopied] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result.rawJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <button
          onClick={() => setSummaryExpanded(!summaryExpanded)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">AI Summary</p>
              <p className="text-xs text-muted-foreground">Document overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {result.confidence}% confidence
            </Badge>
            {summaryExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {summaryExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            className="border-t border-border overflow-hidden"
          >
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.keyInsights.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                    <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-wide mb-2">Key Insights</p>
                    <ul className="space-y-1">
                      {result.keyInsights.map((insight, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.actionItems.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wide mb-2">Action Items</p>
                    <ul className="space-y-1">
                      {result.actionItems.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-emerald-500 mt-0.5 shrink-0">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wide mb-2">Warnings</p>
                    <ul className="space-y-1">
                      {result.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Extraction Data */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-semibold">Extracted Fields</p>
            <p className="text-xs text-muted-foreground">{result.fields.length} fields · {result.processingTime}ms</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
              {[
                { mode: "table" as ViewMode, icon: Table2 },
                { mode: "cards" as ViewMode, icon: LayoutGrid },
                { mode: "json" as ViewMode, icon: Code2 },
              ].map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={copyJson}>
              {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy JSON"}
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <Download className="w-3 h-3" />
              Export
            </Button>
          </div>
        </div>

        {viewMode === "table" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide py-2.5 pl-4 pr-3">Field</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide py-2.5 px-3">Value</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide py-2.5 pr-4">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {result.fields.map((field, i) => (
                  <FieldRow key={field.key} field={field} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === "cards" && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {result.fields.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/20 transition-colors"
              >
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {field.key.replace(/_/g, " ")}
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {Array.isArray(field.value) ? field.value.join(", ") : String(field.value ?? "—")}
                </p>
                <ConfidenceBar value={field.confidence} />
              </motion.div>
            ))}
          </div>
        )}

        {viewMode === "json" && (
          <div className="relative">
            <pre className="p-5 text-xs font-mono text-foreground/80 bg-muted/20 overflow-x-auto leading-relaxed">
              {JSON.stringify(result.rawJson, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
