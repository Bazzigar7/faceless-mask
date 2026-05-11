import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import SessionForm from "@/components/SessionForm";
import { loadSessionContext } from "@/lib/sessionContext";

// Opt out of Server Component fetch caching — see 2b.4.3a discovery.
export const dynamic = "force-dynamic";

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

export default async function EditSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  noStore();
  const session = await loadSessionContext(params.sessionId);

  if (!session) {
    return <NotFoundState sessionId={params.sessionId} />;
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/admin/${params.sessionId}`}
          className="text-zinc-500 hover:text-zinc-900 text-sm mb-4 inline-block"
        >
          ← Back to session
        </Link>
        <h1 className="text-3xl font-bold mb-1">Edit Session</h1>
        <p className="text-zinc-600 mb-8">Update topic, date, session number, or brief.</p>

        <SessionForm
          existing={{
            id: params.sessionId,
            sessionNumber: session.sessionNumber,
            topic: session.topic,
            date: session.date,
            brief: session.brief,
            trackId: session.trackId,
            trackDisplayName: `${session.trackName} — ${session.cohortName} (${session.collegeName})`,
            summary: session.summary,
          }}
        />
      </div>
    </main>
  );
}
