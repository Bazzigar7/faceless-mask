import Link from "next/link";
import { loadSessionContext, type SessionContext } from "@/lib/sessionContext";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
      <div className="text-zinc-900">{value}</div>
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

function DetailView({ session }: { session: SessionContext }) {
  return (
    <main className="min-h-screen bg-white text-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900 text-sm mb-4 inline-block">
          ← Back to sessions
        </Link>

        <h1 className="text-3xl font-bold mb-1">{session.topic}</h1>
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
          {session.brief ? (
            <pre className="bg-zinc-50 border border-zinc-200 rounded p-4 text-sm overflow-x-auto">
              {JSON.stringify(session.brief, null, 2)}
            </pre>
          ) : (
            <p className="text-zinc-500 italic">No brief yet.</p>
          )}
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
  const session = await loadSessionContext(params.sessionId);

  if (!session) {
    return <NotFoundState sessionId={params.sessionId} />;
  }

  return <DetailView session={session} />;
}
