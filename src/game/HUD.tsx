import type { ReactNode } from "react";
import { CreditButton } from "./CreditButton";
import { rankDisplayName } from "./progression";
import { formatRubs, useGame } from "./store";
import { FRENZY_SPEED } from "./types";

export function HUD() {
  const rubs = useGame((s) => s.rubs);
  const heat = useGame((s) => s.heat);
  const combo = useGame((s) => s.combo);
  const frenzy = useGame((s) => s.frenzy);
  const lastSpeed = useGame((s) => s.lastSpeed);
  const beanMaster = useGame((s) => s.beanMaster);
  const orbital = useGame((s) => s.orbital);
  const voidbean = useGame((s) => s.voidbean);
  const titleAsO = useGame((s) => s.titleAsO);
  const setShopOpen = useGame((s) => s.setShopOpen);
  const setShopTab = useGame((s) => s.setShopTab);
  const setStatsOpen = useGame((s) => s.setStatsOpen);
  const resetProgress = useGame((s) => s.resetProgress);
  const toggleTitleAsO = useGame((s) => s.toggleTitleAsO);
  const rubbing = useGame((s) => s.rubbing);
  const muted = useGame((s) => s.muted);
  const setMutedPref = useGame((s) => s.setMutedPref);
  const daily = useGame((s) => s.daily);
  const claimDaily = useGame((s) => s.claimDaily);
  const started = useGame((s) => s.started);

  const fast = rubbing && lastSpeed >= FRENZY_SPEED;
  const nearPrize = frenzy >= 0.72;

  const rank = rankDisplayName(voidbean, orbital, beanMaster, titleAsO);

  const onRankClick = () => {
    if (voidbean) {
      // One click → O (toggle)
      toggleTitleAsO();
      return;
    }
    if (orbital) setShopTab("path");
    else if (beanMaster) setShopTab("ascend");
    setShopOpen(true);
  };

  const onReset = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Reset all progress? This cannot be undone.")
    ) {
      resetProgress();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
      <div className="pointer-events-auto flex items-start justify-between gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">
            rubs
          </p>
          <p className="mt-0.5 truncate font-display text-3xl font-semibold tracking-tight text-fg tabular sm:text-4xl">
            {formatRubs(rubs)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {combo > 1 && (
              <p className="text-sm font-medium text-accent tabular">{combo} combo</p>
            )}
            {started && (
              <button
                type="button"
                onClick={() => {
                  if (daily.progressPx >= daily.goalPx && !daily.claimed) claimDaily();
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-elevated px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted"
                aria-label="Daily Flick"
              >
                Daily{" "}
                {daily.claimed
                  ? "done"
                  : daily.progressPx >= daily.goalPx
                    ? "claim"
                    : `${Math.min(99, Math.floor((daily.progressPx / daily.goalPx) * 100))}%`}
              </button>
            )}
            {rank && (
              <button
                type="button"
                onClick={onRankClick}
                className={`inline-flex items-center gap-1 rounded-full border border-accent/40 bg-elevated px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent transition-transform active:scale-[0.97] ${
                  voidbean && titleAsO ? "min-w-8 justify-center text-sm" : ""
                }`}
                aria-label={
                  voidbean
                    ? titleAsO
                      ? "Title O  -  tap for BEAN GOD"
                      : "BEAN GOD  -  tap to become O"
                    : `${rank} rank  -  open progression`
                }
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                {rank}
              </button>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <IconButton
            label={muted ? "Unmute" : "Mute"}
            onClick={() => setMutedPref(!muted)}
          >
            {muted ? <MuteIcon /> : <SoundIcon />}
          </IconButton>
          <IconButton label="Stats" onClick={() => setStatsOpen(true)}>
            <ChartIcon />
          </IconButton>
          <IconButton
            label="Path"
            onClick={() => {
              setShopTab(beanMaster ? "path" : "core");
              setShopOpen(true);
            }}
            primary
          >
            <ShopIcon />
          </IconButton>
        </div>
      </div>

      <div className="pointer-events-none mx-auto mt-1 w-full max-w-xs px-6">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
          <span>Heat</span>
          <span className="tabular text-muted">{Math.round(heat * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-heat transition-[width] duration-100 ease-out"
            style={{ width: `${Math.max(2, heat * 100)}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
          <span>Frenzy</span>
          <span className={`tabular ${fast ? "text-accent" : "text-muted"}`}>
            {fast ? "MAX SPEED" : `${Math.round(frenzy * 100)}%`}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-fg/80 transition-[width] duration-75 ease-out"
            style={{ width: `${Math.max(frenzy > 0 ? 2 : 0, frenzy * 100)}%` }}
          />
        </div>
        {nearPrize && rubbing && (
          <p className="mt-1.5 text-center text-xs text-accent">Almost there  -  keep the speed</p>
        )}
        {!nearPrize && fast && (
          <p className="mt-1.5 text-center text-xs text-accent">
            Keep the speed  -  prize charging
          </p>
        )}
        {!fast && heat > 0.85 && (
          <p className="mt-1.5 text-center text-xs text-accent">
            Keep rubbing  -  climax building
          </p>
        )}
      </div>

      <div className="flex-1" />

      <div className="pointer-events-none relative flex items-end justify-center px-3 pb-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.75rem))]">
        <button
          type="button"
          onClick={onReset}
          className="pointer-events-auto absolute bottom-0 left-3 z-10 min-h-11 rounded-lg px-2 py-2 text-[11px] font-medium tracking-wide text-subtle/70 transition-colors hover:text-muted"
          aria-label="Reset stats"
        >
          Reset
        </button>

        <div className="flex flex-col items-center gap-2">
          <p
            className={`text-sm transition-opacity duration-300 ${
              rubbing ? "opacity-0" : "opacity-70"
            } text-muted`}
          >
            Rub fast for wet pops · hold max speed for a prize
          </p>
          <CreditButton compact />
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  primary,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`pointer-events-auto flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors active:scale-[0.98] ${
        primary
          ? "border-accent/30 bg-accent text-accent-fg hover:bg-accent/90"
          : "border-border bg-elevated/90 text-fg hover:border-border-strong"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ShopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h16l-1.2 11.2A2 2 0 0 1 16.81 21H7.19a2 2 0 0 1-1.99-1.8L4 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 8V6a4 4 0 1 1 8 0v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10v4h3.2L12 18V6L7.2 10H4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.5c1.2 1 1.8 2.2 1.8 2.5s-.6 1.5-1.8 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10v4h3.2L12 18V6L7.2 10H4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M16 10l5 5M21 10l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 19V5M4 19h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8 15v-4M12 15V8M16 15v-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
