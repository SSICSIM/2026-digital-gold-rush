import type { ScreenTimeAction } from "@/types/api";

// Order matches the Action dropdown in the Figma design.
export const ACTION_OPTIONS: { value: ScreenTimeAction; label: string }[] = [
  { value: "LOBBYING", label: "Lobbying" },
  { value: "CARTEL", label: "Cartel" },
  { value: "RESEARCH", label: "Research" },
  { value: "ROCKET_DOCKET", label: "Rocket / Docket" },
  { value: "OTHER", label: "Other" },
];

export const ACTION_LABELS: Record<ScreenTimeAction, string> = Object.fromEntries(
  ACTION_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ScreenTimeAction, string>;

/** 5 -> "5", 2.5 -> "2.5", 2.456 -> "2.5" */
export function formatHours(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** 5 -> "+5", -3 -> "-3" */
export function formatSigned(n: number): string {
  return `${n > 0 ? "+" : ""}${formatHours(n)}`;
}

export function formatAgo(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}
