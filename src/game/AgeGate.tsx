import { Check } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { SITE_NAME } from "./store";

export const AGE_STORAGE_KEY = "flickbean-age-18";
const HUB_URL = "https://jonbailey.xyz/";

function readConfirmed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AGE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeConfirmed() {
  try {
    window.localStorage.setItem(AGE_STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function AgeGatedApp({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"pending" | "blocked" | "ok">("pending");

  useEffect(() => {
    setStatus(readConfirmed() ? "ok" : "blocked");
  }, []);

  if (status === "pending") {
    return (
      <div
        className="h-dvh w-full bg-bg"
        aria-busy="true"
        aria-label="Loading"
      />
    );
  }

  if (status === "blocked") {
    return (
      <div className="relative h-dvh w-full overflow-hidden bg-bg">
        <AgeGate
          onConfirm={() => {
            writeConfirmed();
            setStatus("ok");
          }}
        />
      </div>
    );
  }

  return (
    <>
      <HitsAfterConfirm />
      {children}
    </>
  );
}

function HitsAfterConfirm() {
  useEffect(() => {
    const src = "https://hits.jonbailey.xyz/c.js";
    if (document.querySelector(`script[src="${src}"][data-site="flickbean"]`)) {
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset.site = "flickbean";
    document.body.appendChild(script);
  }, []);
  return null;
}

function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-copy"
    >
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
        <h1
          id="age-gate-title"
          className="mt-3 font-display text-5xl font-semibold tracking-tight text-fg sm:text-6xl"
        >
          18+
        </h1>
        <p
          id="age-gate-copy"
          className="mt-4 max-w-xs text-base leading-relaxed text-muted"
        >
          This game is for adults. Confirm you are 18 or older to enter.
        </p>

        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => setChecked((v) => !v)}
          className="mt-8 flex min-h-11 w-full max-w-[280px] items-center gap-3 rounded-xl border border-border bg-elevated px-4 py-3 text-left transition-colors hover:border-border-strong"
        >
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-sm border ${
              checked
                ? "border-accent bg-accent text-accent-fg"
                : "border-border-strong bg-bg"
            }`}
            aria-hidden
          >
            {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
          </span>
          <span className="text-sm font-medium leading-snug text-fg">
            I am 18 or older
          </span>
        </button>

        <button
          type="button"
          disabled={!checked}
          onClick={onConfirm}
          className="mt-4 flex h-14 w-full max-w-[280px] items-center justify-center rounded-2xl bg-accent text-base font-semibold text-accent-fg transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
        >
          Enter
        </button>

        <a
          href={HUB_URL}
          className="mt-3 flex h-11 w-full max-w-[280px] items-center justify-center rounded-xl border border-border bg-elevated text-sm font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          Leave
        </a>
      </div>
    </div>
  );
}
