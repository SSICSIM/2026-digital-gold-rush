"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ScreenTimeBar } from "@/types/api";
import { ACTION_LABELS, formatAgo, formatHours, formatSigned } from "./actions";

// A change stays highlighted (green / red cap) for this long, then folds into
// the blue bar. The PDR asks for roughly 1-2 minutes.
export const HIGHLIGHT_MS = 90_000;

// Colours from the Figma design.
const BLUE = "#00A6F4";
const GREEN = "#00C951";
const RED = "#E7000B";

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

interface Props {
  /** The bars on the current page. */
  bars: ScreenTimeBar[];
  /** Scale ceiling shared by every page so bar heights stay comparable. */
  maxValue: number;
}

export function ScreenTimeChart({ bars, maxValue }: Props) {
  const now = useNow(5_000);
  const pct = (v: number) => `${(Math.max(0, v) / maxValue) * 100}%`;

  if (bars.length === 0) {
    return (
      <p className="text-muted-foreground py-24 text-center text-sm">
        No companies yet. Add some with the Characters button.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 items-stretch gap-3 sm:gap-5">
        {bars.map((bar, i) => {
          const change = bar.last_change;
          const age = change ? now - Date.parse(change.changed_at) : Infinity;
          const showCap = change !== null && age < HIGHLIGHT_MS && bar.current !== bar.previous;
          const increased = bar.current > bar.previous;

          const blue = showCap ? Math.min(bar.current, bar.previous) : bar.current;
          const cap = showCap ? Math.abs(bar.current - bar.previous) : 0;

          const tooltipPos =
            i === 0 ? "left-0" : i === bars.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2";

          return (
            <div key={bar.character_id} className="group relative flex min-w-0 flex-1 flex-col">
              <div className="border-foreground/20 relative flex-1 border-b">
                <div
                  className="absolute inset-x-0 bottom-0 transition-[height] duration-700"
                  style={{ height: pct(blue), backgroundColor: BLUE }}
                />
                {showCap && (
                  <div
                    className="absolute inset-x-0 flex items-center justify-center overflow-hidden transition-all duration-700"
                    style={{
                      bottom: pct(blue),
                      height: pct(cap),
                      backgroundColor: increased ? GREEN : RED,
                    }}
                  >
                    {increased ? (
                      <ArrowUp className="size-7 shrink-0 text-white/80" strokeWidth={3} />
                    ) : (
                      <ArrowDown className="size-7 shrink-0 text-white/80" strokeWidth={3} />
                    )}
                  </div>
                )}

                {/* Hover details */}
                <div
                  className={cn(
                    "bg-popover text-popover-foreground pointer-events-none absolute top-0 z-10 hidden w-48 rounded-lg border p-3 text-xs shadow-md group-hover:block",
                    tooltipPos,
                  )}
                >
                  <p className="text-sm font-semibold">{bar.name}</p>
                  <p className="text-muted-foreground">{formatHours(bar.current)} h screen time</p>
                  {change ? (
                    <p
                      className="mt-1 font-medium"
                      style={{ color: change.delta > 0 ? GREEN : RED }}
                    >
                      {formatSigned(change.delta)} h · {ACTION_LABELS[change.action_type]}
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {formatAgo(now - Date.parse(change.changed_at))}
                      </span>
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-1">No changes yet</p>
                  )}
                </div>
              </div>
              <p className="truncate pt-2 text-center text-sm font-medium sm:text-base">
                {bar.name}
              </p>
            </div>
          );
        })}
      </div>
      <p className="pt-1 text-center text-lg font-bold">Screentime</p>
    </div>
  );
}
