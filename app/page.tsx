"use client";

import { Suspense, useEffect, useState, type ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import Mask from "@/components/Mask";
import type { Viseme } from "@/lib/types";
import type { WordState } from "@/lib/useCurrentWord";
import Starfield from "@/components/Starfield";
import StatusIndicator, { type Status } from "@/components/StatusIndicator";
import Subtitles from "@/components/Subtitles";
import VoiceLoop from "@/components/VoiceLoop";

function VoiceLoopWithSession(
  props: Omit<NonNullable<ComponentProps<typeof VoiceLoop>>, "sessionId">,
) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") ?? undefined;
  return <VoiceLoop {...props} sessionId={sessionId} />;
}

export default function Page() {
  const [status, setStatus] = useState<Status>("idle");
  const [viseme, setViseme] = useState<Viseme>("rest");
  const [wordState, setWordState] = useState<WordState>({
    sentenceIndex: null,
    activeWordIndex: null,
    sentence: null,
  });
  const [subtitleVisible, setSubtitleVisible] = useState(false);

  useEffect(() => {
    if (status === "speaking") {
      setSubtitleVisible(true);
      return;
    }
    if (status === "idle") {
      const id = setTimeout(() => setSubtitleVisible(false), 2000);
      return () => clearTimeout(id);
    }
  }, [status]);
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 z-0">
        <Starfield />
      </div>
      <Mask
        viseme={viseme}
        className="absolute left-1/2 top-1/2 z-10 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2"
      />
      <Subtitles
        sentence={wordState.sentence}
        activeWordIndex={wordState.activeWordIndex}
        visible={subtitleVisible}
      />
      <StatusIndicator status={status} className="fixed top-6 right-6 z-20" />
      <Suspense>
        <VoiceLoopWithSession
          onStatusChange={setStatus}
          onVisemeChange={setViseme}
          onWordStateChange={setWordState}
        />
      </Suspense>
    </main>
  );
}
