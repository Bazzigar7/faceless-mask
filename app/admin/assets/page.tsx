import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { listAssets } from "@/lib/listAssets";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  noStore();
  const assets = await listAssets();

  return (
    <main className="min-h-screen bg-white text-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900 text-sm mb-6 inline-block">
          ← Back to admin
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Assets</h1>
            <p className="text-zinc-600">Media library for stage visuals</p>
          </div>
          <Link
            href="/admin/assets/new"
            className="bg-zinc-900 text-white px-4 py-2 rounded hover:bg-zinc-700"
          >
            + New Asset
          </Link>
        </div>

        {assets.length === 0 ? (
          <p className="text-zinc-500">No assets yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-200">
                <th className="text-left py-3 px-4 font-semibold">Type</th>
                <th className="text-left py-3 px-4 font-semibold">Tags</th>
                <th className="text-left py-3 px-4 font-semibold">Exact phrases</th>
                <th className="text-left py-3 px-4 font-semibold">Description</th>
                <th className="text-left py-3 px-4 font-semibold">Preview</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-3 px-4 text-zinc-900">{asset.type}</td>
                  <td className="py-3 px-4 text-zinc-700 text-sm">{asset.tags.join(", ")}</td>
                  <td className="py-3 px-4 text-zinc-700 text-sm">
                    {asset.exact_phrases.length > 0 ? asset.exact_phrases.join(", ") : "—"}
                  </td>
                  <td className="py-3 px-4 text-zinc-700 text-sm">
                    {asset.description
                      ? asset.description.length > 60
                        ? asset.description.slice(0, 60).trimEnd() + "…"
                        : asset.description
                      : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {asset.type === "image" ? (
                      <img src={asset.url} alt={asset.alt_text ?? ""} className="h-10" />
                    ) : (
                      <span className="text-zinc-500 text-sm">video</span>
                    )}
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
