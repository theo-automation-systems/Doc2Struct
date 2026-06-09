/** Human-readable display for extracted field values (scalars, arrays, objects). */
export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (typeof value[0] === "object" && value[0] !== null) {
      return value
        .map((item) => {
          const record = item as Record<string, unknown>;
          return Object.entries(record)
            .map(([k, v]) => `${k}: ${v ?? "—"}`)
            .join(" · ");
        })
        .join(" | ");
    }
    return value.map(String).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
