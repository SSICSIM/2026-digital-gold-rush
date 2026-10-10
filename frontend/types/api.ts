export interface HealthResponse {
  status: string;
}

export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type NoteType = "PRIVATE_DIRECTIVE" | "PUBLIC_DIRECTIVE";

// ── Characters ───────────────────────────────────────────────────────────────

export interface CharacterResponse {
  id: number;
  name: string;
  created_at: string;
}

export interface CharacterCreate {
  name: string;
}

export interface BulkUploadResult {
  created: number;
  skipped: number;
}

// ── Crisis Periods ────────────────────────────────────────────────────────────

export interface CrisisPeriodResponse {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  archived_at: string | null;
}

export interface CrisisPeriodCreate {
  name: string;
}

// ── Crisis Notes ──────────────────────────────────────────────────────────────

export interface CrisisNoteResponse {
  id: number;
  period_id: number;
  character: CharacterResponse;
  title: string;
  description: string;
  crisis_staff_notes: string | null;
  priority: Priority;
  note_type: NoteType;
  created_at: string;
}

export interface CrisisNoteCreate {
  character_id: number;
  // The period the client expects the note to land in. The backend rejects
  // the submission (409) if the active period has changed since, instead of
  // silently filing it under a different period than the user saw.
  period_id?: number;
  title: string;
  description: string;
  crisis_staff_notes?: string;
  priority: Priority;
  note_type: NoteType;
}

export interface CrisisNoteUpdate {
  character_id?: number;
  title?: string;
  description?: string;
  crisis_staff_notes?: string | null;
  priority?: Priority;
  note_type?: NoteType;
}

export interface NoteFilters {
  period_id?: number;
  archived_only?: boolean;
  character_id?: number;
  priority?: Priority;
  note_type?: NoteType;
  q?: string;
}

// ── Staff Notes ───────────────────────────────────────────────────────────────

export interface StaffNoteResponse {
  id: number;
  period_id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface StaffNoteCreate {
  title: string;
  content: string;
}

export interface StaffNoteUpdate {
  title?: string;
  content?: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface NotesByCharacter {
  character_name: string;
  count: number;
}

export interface PriorityCount {
  priority: Priority;
  count: number;
}

export interface AnalyticsSummary {
  total_notes: number;
  notes_by_character: NotesByCharacter[];
  priority_distribution: PriorityCount[];
  private_directive_count: number;
  public_directive_count: number;
}

// ── Screen Time ───────────────────────────────────────────────────────────────

export type ScreenTimeAction = "LOBBYING" | "CARTEL" | "RESEARCH" | "ROCKET_DOCKET" | "OTHER";

export interface ScreenTimeLastChange {
  event_id: number;
  delta: number;
  action_type: ScreenTimeAction;
  changed_at: string;
}

export interface ScreenTimeBar {
  character_id: number;
  name: string;
  current: number;
  previous: number;
  last_change: ScreenTimeLastChange | null;
}

export interface ScreenTimeSnapshot {
  period_id: number;
  starting_hours: number;
  generated_at: string;
  bars: ScreenTimeBar[];
}

export interface ScreenTimeEventResponse {
  id: number;
  character_id: number;
  period_id: number;
  crisis_note_id: number | null;
  action_type: ScreenTimeAction;
  delta: number;
  created_at: string;
  reverted_at: string | null;
}

export interface ScreenTimeEventCreate {
  character_ids: number[];
  crisis_note_id?: number | null;
  action_type: ScreenTimeAction;
  delta: number;
}

