import Mask from "@/components/Mask";
import Starfield from "@/components/Starfield";
import VoiceLoop from "@/components/VoiceLoop";

export default function Page() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8 text-white">
      <div className="absolute inset-0 z-0">
        <Starfield />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8">
        <Mask viseme="rest" className="w-80 h-80" />
        <h1 className="text-2xl font-semibold tracking-tight">Mask</h1>
        <p className="text-sm text-zinc-400">AI co-host · push to talk</p>
        <VoiceLoop />
      </div>
    </main>
  );
}
