import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import SessionForm from "@/components/SessionForm";
import { listTracks } from "@/lib/listTracks";

// Opt out of Server Component fetch caching — see 2b.4.3a discovery.
export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  noStore();
  const tracks = await listTracks();

  return (
    <main className="min-h-screen bg-white text-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900 text-sm mb-4 inline-block">
          ← Back to sessions
        </Link>
        <h1 className="text-3xl font-bold mb-1">New Session</h1>
        <p className="text-zinc-600 mb-8">Create a session within an existing track.</p>

        {tracks.length === 0 ? (
          <p className="text-zinc-500">
            No tracks exist yet. Create a track via the Supabase dashboard first.
          </p>
        ) : (
          <SessionForm tracks={tracks} />
        )}
      </div>
    </main>
  );
}
