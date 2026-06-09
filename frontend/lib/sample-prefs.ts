import { SAMPLE_DOC_IDS } from "@/lib/mock-data";

const HIDDEN_SAMPLES_KEY = "hidden_sample_docs";

export function getHiddenSampleIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(HIDDEN_SAMPLES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return new Set(ids.filter((id) => SAMPLE_DOC_IDS.has(id)));
  } catch {
    return new Set();
  }
}

export function hideSampleDoc(id: string): void {
  if (!SAMPLE_DOC_IDS.has(id)) return;
  const hidden = getHiddenSampleIds();
  hidden.add(id);
  localStorage.setItem(HIDDEN_SAMPLES_KEY, JSON.stringify([...hidden]));
}

export function isSampleHidden(id: string): boolean {
  return getHiddenSampleIds().has(id);
}
