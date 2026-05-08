"use client";

import { useEffect, useState } from "react";
import Mask from "@/components/Mask";
import type { Viseme } from "@/lib/types";
import Starfield from "@/components/Starfield";
import StatusIndicator, { type Status } from "@/components/StatusIndicator";
import Subtitles from "@/components/Subtitles";
import VoiceLoop from "@/components/VoiceLoop";

export default function Page() {
  const [status, setStatus] = useState<Status>("idle");
  const [viseme, setViseme] = useState<Viseme>("rest");
  const [reply, setReply] = useState("");
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
      <Subtitles text={reply} visible={subtitleVisible} />
      <StatusIndicator status={status} className="fixed top-6 right-6 z-20" />
      <VoiceLoop
        onStatusChange={setStatus}
        onVisemeChange={setViseme}
        onReplyChange={setReply}
      />
    </main>
  );
}
