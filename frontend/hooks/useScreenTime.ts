"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { screenTimeService } from "@/services/screenTime";
import type { ScreenTimeEventCreate } from "@/types/api";

// How often the chart re-reads the server. The 1-2 minute cap highlight is
// driven by a local clock in the chart, so this can stay relaxed.
const SNAPSHOT_REFRESH_MS = 30_000;

export function useScreenTimeSnapshot() {
  return useQuery({
    queryKey: ["screen-time", "snapshot"],
    queryFn: () => screenTimeService.snapshot(),
    refetchInterval: SNAPSHOT_REFRESH_MS,
    retry: false,
  });
}

export function useScreenTimeEvents(limit?: number, enabled = true) {
  return useQuery({
    queryKey: ["screen-time", "events", limit ?? "all"],
    queryFn: () => screenTimeService.listEvents(limit),
    enabled,
    refetchInterval: SNAPSHOT_REFRESH_MS,
  });
}

export function useCreateScreenTimeEvents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ScreenTimeEventCreate) => screenTimeService.createEvents(body),
    onSuccess: (events) => {
      qc.invalidateQueries({ queryKey: ["screen-time"] });
      toast.success(`Updated ${events.length} compan${events.length === 1 ? "y" : "ies"}.`);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update screen time."),
  });
}

export function useRevertScreenTimeEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => screenTimeService.revertEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["screen-time"] });
      toast.success("Change reverted.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to revert."),
  });
}
