import MaskDebugPicker from "@/components/MaskDebugPicker";
import VoiceLoop from "@/components/VoiceLoop";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-950 p-8 text-white">
      {/* 2a.1b temp mount — replaced by stage layout in Substep B */}
      <MaskDebugPicker />
      <h1 className="text-2xl font-semibold tracking-tight">Mask</h1>
      <p className="text-sm text-zinc-400">AI co-host · push to talk</p>
      <VoiceLoop />
    </main>
  );
}
