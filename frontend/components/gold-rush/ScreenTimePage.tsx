"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActivePeriod } from "@/hooks/useCrisisPeriods";
import { useScreenTimeSnapshot } from "@/hooks/useScreenTime";
import { ScreenTimeChart } from "./ScreenTimeChart";
import { UpdateControls } from "./UpdateControls";

// Bars per page. With 20+ companies the chart pages through them (prev/next
// in the top right) instead of cramming every bar onto one screen.
const PAGE_SIZE = 8;

export function ScreenTimePage() {
  const [page, setPage] = useState(0);
  const [staffMode, setStaffMode] = useState(false);

  const { data: period, isLoading: periodLoading } = useActivePeriod();
  const { data: snapshot, isLoading, isError, error } = useScreenTimeSnapshot();

  const bars = snapshot?.bars ?? [];
  const pageCount = Math.max(1, Math.ceil(bars.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = bars.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // One scale for every page so bar heights stay comparable between pages.
  const maxValue = useMemo(() => {
    const peak = Math.max(1, ...bars.map((b) => Math.max(b.current, b.previous)));
    return peak * 1.1;
  }, [bars]);

  let body: React.ReactNode;
  if (periodLoading || isLoading) {
    body = <p className="text-muted-foreground py-24 text-center text-sm">Loading…</p>;
  } else if (!period) {
    body = (
      <p className="text-muted-foreground py-24 text-center text-sm">
        There&apos;s no active period yet. Create one on the Crisis Tracker to start the chart.
      </p>
    );
  } else if (isError) {
    body = (
      <div className="text-muted-foreground mx-auto max-w-xl space-y-2 py-24 text-center text-sm">
        <p>Couldn&apos;t load the screen-time data.</p>
        <p className="font-mono text-xs break-words">{error?.message}</p>
      </div>
    );
  } else {
    body = <ScreenTimeChart bars={visible} maxValue={maxValue} />;
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-3.25rem)] min-h-[560px] w-full max-w-[1400px] flex-col gap-4 px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-start gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/">Crisis Tracker</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={staffMode} onCheckedChange={setStaffMode}>
                Staff controls
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {staffMode && period && snapshot && (
            <UpdateControls bars={bars} periodId={period.id} />
          )}
        </div>

        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, bars.length)} of{" "}
              {bars.length}
            </span>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Previous companies"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Next companies"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1">{body}</div>
    </main>
  );
}
