"use client";

import { useState } from "react";
import Mask from "@/components/Mask";
import Starfield from "@/components/Starfield";
import StatusIndicator, { type Status } from "@/components/StatusIndicator";
import VoiceLoop from "@/components/VoiceLoop";

export default function Page() {
  const [status, setStatus] = useState<Status>("idle");
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 z-0">
        <Starfield />
      </div>
      <Mask
        viseme="rest"
        className="absolute left-1/2 top-1/2 z-10 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2"
      />
      <StatusIndicator status={status} className="fixed top-6 right-6 z-20" />
      <VoiceLoop onStatusChange={setStatus} />
    </main>
  );
}
