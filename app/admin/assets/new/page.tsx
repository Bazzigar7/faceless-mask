import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import AssetForm from "@/components/AssetForm";

export const dynamic = "force-dynamic";

export default async function NewAssetPage() {
  noStore();

  return (
    <main className="min-h-screen bg-white text-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/assets"
          className="text-zinc-500 hover:text-zinc-900 text-sm mb-4 inline-block"
        >
          ← Back to assets
        </Link>
        <h1 className="text-3xl font-bold mb-1">New Asset</h1>
        <p className="text-zinc-600 mb-8">Upload a file to the stage media library.</p>
        <AssetForm />
      </div>
    </main>
  );
}
