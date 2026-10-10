"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotes } from "@/hooks/useCrisisNotes";
import {
  useCreateScreenTimeEvents,
  useRevertScreenTimeEvent,
  useScreenTimeEvents,
} from "@/hooks/useScreenTime";
import type { ScreenTimeAction, ScreenTimeBar } from "@/types/api";
import { ACTION_LABELS, ACTION_OPTIONS, formatAgo, formatSigned } from "./actions";

interface Props {
  bars: ScreenTimeBar[];
  periodId: number;
}

/** Staff-only controls: the Figma "Update" row, plus recent changes with revert. */
export function UpdateControls({ bars, periodId }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [action, setAction] = useState<ScreenTimeAction>("LOBBYING");
  const [change, setChange] = useState("");
  const [noteId, setNoteId] = useState("");

  const { data: notes = [] } = useNotes({ period_id: periodId });
  const { data: recent = [] } = useScreenTimeEvents(5);
  const create = useCreateScreenTimeEvents();
  const revert = useRevertScreenTimeEvent();

  const names = useMemo(() => new Map(bars.map((b) => [b.character_id, b.name])), [bars]);

  const delta = Number(change);
  const valid = selected.length > 0 && change.trim() !== "" && Number.isFinite(delta) && delta !== 0;

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    create.mutate(
      {
        character_ids: selected,
        action_type: action,
        delta,
        crisis_note_id: noteId ? Number(noteId) : null,
      },
      {
        onSuccess: () => {
          setSelected([]);
          setChange("");
          setNoteId("");
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" disabled={!valid || create.isPending}>
          Update
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="min-w-44 justify-between">
              {selected.length === 0 ? "Affected Delegates" : `${selected.length} selected`}
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="max-h-72 w-64 space-y-1 overflow-y-auto p-2">
            <div className="flex justify-between px-1 pb-1 text-xs">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setSelected(bars.map((b) => b.character_id))}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setSelected([])}
              >
                Clear
              </button>
            </div>
            {bars.map((b) => (
              <label
                key={b.character_id}
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <Checkbox
                  checked={selected.includes(b.character_id)}
                  onCheckedChange={() => toggle(b.character_id)}
                />
                {b.name}
              </label>
            ))}
          </PopoverContent>
        </Popover>

        <NativeSelect
          aria-label="Action"
          value={action}
          onChange={(e) => setAction(e.target.value as ScreenTimeAction)}
        >
          {ACTION_OPTIONS.map((o) => (
            <NativeSelectOption key={o.value} value={o.value}>
              {o.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <Input
          aria-label="Increase or decrease in hours"
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="+ / − hours"
          className="w-32"
          value={change}
          onChange={(e) => setChange(e.target.value)}
        />

        <NativeSelect
          aria-label="Crisis note (optional)"
          value={noteId}
          onChange={(e) => setNoteId(e.target.value)}
          className="max-w-56"
        >
          <NativeSelectOption value="">No crisis note</NativeSelectOption>
          {notes.map((n) => (
            <NativeSelectOption key={n.id} value={n.id}>
              {n.character.name}: {n.title}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </form>

      {recent.length > 0 && (
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-medium">Recent:</span>
          {recent.map((ev) => (
            <span key={ev.id} className="inline-flex items-center gap-1">
              {names.get(ev.character_id) ?? `#${ev.character_id}`} {formatSigned(ev.delta)} h ·{" "}
              {ACTION_LABELS[ev.action_type]} · {formatAgo(Date.now() - Date.parse(ev.created_at))}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                title="Revert this change"
                disabled={revert.isPending}
                onClick={() => revert.mutate(ev.id)}
              >
                <Undo2 />
              </Button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
