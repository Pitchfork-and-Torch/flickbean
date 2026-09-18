import { playStart, unlockAudio } from "./audio";
import { CreditButton } from "./CreditButton";
import { SITE_NAME, useGame } from "./store";

export function StartScreen() {
  const started = useGame((s) => s.started);
  const start = useGame((s) => s.start);
  const totalRubs = useGame((s) => s.totalRubs);

  if (started) return null;

  const returning = totalRubs > 0;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-bg px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-[38%] h-[min(70vw,420px)] w-[min(70vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--color-accent) 35%, transparent) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-subtle">
          {SITE_NAME}
        </p>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-fg sm:text-6xl">
          clit
        </h1>
        <p className="mt-4 max-w-xs text-base leading-relaxed text-muted">
          Like a screen-tap game - except you{" "}
          <span className="text-fg">rub</span>. Go fast for wet pops and uwus.
          Hold max speed for a prize.
        </p>

        <button
          type="button"
          onClick={async () => {
            await unlockAudio();
            playStart();
            start();
          }}
          className="mt-10 flex h-14 w-full max-w-[280px] items-center justify-center rounded-2xl bg-accent text-base font-semibold text-accent-fg transition-transform active:scale-[0.98]"
        >
          {returning ? "Continue rubbing" : "Start rubbing"}
        </button>

        <CreditButton className="mt-3" />

        <p className="mt-5 text-xs leading-relaxed text-subtle">
          Drag fast across the orb. Taps earn almost nothing.
        </p>
      </div>
    </div>
  );
}
