"use client";

import { useState } from "react";
import { FileJson, FileSpreadsheet, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportDocument } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ExportActionsProps {
  documentId: string;
  documentName: string;
  disabled?: boolean;
}

const formats = [
  { id: "csv" as const, label: "CSV", icon: FileSpreadsheet },
  { id: "json" as const, label: "JSON", icon: FileJson },
  { id: "excel" as const, label: "Excel", icon: FileSpreadsheet },
];

export function ExportActions({ documentId, documentName, disabled }: ExportActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const download = async (format: "csv" | "json" | "excel") => {
    setLoading(format);
    setDone(null);
    try {
      const blob = await exportDocument(documentId, format);
      const ext = format === "excel" ? "xlsx" : format;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentName.replace(/\.[^.]+$/, "")}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(format);
      setTimeout(() => setDone(null), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-4 space-y-3 shrink-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Export &amp; integrations
      </p>
      <div className="flex flex-wrap gap-2">
        {formats.map((f) => (
          <Button
            key={f.id}
            variant="outline"
            size="sm"
            disabled={disabled || !!loading}
            onClick={() => download(f.id)}
            className="h-8 text-xs gap-1.5"
          >
            {loading === f.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : done === f.id ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ) : (
              <f.icon className="w-3 h-3" />
            )}
            {f.label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => alert("Notion export requires NOTION_API_KEY on the backend.")}
          className={cn("h-8 text-xs gap-1.5", "border-violet-500/20 text-violet-600 hover:bg-violet-500/5")}
        >
          <ExternalLink className="w-3 h-3" />
          Notion
        </Button>
      </div>
    </div>
  );
}
