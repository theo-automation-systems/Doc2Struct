"use client";

import { motion } from "framer-motion";
import {
  Upload,
  Download,
  Layers,
  Zap,
  BarChart2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Scale,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockActivityItems } from "@/lib/mock-data";
import type { ActivityItem } from "@/lib/types";

const typeIcons = {
  upload: Upload,
  export: Download,
  extraction: Layers,
  automation: Zap,
  analysis: BarChart2,
};

const docTypeIcons = {
  invoice: FileText,
  resume: User,
  contract: Scale,
  report: FileBarChart,
  unknown: FileText,
};

const docTypeColors = {
  invoice: "text-violet-500 bg-violet-500/10",
  resume: "text-blue-500 bg-blue-500/10",
  contract: "text-amber-500 bg-amber-500/10",
  report: "text-teal-500 bg-teal-500/10",
  unknown: "text-muted-foreground bg-muted",
};

const statusIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
};

const statusColors = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
};

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function ActivityItemRow({ item, index }: { item: ActivityItem; index: number }) {
  const TypeIcon = typeIcons[item.type];
  const DocIcon = docTypeIcons[item.documentType];
  const StatusIcon = statusIcons[item.status];
  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-3 py-3 group hover:bg-muted/30 px-3 -mx-3 rounded-xl transition-colors cursor-default"
    >
      <div className={cn("p-1.5 rounded-lg mt-0.5 shrink-0", docTypeColors[item.documentType])}>
        <DocIcon className="w-3 h-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <TypeIcon className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{typeLabel}</span>
          <StatusIcon className={cn("w-3 h-3 ml-auto shrink-0", statusColors[item.status])} />
        </div>
        <p className="text-xs font-medium text-foreground truncate">{item.documentName}</p>
        {item.details && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.details}</p>
        )}
      </div>
      <span className="text-[11px] text-muted-foreground/60 shrink-0 mt-0.5">{timeAgo(item.timestamp)}</span>
    </motion.div>
  );
}

export function ActivityFeed() {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          <p className="text-xs text-muted-foreground">Latest document events</p>
        </div>
        <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          View all
        </button>
      </div>
      <div className="space-y-0">
        {mockActivityItems.slice(0, 7).map((item, i) => (
          <ActivityItemRow key={item.id} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}
