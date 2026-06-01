"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { mockAutomations } from "@/lib/mock-data";
import {
  FileText, User, Scale, BarChart3, HeartPulse, ShoppingCart,
  Play, Pause, ChevronRight, CheckCircle2, Clock,
  Plus, Code2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Automation } from "@/lib/types";

const iconMap: Record<string, React.ElementType> = {
  FileText, User, Scale, BarChart: BarChart3, HeartPulse, ShoppingCart,
};

const categoryConfig: Record<string, { color: string; bg: string }> = {
  Finance: { color: "text-violet-500", bg: "bg-violet-500/10" },
  HR: { color: "text-blue-500", bg: "bg-blue-500/10" },
  Legal: { color: "text-amber-500", bg: "bg-amber-500/10" },
  Healthcare: { color: "text-rose-500", bg: "bg-rose-500/10" },
  Procurement: { color: "text-teal-500", bg: "bg-teal-500/10" },
};

function AutomationCard({ auto, index, onSelect, selected }: {
  auto: Automation;
  index: number;
  onSelect: () => void;
  selected: boolean;
}) {
  const Icon = iconMap[auto.icon] || FileText;
  const cat = categoryConfig[auto.category] || { color: "text-muted-foreground", bg: "bg-muted" };
  const isActive = auto.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onSelect}
      className={cn(
        "group p-5 rounded-2xl border cursor-pointer transition-all duration-200",
        selected
          ? "border-primary/30 bg-primary/4 shadow-sm"
          : "border-border bg-card hover:border-border/80 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", cat.bg, cat.color)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{auto.name}</p>
            <span className={cn("text-[10px] font-semibold uppercase tracking-wide", cat.color)}>
              {auto.category}
            </span>
          </div>
        </div>
        <div className={cn(
          "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
          isActive
            ? "text-emerald-600 bg-emerald-500/8 border-emerald-500/20"
            : auto.status === "paused"
            ? "text-amber-600 bg-amber-500/8 border-amber-500/20"
            : "text-muted-foreground bg-muted border-border"
        )}>
          {auto.status.charAt(0).toUpperCase() + auto.status.slice(1)}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-5">{auto.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>{auto.documentsProcessed.toLocaleString()}</span>
          </div>
          {auto.lastRun && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{new Date(auto.lastRun).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant={isActive ? "outline" : "default"}
            className="h-6 px-2.5 text-[11px] gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {isActive ? <><Pause className="w-2.5 h-2.5" /> Pause</> : <><Play className="w-2.5 h-2.5" /> Run</>}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function SchemaPanel({ auto, onClose }: { auto: Automation; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="w-72 shrink-0 border-l border-border bg-background flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <p className="text-sm font-semibold">{auto.name}</p>
          <p className="text-xs text-muted-foreground">Extraction schema</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Fields to extract
          </p>
          <div className="space-y-2">
            {Object.entries(auto.schema).map(([key, type], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-xs font-mono text-foreground">{key}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border font-mono">
                  {type}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stats</p>
          <p className="text-sm font-bold text-foreground">{auto.documentsProcessed.toLocaleString()} processed</p>
          {auto.lastRun && (
            <p className="text-xs text-muted-foreground">
              Last run {new Date(auto.lastRun).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        <Button size="sm" className="w-full text-xs gap-1.5">
          <Play className="w-3 h-3" /> Run on upload
        </Button>
      </div>
    </motion.div>
  );
}

export default function AutomationsPage() {
  const [selected, setSelected] = useState<Automation | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = ["All", ...Array.from(new Set(mockAutomations.map(a => a.category)))];
  const filtered = categoryFilter === "All"
    ? mockAutomations
    : mockAutomations.filter(a => a.category === categoryFilter);

  return (
    <MainLayout title="Automations" subtitle="AI extraction workflows for every document type">
      <div className="flex h-full overflow-hidden">

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-4xl mx-auto px-8 py-10 space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                      categoryFilter === cat
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Button size="sm" className="h-8 text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> New automation
              </Button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8 px-1">
              {[
                { label: "Active", value: mockAutomations.filter(a => a.status === "active").length, color: "text-emerald-500" },
                { label: "Total processed", value: mockAutomations.reduce((s, a) => s + a.documentsProcessed, 0).toLocaleString(), color: "text-foreground" },
                { label: "Accuracy", value: "96.2%", color: "text-foreground" },
              ].map((s, i) => (
                <div key={i}>
                  <p className={cn("text-2xl font-bold tracking-tight", s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((auto, i) => (
                <AutomationCard
                  key={auto.id}
                  auto={auto}
                  index={i}
                  selected={selected?.id === auto.id}
                  onSelect={() => setSelected(selected?.id === auto.id ? null : auto)}
                />
              ))}
            </div>

          </div>
        </div>

        {/* Schema detail panel */}
        <AnimatePresence>
          {selected && (
            <SchemaPanel auto={selected} onClose={() => setSelected(null)} />
          )}
        </AnimatePresence>

      </div>
    </MainLayout>
  );
}
