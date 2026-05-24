"use client";

import { Suspense, useEffect, useState, type ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import type { Asset, Viseme } from "@/lib/types";
import type { WordState } from "@/lib/useCurrentWord";
import { getMode } from "@/lib/modeStateMachine";
import Starfield from "@/components/Starfield";
import StageLayout from "@/components/StageLayout";
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
  const [matchedAsset, setMatchedAsset] = useState<Asset | null>(null);

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

  const mode = getMode(matchedAsset);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 z-0">
        <Starfield />
      </div>
      <StageLayout viseme={viseme} matchedAsset={matchedAsset} mode={mode} />
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
          onMatchedAssetChange={setMatchedAsset}
        />
      </Suspense>
    </main>
  );
}
