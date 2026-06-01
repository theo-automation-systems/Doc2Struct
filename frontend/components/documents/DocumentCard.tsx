"use client";

import { motion } from "framer-motion";
import {
  FileText,
  User,
  Scale,
  FileBarChart,
  MoreHorizontal,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  ExternalLink,
  Download,
  Trash2,
  Eye,
  ChevronRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Document } from "@/lib/types";

const docTypeConfig = {
  invoice: { icon: FileText, color: "text-violet-500 bg-violet-500/10 border-violet-500/20", label: "Invoice" },
  resume: { icon: User, color: "text-blue-500 bg-blue-500/10 border-blue-500/20", label: "Resume" },
  contract: { icon: Scale, color: "text-amber-500 bg-amber-500/10 border-amber-500/20", label: "Contract" },
  report: { icon: FileBarChart, color: "text-teal-500 bg-teal-500/10 border-teal-500/20", label: "Report" },
  unknown: { icon: FileText, color: "text-muted-foreground bg-muted border-border", label: "Document" },
};

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-emerald-500", label: "Completed" },
  processing: { icon: Loader2, color: "text-primary animate-spin", label: "Processing" },
  failed: { icon: XCircle, color: "text-red-500", label: "Failed" },
  pending: { icon: Clock, color: "text-amber-500", label: "Pending" },
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface DocumentCardProps {
  document: Document;
  onClick?: () => void;
  selected?: boolean;
  index?: number;
}

export function DocumentCard({ document, onClick, selected, index = 0 }: DocumentCardProps) {
  const typeConf = docTypeConfig[document.type];
  const statusConf = statusConfig[document.status];
  const TypeIcon = typeConf.icon;
  const StatusIcon = statusConf.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className={cn(
        "group relative bg-card rounded-2xl border p-4 cursor-pointer transition-all duration-200",
        selected
          ? "border-primary/40 shadow-md shadow-primary/10 ring-1 ring-primary/20"
          : "border-border hover:border-border/80 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("p-2.5 rounded-xl border shrink-0 transition-all", typeConf.color)}>
          <TypeIcon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="text-sm font-medium text-foreground truncate leading-tight">{document.name}</p>
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all text-muted-foreground hover:text-foreground shrink-0"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className="gap-2 text-xs">
                  <Eye className="w-3.5 h-3.5" /> View document
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-xs">
                  <Layers className="w-3.5 h-3.5" /> View extraction
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-xs">
                  <Download className="w-3.5 h-3.5" /> Export as CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-xs text-red-500 focus:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md border", typeConf.color)}>
              {typeConf.label}
            </span>
            <span className="text-[11px] text-muted-foreground">{formatSize(document.size)}</span>
            {document.pages && (
              <span className="text-[11px] text-muted-foreground">{document.pages}p</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <StatusIcon className={cn("w-3 h-3 shrink-0", statusConf.color)} />
              <span className={cn("text-[11px] font-medium", statusConf.color)}>{statusConf.label}</span>
            </div>
            {document.confidence !== undefined && document.confidence > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${document.confidence}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{document.confidence}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{formatDate(document.uploadedAt)}</span>
        {document.extractedFields !== undefined && document.extractedFields > 0 && (
          <span className="text-[11px] text-muted-foreground">{document.extractedFields} fields extracted</span>
        )}
      </div>

      {selected && (
        <div className="absolute right-3 top-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      )}
    </motion.div>
  );
}
