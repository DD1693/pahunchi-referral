import { useEffect, useRef, useState } from "react";
import type { BarrierLabel } from "@/lib/types";

/** Fixed, pre-recorded, approved Hindi prompts bundled in /public/audio (cached by the service worker). */
export const OPENING_PROMPT = "/audio/pahunchi_opening_hi.mp3";
export const BARRIER_PROMPTS: Record<BarrierLabel, string> = {
  access_cost: "/audio/pahunchi_access_cost_hi.mp3",
  household_constraint: "/audio/pahunchi_household_constraint_hi.mp3",
  fear_hesitancy: "/audio/pahunchi_fear_hesitancy_hi.mp3",
  work_caregiving: "/audio/pahunchi_work_caregiving_hi.mp3",
  understanding_information: "/audio/pahunchi_understanding_information_hi.mp3",
};

/** Plays only when pressed. Never records audio. */
export function AudioPromptButton({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => () => ref.current?.pause(), []);

  function toggle() {
    if (!ref.current) {
      ref.current = new Audio(src);
      ref.current.onended = () => setPlaying(false);
      ref.current.onerror = () => { setPlaying(false); setError(true); };
    }
    const a = ref.current;
    if (playing) {
      a.pause();
      a.currentTime = 0;
      setPlaying(false);
      return;
    }
    setError(false);
    a.play().then(() => setPlaying(true)).catch(() => setError(true));
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-input bg-card px-3 text-sm font-medium hover:border-primary"
      >
        <span aria-hidden>🔊</span> {playing ? "Stop prompt" : "Play approved Hindi prompt"}
      </button>
      {error && <span className="text-xs text-destructive">Audio could not be played.</span>}
    </span>
  );
}
