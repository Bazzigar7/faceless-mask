"use client";

export type Status = "idle" | "listening" | "thinking" | "speaking";

const COPY: Record<Status, string> = {
  idle: "Ready",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

const COLOR: Record<Status, string> = {
  idle: "bg-zinc-700",
  listening: "bg-emerald-500",
  thinking: "bg-amber-500",
  speaking: "bg-sky-500",
};

export default function StatusIndicator({ status }: { status: Status }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-300">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${COLOR[status]} ${status !== "idle" ? "animate-pulse" : ""}`}
        aria-hidden
      />
      <span>{COPY[status]}</span>
    </div>
  );
}
