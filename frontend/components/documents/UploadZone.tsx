"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle2, Loader2, FileUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_FILE_ACCEPT,
  isAcceptedFile,
  unsupportedFileMessage,
} from "@/lib/accepted-file-types";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface UploadZoneProps {
  onUploadComplete?: (files: File[]) => void;
  /** Called once per file with the actual File object — use for real API upload */
  onFileAccepted?: (file: File) => Promise<void>;
  /** Compact mode for embedding in sidebars */
  compact?: boolean;
  /** Slightly smaller drop zone (e.g. dashboard) */
  size?: "default" | "sm";
  /** Open native file picker on mount */
  autoOpen?: boolean;
}

export function UploadZone({
  onUploadComplete,
  onFileAccepted,
  compact,
  size = "default",
  autoOpen,
}: UploadZoneProps) {
  const isSm = !compact && size === "sm";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [unsupportedWarning, setUnsupportedWarning] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    const id = Math.random().toString(36).slice(2);
    setUploadFiles((prev) => [...prev, { id, file, progress: 0, status: "uploading" }]);

    if (onFileAccepted) {
      // Real upload — animate progress to 80 then wait for callback
      const interval = setInterval(() => {
        setUploadFiles((prev) => prev.map(f => f.id !== id ? f : {
          ...f, progress: Math.min(f.progress + 15, 80)
        }));
      }, 200);
      try {
        await onFileAccepted(file);
        clearInterval(interval);
        setUploadFiles((prev) => prev.map(f => f.id !== id ? f : { ...f, progress: 100, status: "completed" }));
      } catch {
        clearInterval(interval);
        setUploadFiles((prev) => prev.map(f => f.id !== id ? f : { ...f, status: "error", error: "Upload failed" }));
      }
    } else {
      // Simulated upload
      const interval = setInterval(() => {
        setUploadFiles((prev) =>
          prev.map((f) => {
            if (f.id !== id) return f;
            const newProgress = f.progress + Math.random() * 25;
            if (newProgress >= 100) {
              clearInterval(interval);
              return { ...f, progress: 100, status: "completed" };
            }
            return { ...f, progress: Math.min(newProgress, 95) };
          })
        );
      }, 250);
    }
  }, [onFileAccepted]);

  const ingestFiles = useCallback(
    (files: File[]) => {
      const accepted: File[] = [];
      const rejected: string[] = [];
      for (const file of files) {
        if (isAcceptedFile(file)) accepted.push(file);
        else rejected.push(file.name);
      }
      if (rejected.length > 0) {
        setUnsupportedWarning(unsupportedFileMessage(rejected));
      } else {
        setUnsupportedWarning(null);
      }
      accepted.forEach(processFile);
      if (accepted.length > 0) onUploadComplete?.(accepted);
    },
    [processFile, onUploadComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      ingestFiles(Array.from(e.dataTransfer.files));
    },
    [ingestFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    ingestFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    if (!autoOpen) return;
    const t = setTimeout(() => fileInputRef.current?.click(), 250);
    return () => clearTimeout(t);
  }, [autoOpen]);

  useEffect(() => {
    if (!unsupportedWarning) return;
    const t = setTimeout(() => setUnsupportedWarning(null), 8000);
    return () => clearTimeout(t);
  }, [unsupportedWarning]);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        animate={{
          borderColor: isDragging ? "var(--primary)" : "var(--border)",
          scale: isDragging ? 1.01 : 1,
        }}
        transition={{ duration: 0.15 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed text-center cursor-pointer group transition-colors",
          compact ? "p-4 rounded-xl" : isSm ? "p-5 rounded-xl" : "p-8 rounded-2xl",
          isDragging ? "bg-primary/5" : "bg-transparent"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept={ACCEPTED_FILE_ACCEPT}
          onChange={handleFileInput}
        />

        <div className={cn("flex flex-col items-center", compact ? "gap-2" : isSm ? "gap-2" : "gap-3")}>
          <motion.div
            animate={{ y: isDragging ? -4 : 0, scale: isDragging ? 1.1 : 1 }}
            className={cn(
              "rounded-xl flex items-center justify-center transition-all",
              compact ? "w-9 h-9" : isSm ? "w-10 h-10" : "w-14 h-14",
              isDragging ? "bg-primary/15 shadow-lg shadow-primary/20" : "bg-muted group-hover:bg-primary/10"
            )}
          >
            <FileUp className={cn("transition-colors", compact ? "w-4 h-4" : isSm ? "w-5 h-5" : "w-6 h-6", isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
          </motion.div>

          <div>
            <p className={cn("font-semibold text-foreground mb-0.5", compact || isSm ? "text-xs" : "text-sm")}>
              {isDragging ? "Drop to upload" : "Upload documents"}
            </p>
            {!compact && (
              <p className="text-xs text-muted-foreground">
                Drag & drop or <span className="text-primary font-medium">browse files</span>
              </p>
            )}
          </div>

          {!compact && (
            <>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {["PDF", "DOCX", "XLSX", "TXT"].map((fmt) => (
                  <span
                    key={fmt}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
              {!isSm && (
                <p className="text-[11px] text-muted-foreground/60">Max file size: 50MB</p>
              )}
            </>
          )}
        </div>

        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-2xl bg-primary/5 flex items-center justify-center"
          >
            <div className="text-primary font-semibold text-sm">Release to upload</div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {unsupportedWarning && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1 leading-relaxed">{unsupportedWarning}</p>
            <button
              type="button"
              onClick={() => setUnsupportedWarning(null)}
              className="shrink-0 p-0.5 rounded hover:bg-amber-500/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Upload Queue ({uploadFiles.length})
            </p>
            {uploadFiles.map((uf) => (
              <motion.div
                key={uf.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-foreground truncate">{uf.file.name}</p>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[11px] text-muted-foreground">{formatSize(uf.file.size)}</span>
                      {uf.status === "completed" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : uf.status === "error" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                      )}
                    </div>
                  </div>
                  {uf.status === "uploading" && (
                    <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uf.progress}%` }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  )}
                  {uf.status === "completed" && (
                    <p className="text-[11px] text-emerald-600">Upload complete</p>
                  )}
                </div>
                <button
                  onClick={() => removeFile(uf.id)}
                  className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
