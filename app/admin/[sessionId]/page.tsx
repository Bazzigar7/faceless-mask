import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { loadSessionContext, type SessionContext } from "@/lib/sessionContext";
import { parseBrief } from "@/lib/banks/parseBrief";
import { OPENER_BANK } from "@/lib/banks/openers";
import { ACTIVITY_BANK } from "@/lib/banks/activities";
import { STORY_BANK } from "@/lib/banks/stories";

// Opt out of Server Component fetch caching — admin pages must
// always reflect the latest DB state. noStore() in the body busts
// the underlying fetch cache that supabase-js calls land in.
export const dynamic = "force-dynamic";

// Shared className for bank-content prose (activity + story bodies).
// whitespace-pre-wrap preserves multi-paragraph bodies like
// "Stand, Stand, Sit" whose body is two paragraphs separated by \n\n.
// Custom notes uses a different color (zinc-900 vs zinc-700, Baz's own
// writing vs bank content) so it doesn't share this constant.
const BANK_BODY_CLASS = "text-sm text-zinc-700 mt-1 whitespace-pre-wrap";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
      <div className="text-zinc-900">{value}</div>
    </div>
  );
}

function BriefRenderer({ brief }: { brief: Record<string, unknown> | null }) {
  const parsed = parseBrief(brief);

  if (parsed.kind === "empty") {
    return <p className="text-zinc-500 italic">No brief yet.</p>;
  }

  if (parsed.kind === "legacy") {
    return (
      <pre className="bg-zinc-50 border border-zinc-200 rounded p-4 text-sm overflow-x-auto">
        {JSON.stringify(parsed.raw, null, 2)}
      </pre>
    );
  }

  // kind === "structured"
  const { openerId, activityIds, storyIds, customNotes } = parsed.data;

  const opener = openerId ? OPENER_BANK.find((o) => o.id === openerId) : undefined;

  // Resolve IDs to bank entries; silently skip unknowns (renames,
  // typos, stale IDs). flatMap pattern: empty array on miss, single-
  // element array on hit — keeps the result strongly typed without
  // a typed-predicate `.filter()` cast.
  const activities = activityIds?.flatMap((id) => {
    const a = ACTIVITY_BANK.find((x) => x.id === id);
    return a ? [a] : [];
  }) ?? [];
  const stories = storyIds?.flatMap((id) => {
    const s = STORY_BANK.find((x) => x.id === id);
    return s ? [s] : [];
  }) ?? [];

  // Defensive fall-through: parseBrief routed to "structured" because
  // the brief had at least one structured key, but every ID lookup
  // failed and customNotes is empty. Mirror the formatter's fall-
  // through behavior — render raw JSON so Baz can spot stale IDs at
  // a glance. This defensive bridge now exists in two places
  // (formatter + here); natural extraction target if the pattern
  // proliferates.
  const hasAnySection =
    opener || activities.length > 0 || stories.length > 0 || customNotes;
  if (!hasAnySection) {
    return (
      <pre className="bg-zinc-50 border border-zinc-200 rounded p-4 text-sm overflow-x-auto">
        {JSON.stringify(brief, null, 2)}
      </pre>
    );
  }

  return (
    <div className="space-y-6">
      {opener && (
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Opener</div>
          <div className="text-sm text-zinc-500 mb-1">{opener.category} opener</div>
          <div className="text-zinc-900 italic">&quot;{opener.body}&quot;</div>
        </div>
      )}

      {activities.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Activities</div>
          <ul className="space-y-3">
            {activities.map((a) => (
              <li key={a.id}>
                <div className="font-medium text-zinc-900">
                  {a.name}
                  {a.headingSuffix ?? ""}
                </div>
                <div className={BANK_BODY_CLASS}>{a.body}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stories.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Stories</div>
          <ul className="space-y-3">
            {stories.map((s) => (
              <li key={s.id}>
                <div className="font-medium text-zinc-900">{s.name}</div>
                <div className={BANK_BODY_CLASS}>{s.body}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {customNotes && (
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Custom notes</div>
          <div className="text-zinc-900 whitespace-pre-wrap">{customNotes}</div>
        </div>
      )}
    </div>
  );
}

function NotFoundState({ sessionId }: { sessionId: string }) {
  return (
    <main className="min-h-screen bg-white text-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900 text-sm mb-4 inline-block">
          ← Back to sessions
        </Link>
        <h1 className="text-3xl font-bold mb-2">Session not found</h1>
        <p className="text-zinc-600">
          No session exists with ID:{" "}
          <code className="text-sm bg-zinc-100 px-2 py-1 rounded">{sessionId}</code>
        </p>
      </div>
    </main>
  );
}

function DetailView({ session, sessionId }: { session: SessionContext; sessionId: string }) {
  return (
    <main className="min-h-screen bg-white text-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900 text-sm mb-4 inline-block">
          ← Back to sessions
        </Link>

        <div className="flex items-start justify-between mb-1">
          <h1 className="text-3xl font-bold">{session.topic}</h1>
          <Link
            href={`/admin/${sessionId}/edit`}
            className="bg-zinc-900 text-white px-4 py-2 rounded hover:bg-zinc-700"
          >
            Edit
          </Link>
        </div>
        <p className="text-zinc-600 mb-8">
          Session {session.sessionNumber ?? "-"} of {session.trackTotalSessions ?? "-"}
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <DetailField label="College" value={session.collegeName} />
          <DetailField label="Cohort" value={session.cohortName} />
          <DetailField label="Track" value={session.trackName} />
          <DetailField label="Session Number" value={session.sessionNumber?.toString() ?? "—"} />
        </div>

        <div className="border-t border-zinc-200 pt-6">
          <h2 className="text-xl font-semibold mb-3">Brief</h2>
          <BriefRenderer brief={session.brief} />
        </div>
      </div>
    </main>
  );
}

export default async function SessionDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  noStore();
  const session = await loadSessionContext(params.sessionId);

  if (!session) {
    return <NotFoundState sessionId={params.sessionId} />;
  }

  return <DetailView session={session} sessionId={params.sessionId} />;
}
