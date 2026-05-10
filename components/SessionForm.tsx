"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TrackListItem } from "@/lib/listTracks";

type ExistingSession = {
  id: string;
  sessionNumber: number | null;
  topic: string;
  date: string;
  brief: Record<string, unknown> | null;
  trackId: string;
  trackDisplayName: string;
};

type SessionFormProps = {
  tracks?: TrackListItem[];
  existing?: ExistingSession;
};

export default function SessionForm({ tracks, existing }: SessionFormProps) {
  const router = useRouter();
  const [topic, setTopic] = useState(existing?.topic ?? "");
  const [date, setDate] = useState(
    existing ? existing.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [sessionNumber, setSessionNumber] = useState(
    existing?.sessionNumber != null ? String(existing.sessionNumber) : "",
  );
  const [brief, setBrief] = useState(
    existing?.brief ? JSON.stringify(existing.brief, null, 2) : "",
  );
  const [trackId, setTrackId] = useState(existing?.trackId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let parsedBrief: Record<string, unknown> | null = null;
    if (brief.trim()) {
      try {
        parsedBrief = JSON.parse(brief);
      } catch {
        setError("Brief must be valid JSON, or empty.");
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      sessionNumber: sessionNumber ? parseInt(sessionNumber, 10) : null,
      topic: topic.trim(),
      date,
      brief: parsedBrief,
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

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Brief (JSON, optional)</label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Enter brief as JSON, or leave empty"
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
