import { listSessions } from "@/lib/listSessions";

export default async function AdminPage() {
  const sessions = await listSessions();

  return (
    <main className="min-h-screen bg-white text-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mask Admin</h1>
        <p className="text-zinc-600 mb-8">Session list</p>

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
                  <td className="py-3 px-4">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{s.collegeName}</td>
                  <td className="py-3 px-4">{s.cohortName}</td>
                  <td className="py-3 px-4">{s.trackName}</td>
                  <td className="py-3 px-4">{s.sessionNumber ?? "-"}</td>
                  <td className="py-3 px-4">{s.topic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
