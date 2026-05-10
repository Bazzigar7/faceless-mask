import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { listSessions } from "@/lib/listSessions";

// Opt out of Next.js Server Component fetch caching. Admin reads
// must always reflect the latest DB state since mutations happen
// between requests. dynamic='force-dynamic' covers rendering;
// noStore() inside the body covers the underlying fetch cache
// (supabase-js fetches go through Next.js's data cache otherwise).
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  noStore();
  const sessions = await listSessions();

  return (
    <main className="min-h-screen bg-white text-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mask Admin</h1>
            <p className="text-zinc-600">Session list</p>
          </div>
          <Link href="/admin/new" className="bg-zinc-900 text-white px-4 py-2 rounded hover:bg-zinc-700">
            + New Session
          </Link>
        </div>

        {sessions.length === 0 ? (
          <p className="text-zinc-500">No sessions yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-200">
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">College</th>
                <th className="text-left py-3 px-4 font-semibold">Cohort</th>
                <th className="text-left py-3 px-4 font-semibold">Track</th>
                <th className="text-left py-3 px-4 font-semibold">#</th>
                <th className="text-left py-3 px-4 font-semibold">Topic</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td>
                    <Link href={`/admin/${s.id}`} className="block py-3 px-4 text-zinc-900 hover:text-zinc-600">
                      {new Date(s.date).toLocaleDateString()}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/admin/${s.id}`} className="block py-3 px-4 text-zinc-900 hover:text-zinc-600">
                      {s.collegeName}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/admin/${s.id}`} className="block py-3 px-4 text-zinc-900 hover:text-zinc-600">
                      {s.cohortName}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/admin/${s.id}`} className="block py-3 px-4 text-zinc-900 hover:text-zinc-600">
                      {s.trackName}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/admin/${s.id}`} className="block py-3 px-4 text-zinc-900 hover:text-zinc-600">
                      {s.sessionNumber ?? "-"}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/admin/${s.id}`} className="block py-3 px-4 text-zinc-900 hover:text-zinc-600">
                      {s.topic}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
