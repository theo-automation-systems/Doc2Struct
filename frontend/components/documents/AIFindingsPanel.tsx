"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, XCircle, Info,
  Building2, FileText, CalendarDays, DollarSign,
  User, Tag, Hash, Mail, Phone, Globe,
  ShieldAlert, TrendingUp, Clock, Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractionResult, DocumentType } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type FindingKind = "detected" | "warning" | "missing" | "risk" | "info";

interface Finding {
  kind: FindingKind;
  icon: React.ElementType;
  label: string;
  value: string;
  detail?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const kindConfig: Record<FindingKind, {
  dot: string;
  card: string;
  badge: string;
  badgeText: string;
}> = {
  detected: {
    dot: "bg-emerald-500",
    card: "border-emerald-500/15 bg-emerald-500/4 hover:bg-emerald-500/8",
    badge: "bg-emerald-500/12 text-emerald-600",
    badgeText: "Detected",
  },
  warning: {
    dot: "bg-amber-500",
    card: "border-amber-500/20 bg-amber-500/4 hover:bg-amber-500/8",
    badge: "bg-amber-500/12 text-amber-600",
    badgeText: "Anomaly",
  },
  missing: {
    dot: "bg-red-500",
    card: "border-red-500/15 bg-red-500/4 hover:bg-red-500/8",
    badge: "bg-red-500/10 text-red-500",
    badgeText: "Missing",
  },
  risk: {
    dot: "bg-orange-500",
    card: "border-orange-500/15 bg-orange-500/4 hover:bg-orange-500/8",
    badge: "bg-orange-500/10 text-orange-500",
    badgeText: "Risk",
  },
  info: {
    dot: "bg-blue-400",
    card: "border-blue-400/15 bg-blue-400/4 hover:bg-blue-400/8",
    badge: "bg-blue-400/12 text-blue-500",
    badgeText: "Info",
  },
};

// ── Finding generators per document type ─────────────────────────────────────

function getInvoiceFindings(result: ExtractionResult): Finding[] {
  const raw = result.rawJson as Record<string, any>;
  const fields = Object.fromEntries(result.fields.map(f => [f.key, f]));

  const findings: Finding[] = [];

  // Vendor
  const vendor = fields["company_name"]?.value || raw?.company?.name;
  findings.push(vendor
    ? { kind: "detected", icon: Building2, label: "Vendor", value: String(vendor) }
    : { kind: "missing", icon: Building2, label: "Vendor", value: "Not found", detail: "Cannot identify the issuing company" }
  );

  // Invoice number
  const invNum = fields["invoice_number"]?.value;
  findings.push(invNum
    ? { kind: "detected", icon: Hash, label: "Invoice #", value: String(invNum) }
    : { kind: "missing", icon: Hash, label: "Invoice #", value: "Not found" }
  );

  // Total amount
  const total = fields["total_amount"]?.value;
  findings.push(total
    ? { kind: "detected", icon: DollarSign, label: "Total amount", value: `$${Number(total).toLocaleString()}` }
    : { kind: "missing", icon: DollarSign, label: "Total amount", value: "Not found" }
  );

  // Due date
  const due = fields["due_date"]?.value;
  findings.push(due
    ? { kind: "detected", icon: CalendarDays, label: "Due date", value: String(due) }
    : { kind: "missing", icon: CalendarDays, label: "Due date", value: "Not found", detail: "Payment deadline not detected" }
  );

  // Tax
  const tax = fields["tax_rate"]?.value;
  const taxAmt = fields["tax_amount"]?.value;
  if (tax) {
    const taxVal = parseFloat(String(tax));
    findings.push(taxVal > 20
      ? { kind: "warning", icon: AlertTriangle, label: "High tax rate", value: String(tax), detail: "Unusually high — verify with vendor" }
      : { kind: "detected", icon: Tag, label: "Tax rate", value: String(tax) }
    );
  }

  // Tax ID (warning if missing)
  if (result.warnings.some(w => w.toLowerCase().includes("tax"))) {
    findings.push({ kind: "warning", icon: ShieldAlert, label: "Tax ID", value: "Not visible", detail: "Verify before payment" });
  }

  // Risk score
  const confidence = result.confidence;
  findings.push({
    kind: confidence >= 95 ? "info" : confidence >= 80 ? "warning" : "risk",
    icon: TrendingUp,
    label: "Risk score",
    value: confidence >= 95 ? "Low" : confidence >= 80 ? "Medium" : "High",
    detail: `${confidence}% extraction confidence`,
  });

  return findings;
}

function getResumeFindings(result: ExtractionResult): Finding[] {
  const fields = Object.fromEntries(result.fields.map(f => [f.key, f]));
  const findings: Finding[] = [];

  const name = fields["full_name"]?.value;
  findings.push(name
    ? { kind: "detected", icon: User, label: "Candidate", value: String(name) }
    : { kind: "missing", icon: User, label: "Candidate name", value: "Not found" }
  );

  const email = fields["email"]?.value;
  findings.push(email
    ? { kind: "detected", icon: Mail, label: "Email", value: String(email) }
    : { kind: "missing", icon: Mail, label: "Email", value: "Not found" }
  );

  const title = fields["current_title"]?.value;
  findings.push(title
    ? { kind: "detected", icon: FileText, label: "Current role", value: String(title) }
    : { kind: "info", icon: FileText, label: "Current role", value: "Not specified" }
  );

  const years = fields["years_experience"]?.value;
  if (years !== null && years !== undefined) {
    const y = Number(years);
    findings.push({
      kind: y >= 5 ? "detected" : y >= 2 ? "info" : "warning",
      icon: Clock,
      label: "Experience",
      value: `${y} year${y !== 1 ? "s" : ""}`,
      detail: y >= 5 ? "Senior profile" : y >= 2 ? "Mid-level" : "Junior profile",
    });
  }

  const skills = fields["primary_skills"]?.value;
  if (Array.isArray(skills) && skills.length > 0) {
    findings.push({ kind: "detected", icon: Layers, label: "Skills", value: `${skills.length} detected`, detail: (skills as string[]).slice(0, 3).join(", ") });
  }

  const edu = fields["education_school"]?.value;
  findings.push(edu
    ? { kind: "detected", icon: Building2, label: "Education", value: String(edu) }
    : { kind: "info", icon: Building2, label: "Education", value: "Not found" }
  );

  findings.push({
    kind: result.confidence >= 95 ? "info" : "warning",
    icon: TrendingUp,
    label: "Profile score",
    value: result.confidence >= 95 ? "Strong" : "Average",
    detail: `${result.confidence}% data completeness`,
  });

  return findings;
}

function getGenericFindings(result: ExtractionResult): Finding[] {
  const findings: Finding[] = [];
  const detected = result.fields.filter(f => f.value !== null && f.value !== "").slice(0, 4);
  const missing = result.fields.filter(f => f.value === null || f.value === "").slice(0, 2);

  detected.forEach(f => {
    const val = Array.isArray(f.value) ? `${(f.value as string[]).length} items` : String(f.value ?? "");
    findings.push({ kind: "detected", icon: CheckCircle2, label: f.key.replace(/_/g, " "), value: val });
  });

  missing.forEach(f => {
    findings.push({ kind: "missing", icon: XCircle, label: f.key.replace(/_/g, " "), value: "Not found" });
  });

  if (result.warnings.length > 0) {
    findings.push({ kind: "warning", icon: AlertTriangle, label: "Warning", value: result.warnings[0] });
  }

  findings.push({
    kind: result.confidence >= 90 ? "info" : "warning",
    icon: TrendingUp,
    label: "Confidence",
    value: `${result.confidence}%`,
  });

  return findings;
}

function buildFindings(result: ExtractionResult): Finding[] {
  switch (result.documentType) {
    case "invoice": return getInvoiceFindings(result);
    case "resume": return getResumeFindings(result);
    default: return getGenericFindings(result);
  }
}

// ── FindingCard ───────────────────────────────────────────────────────────────

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const conf = kindConfig[finding.kind];
  const Icon = finding.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className={cn(
        "group relative flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-default",
        conf.card
      )}
    >
      {/* Status dot */}
      <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", conf.dot)} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground truncate">{finding.label}</span>
          </div>
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", conf.badge)}>
            {conf.badgeText}
          </span>
        </div>
        <p className="text-xs font-semibold text-foreground truncate pl-4">{finding.value}</p>
        {finding.detail && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 pl-4 leading-relaxed">{finding.detail}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Risk Score summary bar ────────────────────────────────────────────────────

function RiskBar({ confidence }: { confidence: number }) {
  const level = confidence >= 95 ? "Low" : confidence >= 80 ? "Medium" : "High";
  const color = confidence >= 95 ? "#10b981" : confidence >= 80 ? "#f59e0b" : "#ef4444";
  const width = `${confidence}%`;

  return (
    <div className="px-3 py-3 rounded-xl bg-muted/40 border border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Overall confidence</span>
        <span className="text-sm font-bold" style={{ color }}>{confidence}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Risk: <strong style={{ color }}>{level}</strong></span>
        <span>{Object.keys({ confidence }).length > 0 ? "All critical fields scanned" : ""}</span>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface AIFindingsPanelProps {
  result: ExtractionResult;
  processingTime?: number;
}

export function AIFindingsPanel({ result, processingTime }: AIFindingsPanelProps) {
  const findings = buildFindings(result);
  const detectedCount = findings.filter(f => f.kind === "detected").length;
  const warningCount = findings.filter(f => f.kind === "warning" || f.kind === "missing" || f.kind === "risk").length;

  return (
    <div className="overflow-y-auto flex-1 p-4 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">AI Findings</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          {processingTime && (
            <span className="text-[10px] text-muted-foreground">{processingTime}ms</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="text-emerald-600 font-medium">{detectedCount} detected</span>
          <span className="text-muted-foreground/30">·</span>
          {warningCount > 0
            ? <span className="text-amber-600 font-medium">{warningCount} issue{warningCount > 1 ? "s" : ""}</span>
            : <span className="text-muted-foreground/60">no issues</span>
          }
        </div>
      </div>

      {/* Finding cards */}
      <div className="space-y-1.5">
        {findings.map((finding, i) => (
          <FindingCard key={i} finding={finding} index={i} />
        ))}
      </div>

      {/* Confidence bar */}
      <RiskBar confidence={result.confidence} />

      {/* Quick actions */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-0.5">Actions</p>
        {[
          { label: "Export findings as JSON", chevron: true },
          { label: "Copy structured data", chevron: true },
          { label: "Re-analyze document", chevron: true },
        ].map((action, i) => (
          <button
            key={i}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-muted transition-colors group text-left"
          >
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              {action.label}
            </span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
