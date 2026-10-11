"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen is applied to the whole document (not just this page) so that
  // menus, popovers and confirmation dialogs, which render at the document
  // root, stay visible while fullscreen.
  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement !== null);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

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
    <main
      className={cn(
        "mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 py-5",
        isFullscreen
          ? "bg-background fixed inset-0 z-50 h-screen max-w-none overflow-auto"
          : "h-[calc(100vh-3.25rem)] min-h-[560px]",
      )}
    >
      {/* Three columns: Menu | staff controls | page + fullscreen buttons.
          A grid (not a wrapping flex row) so the Update button always stays
          beside Menu no matter how much the controls grow. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4">
        {/* Hidden in fullscreen for a clean display; the empty div keeps the
            grid columns in place. */}
        {isFullscreen ? (
          <div />
        ) : (
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
        )}

        <div className="min-w-0">
          {staffMode && period && snapshot && (
            <UpdateControls bars={bars} periodId={period.id} />
          )}
        </div>

        <div className="flex items-center gap-2">
          {pageCount > 1 && (
            <>
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
            </>
          )}
          <Button
            variant="secondary"
            size="icon"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">{body}</div>
    </main>
  );
}
