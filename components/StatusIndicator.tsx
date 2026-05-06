"use client";

export type Status = "idle" | "listening" | "thinking" | "speaking";

const COPY: Record<Status, string> = {
  idle: "Ready",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

export default function StatusIndicator({
  status,
  className = "",
}: {
  status: Status;
  className?: string;
}) {
  return (
    <div className={`font-mono text-xs text-white/50 ${className}`}>
      {COPY[status]}
    </div>
  );
}
