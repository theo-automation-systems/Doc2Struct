"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ExtractionField } from "@/lib/types";
import { getFieldColor } from "@/lib/field-colors";
import { applyPdfJsPolyfills } from "@/lib/pdf-polyfills";
import { formatFieldValue } from "@/lib/format-field-value";

type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
  height?: number;
};

type PdfViewport = {
  transform: number[];
  width: number;
  height: number;
};

interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
  fieldIndex: number;
}

interface PdfPreviewCanvasProps {
  url: string;
  page: number;
  fields: ExtractionField[];
  showHighlights: boolean;
  scanning: boolean;
}

const PDF_WORKER_SRC = "/pdf.worker.min.mjs";
const A4_RATIO = 595 / 842;

function fieldDisplayValue(field: ExtractionField): string {
  return formatFieldValue(field.value).replace(/—/g, "").trim();
}

function buildSearchVariants(field: ExtractionField): string[] {
  const raw = fieldDisplayValue(field);
  if (!raw || raw.length < 2) return [];

  const variants = new Set<string>();
  variants.add(raw.trim());

  const num = parseFloat(raw.replace(/[^0-9.-]/g, ""));
  if (!isNaN(num)) {
    const fixed2 = num.toFixed(2);
    const us = num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const eu = num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    variants.add(String(num));
    variants.add(fixed2);
    variants.add(us);
    variants.add(eu);
    variants.add(`${us} EUR`);
    variants.add(`${eu} EUR`);
    variants.add(`$${us}`);
    variants.add(us.replace(/,/g, ""));
    variants.add(eu.replace(/\./g, "").replace(",", "."));
    if (num >= 1000) {
      variants.add(num.toLocaleString("en-US", { maximumFractionDigits: 0 }));
    }
  }

  const noSpaces = raw.replace(/\s+/g, "");
  if (noSpaces !== raw) variants.add(noSpaces);

  if (Array.isArray(field.value)) {
    for (const item of field.value) {
      if (item && typeof item === "object") {
        for (const part of Object.values(item as Record<string, unknown>)) {
          const s = String(part ?? "").trim();
          if (s.length >= 2) variants.add(s);
        }
      }
    }
  }

  return [...variants]
    .filter((v) => v.length >= 2)
    .sort((a, b) => b.length - a.length);
}

type TextSpan = { start: number; end: number; item: PdfTextItem };

function buildTextIndex(items: PdfTextItem[]): { text: string; spans: TextSpan[] } {
  let text = "";
  const spans: TextSpan[] = [];
  for (const item of items) {
    if (!item.str) continue;
    const start = text.length;
    text += item.str;
    spans.push({ start, end: text.length, item });
    text += " ";
  }
  return { text: text.toLowerCase(), spans };
}

function spansForRange(spans: TextSpan[], start: number, end: number): TextSpan[] {
  return spans.filter((s) => s.end > start && s.start < end);
}

function mergeRects(rects: HighlightRect[]): HighlightRect | null {
  if (!rects.length) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.left + r.width));
  const bottom = Math.max(...rects.map((r) => r.top + r.height));
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
    fieldIndex: rects[0].fieldIndex,
  };
}

function computeHighlights(
  items: PdfTextItem[],
  viewport: PdfViewport,
  fields: ExtractionField[],
  transformFn: (m1: number[], m2: number[]) => number[],
): HighlightRect[] {
  const { text, spans } = buildTextIndex(items);
  const results: HighlightRect[] = [];
  const matchedFields = new Set<number>();

  fields.forEach((field, fieldIndex) => {
    if (matchedFields.has(fieldIndex)) return;
    const variants = buildSearchVariants(field);

    for (const variant of variants) {
      const needle = variant.toLowerCase();
      const pos = text.indexOf(needle);
      if (pos === -1) continue;

      const hitSpans = spansForRange(spans, pos, pos + needle.length);
      const rects = hitSpans.map((s) => {
        const tx = transformFn(viewport.transform, s.item.transform);
        const fontHeight = Math.hypot(tx[2], tx[3]) || 12;
        const left = tx[4];
        const top = tx[5] - fontHeight;
        const width = s.item.width || fontHeight * Math.max(s.item.str.length * 0.55, 1);
        return { left, top: top - 1, width: width + 2, height: fontHeight + 4, fieldIndex };
      });

      const merged = mergeRects(rects);
      if (merged) {
        results.push(merged);
        matchedFields.add(fieldIndex);
        break;
      }
    }
  });

  return results;
}

function ScanBeam({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      <motion.div
        initial={{ top: "0%" }}
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-70 shadow-[0_0_6px_rgba(16,185,129,0.45)]" />
      </motion.div>
    </div>
  );
}

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export function PdfPreviewCanvas({
  url,
  page,
  fields,
  showHighlights,
  scanning,
}: PdfPreviewCanvasProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useNativeViewer, setUseNativeViewer] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);

  const fieldsKey = JSON.stringify(fields.map((f) => [f.key, f.value]));

  useEffect(() => {
    setUseNativeViewer(false);
    setError(false);
  }, [url, page]);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    const updateWidth = () => {
      const next = el.clientWidth;
      if (next > 0) setPageWidth(next);
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [useNativeViewer]);

  const renderPdf = useCallback(async (signal: { cancelled: boolean }) => {
    setLoading(true);
    setError(false);
    setHighlights([]);

    try {
      await waitForLayout();
      applyPdfJsPolyfills();

      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

      const source =
        url.startsWith("blob:") || url.startsWith("data:")
          ? { data: await (await fetch(url)).arrayBuffer() }
          : { url };

      const pdf = await pdfjs.getDocument(source).promise;
      const pdfPage = await pdf.getPage(page + 1);

      const displayWidth = pageRef.current?.clientWidth || pageWidth || 640;
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const cssScale = displayWidth / baseViewport.width;
      const dpr = Math.min(
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        2.5,
      );
      const layoutViewport = pdfPage.getViewport({ scale: cssScale });
      const renderViewport = pdfPage.getViewport({ scale: cssScale * dpr });

      const cssWidth = layoutViewport.width;
      const cssHeight = layoutViewport.height;

      const canvas = canvasRef.current;
      if (!canvas || signal.cancelled) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      canvas.width = Math.max(1, Math.floor(renderViewport.width));
      canvas.height = Math.max(1, Math.floor(renderViewport.height));
      setPageSize({ width: cssWidth, height: cssHeight });

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if ("imageSmoothingEnabled" in ctx) ctx.imageSmoothingEnabled = true;
      if ("imageSmoothingQuality" in ctx) {
        (ctx as CanvasRenderingContext2D & { imageSmoothingQuality?: string })
          .imageSmoothingQuality = "high";
      }

      await pdfPage.render({
        canvasContext: ctx,
        viewport: renderViewport,
        canvas,
        intent: "display",
      }).promise;

      if (!signal.cancelled && showHighlights && fields.length > 0) {
        const textContent = await pdfPage.getTextContent();
        const rects = computeHighlights(
          textContent.items as PdfTextItem[],
          layoutViewport,
          fields,
          pdfjs.Util.transform.bind(pdfjs.Util),
        );
        setHighlights(rects);
      }
    } catch (err) {
      console.warn("PDF canvas preview failed, using native viewer:", err);
      if (!signal.cancelled) setUseNativeViewer(true);
    } finally {
      if (!signal.cancelled) setLoading(false);
    }
  }, [url, page, fieldsKey, showHighlights, fields, pageWidth]);

  useEffect(() => {
    if (pageWidth <= 0) return;
    const signal = { cancelled: false };
    void renderPdf(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [renderPdf, pageWidth]);

  const nativeSrc = page > 0 ? `${url}#page=${page + 1}` : url;
  const aspectRatio =
    pageSize.width > 0 && pageSize.height > 0
      ? `${pageSize.width} / ${pageSize.height}`
      : `${A4_RATIO}`;

  return (
    <div className="relative w-full bg-[#f4f4f5] min-h-[480px] p-4 sm:p-6">
      {loading && !useNativeViewer && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#f4f4f5]/80">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && !useNativeViewer && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Failed to load PDF preview
        </div>
      )}
      {useNativeViewer ? (
        <iframe
          src={nativeSrc}
          title="PDF preview"
          className="w-full min-h-[480px] border-0 bg-white"
        />
      ) : (
        <div ref={pageRef} className="relative mx-auto w-full max-w-3xl">
          <div
            className="relative bg-white shadow-md ring-1 ring-black/5 rounded-sm overflow-hidden"
            style={{ aspectRatio, width: "100%" }}
          >
            <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
            {showHighlights && highlights.length > 0 && pageSize.width > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {highlights.map((rect, i) => {
                  const color = getFieldColor(rect.fieldIndex);
                  return (
                    <motion.div
                      key={`${rect.fieldIndex}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.06, duration: 0.25 }}
                      className="absolute rounded-sm"
                      style={{
                        left: `${(rect.left / pageSize.width) * 100}%`,
                        top: `${(rect.top / pageSize.height) * 100}%`,
                        width: `${(rect.width / pageSize.width) * 100}%`,
                        height: `${(rect.height / pageSize.height) * 100}%`,
                        backgroundColor: color.fill,
                        borderBottom: `2px solid ${color.stroke}`,
                      }}
                    />
                  );
                })}
              </div>
            )}
            <ScanBeam active={scanning} />
          </div>
        </div>
      )}
    </div>
  );
}
