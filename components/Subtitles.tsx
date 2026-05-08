"use client";

interface Props {
  text: string;
  visible: boolean;
}

export default function Subtitles({ text, visible }: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-32 z-20 flex justify-center px-[10vw]"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${visible ? 200 : 400}ms ease`,
      }}
    >
      <div
        className="max-w-[80vw] text-center text-white leading-snug"
        style={{
          fontFamily:
            "var(--font-noto-sans), var(--font-noto-sans-tamil), var(--font-noto-sans-devanagari), sans-serif",
          fontSize: "32px",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
        }}
      >
        {text}
      </div>
    </div>
  );
}
