"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Phase = "idle" | "signing" | "uploading" | "saving";

function parseCommaSeparated(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function AssetForm() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [exactPhrases, setExactPhrases] = useState("");
  const [altText, setAltText] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError("Pick a file first");
      return;
    }

    let type: "image" | "video";
    if (file.type.startsWith("image/")) {
      type = "image";
    } else if (file.type.startsWith("video/")) {
      type = "video";
    } else {
      setError("Unsupported file type");
      return;
    }

    // Step 1 — mint signed upload URL
    setPhase("signing");
    setError(null);

    const signRes = await fetch("/api/admin/assets/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });

    if (!signRes.ok) {
      const body = (await signRes.json().catch(() => ({ error: "Unknown error" }))) as {
        error?: string;
      };
      setError(`Could not start upload: ${body.error ?? signRes.status}`);
      setPhase("idle");
      return;
    }

    const { token, path } = (await signRes.json()) as {
      token: string;
      path: string;
    };

    // Step 2 — upload file direct to storage
    setPhase("uploading");

    const { error: upErr } = await supabase.storage
      .from("assets")
      .uploadToSignedUrl(path, token, file, { contentType: file.type });

    if (upErr) {
      setError(`Upload failed: ${upErr.message}`);
      setPhase("idle");
      return;
    }

    // Step 3 — record the asset row
    setPhase("saving");

    const tagsArr = parseCommaSeparated(tags);
    const phrasesArr = parseCommaSeparated(exactPhrases);

    const recordRes = await fetch("/api/admin/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        storage_path: path,
        tags: tagsArr,
        exact_phrases: phrasesArr,
        alt_text: altText || null,
        description: description || null,
      }),
    });

    if (!recordRes.ok) {
      const body = (await recordRes.json().catch(() => ({ error: "Unknown error" }))) as {
        error?: string;
      };
      setError(
        `File uploaded but saving failed — please try again. (${body.error ?? recordRes.status})`,
      );
      setPhase("idle");
      return;
    }

    router.push("/admin/assets");
  }

  const buttonLabel =
    phase === "idle"
      ? "Upload Asset"
      : phase === "signing"
        ? "Signing…"
        : phase === "uploading"
          ? "Uploading…"
          : "Saving…";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">File</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,video/mp4"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full border border-zinc-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Trigger tags (comma-separated, fuzzy match)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="bitcoin, btc, logo"
          className="w-full border border-zinc-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Exact phrases (comma-separated, exact match)
        </label>
        <input
          type="text"
          value={exactPhrases}
          onChange={(e) => setExactPhrases(e.target.value)}
          placeholder="btc flow, the bitcoin image"
          className="w-full border border-zinc-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Alt text (optional)
        </label>
        <input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          className="w-full border border-zinc-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Description for Mask (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this shows + the point — Mask uses this to explain it"
          className="w-full border border-zinc-300 rounded px-3 py-2 min-h-24 text-sm"
        />
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="flex gap-3 items-center">
        <button
          type="submit"
          disabled={phase !== "idle"}
          className="bg-zinc-900 text-white px-4 py-2 rounded hover:bg-zinc-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
        >
          {buttonLabel}
        </button>
        <Link href="/admin/assets" className="text-zinc-600 hover:text-zinc-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}
