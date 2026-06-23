"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAssetButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!window.confirm("Delete this asset? This can't be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/assets/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({ error: "Unknown error" }))) as {
        error?: string;
      };
      alert(`Delete failed: ${body.error ?? res.status}`);
      setDeleting(false);
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={deleting}
      className="text-red-600 hover:text-red-800 text-sm disabled:text-zinc-400 disabled:cursor-not-allowed"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
