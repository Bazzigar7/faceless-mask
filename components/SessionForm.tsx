"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TrackListItem } from "@/lib/listTracks";
import { OPENER_BANK } from "@/lib/banks/openers";
import { ACTIVITY_BANK } from "@/lib/banks/activities";
import { STORY_BANK } from "@/lib/banks/stories";
import { parseBrief, type ParsedBrief } from "@/lib/banks/parseBrief";
import type { SessionBrief, OpenerCategory } from "@/lib/banks/types";

type ExistingSession = {
  id: string;
  sessionNumber: number | null;
  topic: string;
  date: string;
  brief: SessionBrief | null;
  trackId: string;
  trackDisplayName: string;
};

type SessionFormProps = {
  tracks?: TrackListItem[];
  existing?: ExistingSession;
};

// Truncate a long opener body for use as a <select><option> label.
// Options have less horizontal real estate than checkbox rows.
function shortLabel(body: string): string {
  if (body.length <= 60) return body;
  return body.slice(0, 60).trimEnd() + "...";
}

// Truncate a longer body for use under a checkbox label (activities, stories).
function shortBody(body: string): string {
  if (body.length <= 100) return body;
  return body.slice(0, 100).trimEnd() + "...";
}

// Toggle membership of an id in a string[] state — shared by activity and
// story checkbox groups.
function toggleId(
  id: string,
  current: string[],
  setter: (next: string[]) => void,
): void {
  setter(
    current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id],
  );
}

// Order of opener category <optgroup>s matches the order they appear in
// personality.ts so the dropdown reads top-to-bottom the same way the
// system prompt does.
const OPENER_CATEGORIES: { label: string; value: OpenerCategory }[] = [
  { label: "Joke openers", value: "joke" },
  { label: "Activity openers", value: "activity" },
  { label: "Hook openers", value: "hook" },
  { label: "Roast openers", value: "roast" },
  { label: "Vibe openers", value: "vibe" },
  { label: "Self-aware openers", value: "self-aware" },
];

export default function SessionForm({ tracks, existing }: SessionFormProps) {
  const router = useRouter();

  // Classify existing.brief ONCE at top-of-component. Drives all 4 picker
  // useState initializers below. ParsedBrief discriminated union narrows
  // cleanly via parsed.kind === "structured" | "legacy" | "empty".
  const parsed: ParsedBrief = existing?.brief
    ? parseBrief(existing.brief)
    : { kind: "empty" };

  const [topic, setTopic] = useState(existing?.topic ?? "");
  const [date, setDate] = useState(
    existing ? existing.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [sessionNumber, setSessionNumber] = useState(
    existing?.sessionNumber != null ? String(existing.sessionNumber) : "",
  );
  const [trackId, setTrackId] = useState(existing?.trackId ?? "");

  // 4 picker states replace the prior single brief-string state. Empty
  // string / [] sentinels mean "no selection" — serialized away from the
  // wire payload in handleSubmit so brief becomes null if everything is
  // empty (matches the prior empty-textarea-becomes-null behavior).
  const [openerId, setOpenerId] = useState(
    parsed.kind === "structured" ? parsed.data.openerId ?? "" : "",
  );
  const [activityIds, setActivityIds] = useState<string[]>(
    parsed.kind === "structured" ? parsed.data.activityIds ?? [] : [],
  );
  const [storyIds, setStoryIds] = useState<string[]>(
    parsed.kind === "structured" ? parsed.data.storyIds ?? [] : [],
  );
  // Lazy initializer specifically because the legacy branch calls
  // JSON.stringify on the entire raw brief — costly enough to skip on
  // subsequent renders. Legacy briefs surface their raw JSON in
  // customNotes so Baz can manually port fields into the new pickers.
  const [customNotes, setCustomNotes] = useState(() => {
    if (parsed.kind === "structured") return parsed.data.customNotes ?? "";
    if (parsed.kind === "legacy") return JSON.stringify(parsed.raw, null, 2);
    return "";
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Build SessionBrief, omitting any unset / empty field. If everything
    // is empty we send brief: null — preserving the prior empty-form-→-null
    // behavior from before the picker UI.
    const brief: Partial<SessionBrief> = {};
    if (openerId) brief.openerId = openerId;
    if (activityIds.length > 0) brief.activityIds = activityIds;
    if (storyIds.length > 0) brief.storyIds = storyIds;
    if (customNotes.trim()) brief.customNotes = customNotes.trim();

    const payload = {
      topic: topic.trim(),
      date,
      sessionNumber: sessionNumber ? parseInt(sessionNumber, 10) : null,
      brief: Object.keys(brief).length > 0 ? brief : null,
      ...(existing ? {} : { trackId }),
    };

    try {
      const url = existing
        ? `/api/admin/sessions/${existing.id}`
        : "/api/admin/sessions";
      const method = existing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = (await res.json().catch(() => ({ error: "Unknown error" }))) as {
          error?: string;
        };
        setError(errorBody.error || `Request failed with status ${res.status}`);
        setSubmitting(false);
        return;
      }

      const result = (await res.json()) as { id: string };
      router.push(`/admin/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setSubmitting(false);
    }
  }

  const selectedOpener = openerId
    ? OPENER_BANK.find((o) => o.id === openerId)
    : undefined;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {existing ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Track (read-only)</label>
          <p className="text-zinc-700 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded">
            {existing.trackDisplayName}
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Track</label>
          <select
            required
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="w-full border border-zinc-300 rounded px-3 py-2"
          >
            <option value="">Select a track…</option>
            {tracks?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.cohortName} ({t.collegeName})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Topic</label>
        <input
          type="text"
          required
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full border border-zinc-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-zinc-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Session Number (optional)</label>
        <input
          type="number"
          min="1"
          value={sessionNumber}
          onChange={(e) => setSessionNumber(e.target.value)}
          className="w-full border border-zinc-300 rounded px-3 py-2"
        />
      </div>

      <div className="border-t border-zinc-200 my-6" />
      <h3 className="text-lg font-semibold mb-4">Session prep</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Opener</label>
        <p className="text-xs text-zinc-500 mt-1 mb-2">What kicks off the session</p>
        <select
          value={openerId}
          onChange={(e) => setOpenerId(e.target.value)}
          className="w-full border border-zinc-300 rounded px-3 py-2"
        >
          <option value="">— No opener —</option>
          {OPENER_CATEGORIES.map((cat) => (
            <optgroup key={cat.value} label={cat.label}>
              {OPENER_BANK.filter((o) => o.category === cat.value).map((o) => (
                <option key={o.id} value={o.id}>
                  {shortLabel(o.body)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedOpener && (
          <div className="mt-2 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded p-3">
            <div className="text-xs text-zinc-500 mb-1">{selectedOpener.category} opener</div>
            <div className="italic">&quot;{selectedOpener.body}&quot;</div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Activities</label>
        <p className="text-xs text-zinc-500 mt-1 mb-2">Games Mask can run on cue. Pick 0–2.</p>
        <div className="border border-zinc-300 rounded p-3 max-h-96 overflow-y-auto bg-white">
          <h4 className="text-sm font-medium text-zinc-700 mb-2">Classic Indian school games</h4>
          {ACTIVITY_BANK.filter((a) => a.category === "classic-indian-school-games").map((a) => (
            <label
              key={a.id}
              className="flex items-start gap-2 py-1.5 cursor-pointer hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                checked={activityIds.includes(a.id)}
                onChange={() => toggleId(a.id, activityIds, setActivityIds)}
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900">
                  {a.name}
                  {a.headingSuffix ?? ""}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">{shortBody(a.body)}</div>
              </div>
            </label>
          ))}
          <h4 className="text-sm font-medium text-zinc-700 mb-2 mt-4">Crypto-native</h4>
          {ACTIVITY_BANK.filter((a) => a.category === "crypto-native").map((a) => (
            <label
              key={a.id}
              className="flex items-start gap-2 py-1.5 cursor-pointer hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                checked={activityIds.includes(a.id)}
                onChange={() => toggleId(a.id, activityIds, setActivityIds)}
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900">
                  {a.name}
                  {a.headingSuffix ?? ""}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">{shortBody(a.body)}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Stories</label>
        <p className="text-xs text-zinc-500 mt-1 mb-2">Primed for Mask to tell if Baz cues him. Pick 0–3.</p>
        <div className="border border-zinc-300 rounded p-3 max-h-64 overflow-y-auto bg-white">
          {STORY_BANK.map((s) => (
            <label
              key={s.id}
              className="flex items-start gap-2 py-1.5 cursor-pointer hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                checked={storyIds.includes(s.id)}
                onChange={() => toggleId(s.id, storyIds, setStoryIds)}
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900">{s.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{shortBody(s.body)}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Custom notes</label>
        <p className="text-xs text-zinc-500 mt-1 mb-2">Anything beyond the pickers</p>
        <textarea
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          placeholder="Session-specific notes — anything beyond the pickers (focus areas, callbacks, hardware notes)..."
          className="w-full border border-zinc-300 rounded px-3 py-2 min-h-32 font-mono text-sm"
        />
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="flex gap-3 items-center">
        <button
          type="submit"
          disabled={submitting}
          className="bg-zinc-900 text-white px-4 py-2 rounded hover:bg-zinc-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving…" : existing ? "Save Changes" : "Create Session"}
        </button>
        <Link
          href={existing ? `/admin/${existing.id}` : "/admin"}
          className="text-zinc-600 hover:text-zinc-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
