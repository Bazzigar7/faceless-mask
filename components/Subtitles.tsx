"use client";

import type { SentenceAlignment } from "@/lib/types";

interface Props {
  sentence: SentenceAlignment | null;
  activeWordIndex: number | null;
  visible: boolean;
}

export default function Subtitles({ sentence, activeWordIndex, visible }: Props) {
  const words = sentence?.words ?? [];
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center px-[10vw]"
      style={{
        opacity: visible && sentence ? 1 : 0,
        transition: `opacity ${visible ? 200 : 400}ms ease`,
      }}
    >
      <div
        className="max-w-[80vw] text-center leading-snug"
        style={{
          fontFamily:
            "var(--font-noto-sans), var(--font-noto-sans-tamil), var(--font-noto-sans-devanagari), sans-serif",
          fontSize: "32px",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
        }}
      >
        {words.map((word, i) => (
          <span
            key={i}
            className={i === activeWordIndex ? "text-white" : "text-gray-500"}
          >
            {word.text}{i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
