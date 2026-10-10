import { apiClient } from "@/lib/apiClient";
import type {
  ScreenTimeEventCreate,
  ScreenTimeEventResponse,
  ScreenTimeSnapshot,
} from "@/types/api";

export const screenTimeService = {
  snapshot: () => apiClient.get<ScreenTimeSnapshot>("/api/screen-time/snapshot"),

  listEvents: (limit?: number) =>
    apiClient
      .get<ScreenTimeEventResponse[]>("/api/screen-time/events")
      .then((events) => (limit ? events.slice(0, limit) : events)),

  createEvents: (body: ScreenTimeEventCreate) =>
    apiClient.post<ScreenTimeEventResponse[]>("/api/screen-time/events", body),

  revertEvent: (id: number) =>
    apiClient.post<ScreenTimeEventResponse>(`/api/screen-time/events/${id}/revert`, {}),
};
