export interface FieldColor {
  bg: string;
  border: string;
  text: string;
  highlight: string;
  ring: string;
  fill: string;
  stroke: string;
}

export const FIELD_COLORS: FieldColor[] = [
  { bg: "bg-violet-500/15", border: "border-violet-500/35", text: "text-violet-700 dark:text-violet-300", highlight: "bg-violet-500/25", ring: "ring-violet-500/30", fill: "rgba(139, 92, 246, 0.38)", stroke: "rgb(139, 92, 246)" },
  { bg: "bg-blue-500/15", border: "border-blue-500/35", text: "text-blue-700 dark:text-blue-300", highlight: "bg-blue-500/25", ring: "ring-blue-500/30", fill: "rgba(59, 130, 246, 0.38)", stroke: "rgb(59, 130, 246)" },
  { bg: "bg-amber-500/15", border: "border-amber-500/35", text: "text-amber-700 dark:text-amber-300", highlight: "bg-amber-500/25", ring: "ring-amber-500/30", fill: "rgba(245, 158, 11, 0.38)", stroke: "rgb(245, 158, 11)" },
  { bg: "bg-teal-500/15", border: "border-teal-500/35", text: "text-teal-700 dark:text-teal-300", highlight: "bg-teal-500/25", ring: "ring-teal-500/30", fill: "rgba(20, 184, 166, 0.38)", stroke: "rgb(20, 184, 166)" },
  { bg: "bg-emerald-500/15", border: "border-emerald-500/35", text: "text-emerald-700 dark:text-emerald-300", highlight: "bg-emerald-500/25", ring: "ring-emerald-500/30", fill: "rgba(16, 185, 129, 0.38)", stroke: "rgb(16, 185, 129)" },
  { bg: "bg-rose-500/15", border: "border-rose-500/35", text: "text-rose-700 dark:text-rose-300", highlight: "bg-rose-500/25", ring: "ring-rose-500/30", fill: "rgba(244, 63, 94, 0.38)", stroke: "rgb(244, 63, 94)" },
];

export function getFieldColor(index: number): FieldColor {
  return FIELD_COLORS[index % FIELD_COLORS.length];
}
