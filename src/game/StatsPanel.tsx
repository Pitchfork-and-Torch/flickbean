import { shareCardOrDownload } from "./shareCard";
import {
  formatDistance,
  formatRubs,
  shareBadgeUrl,
  shareStatsUrl,
  useGame,
  X_HANDLE,
} from "./store";
import { maxedUpgradeCount, UPGRADES } from "./upgrades";
import {
  ASCEND_SKILLS,
  MYTHIC_SKILLS,
  rankDisplayName,
} from "./progression";

export function StatsPanel() {
  const open = useGame((s) => s.statsOpen);
  const setStatsOpen = useGame((s) => s.setStatsOpen);
  const totalRubs = useGame((s) => s.totalRubs);
  const lifetimeDistance = useGame((s) => s.lifetimeDistance);
  const bestCombo = useGame((s) => s.bestCombo);
  const climaxes = useGame((s) => s.climaxes);
  const prizes = useGame((s) => s.prizes);
  const facesCollected = useGame((s) => s.facesCollected);
  const upgrades = useGame((s) => s.upgrades);
  const ascend = useGame((s) => s.ascend);
  const mythic = useGame((s) => s.mythic);
  const beanMaster = useGame((s) => s.beanMaster);
  const orbital = useGame((s) => s.orbital);
  const voidbean = useGame((s) => s.voidbean);
  const titleAsO = useGame((s) => s.titleAsO);
  const toggleTitleAsO = useGame((s) => s.toggleTitleAsO);
  const resetProgress = useGame((s) => s.resetProgress);

  if (!open) return null;

  const maxed = maxedUpgradeCount(upgrades);
  const ascendMaxed = ASCEND_SKILLS.filter(
    (s) => (ascend[s.id] ?? 0) >= s.maxLevel,
  ).length;
  const mythicMaxed = MYTHIC_SKILLS.filter(
    (s) => (mythic[s.id] ?? 0) >= s.maxLevel,
  ).length;

  const rank = rankDisplayName(voidbean, orbital, beanMaster, titleAsO);

  const rows = [
    { label: "Lifetime rubs", value: formatRubs(totalRubs) },
    { label: "Distance rubbed", value: formatDistance(lifetimeDistance) },
    { label: "Best combo", value: bestCombo.toString() },
    { label: "Climaxes", value: climaxes.toString() },
    { label: "Frenzy prizes", value: prizes.toString() },
    { label: "O Count", value: facesCollected.toString() },
    { label: "Core maxed", value: `${maxed}/${UPGRADES.length}` },
    ...(beanMaster
      ? [
          {
            label: "Ascension maxed",
            value: `${ascendMaxed}/${ASCEND_SKILLS.length}`,
          },
        ]
      : []),
    ...(orbital
      ? [
          {
            label: "Mythic maxed",
            value: `${mythicMaxed}/${MYTHIC_SKILLS.length}`,
          },
        ]
      : []),
  ];

  const topBadge = voidbean
    ? "voidbean"
    : orbital
      ? "orbital"
      : beanMaster
        ? "beanMaster"
        : null;

  const share = () => {
    const stats = {
      totalRubs,
      lifetimeDistance,
      bestCombo,
      climaxes,
      prizes,
      facesCollected,
      beanMaster,
      orbital,
      voidbean,
    };
    void shareCardOrDownload(
      {
        title: rank ?? "Flickbean",
        totalRubs,
        lifetimeDistance,
        bestCombo,
        climaxes,
        prizes,
        facesCollected,
      },
      shareStatsUrl(stats),
    );
  };

  const shareBadge = () => {
    if (!topBadge) return;
    void shareCardOrDownload(
      {
        title: rank ?? "Flickbean",
        totalRubs,
        bestCombo,
        prizes,
        facesCollected,
      },
      shareBadgeUrl(topBadge, {
        totalRubs,
        bestCombo,
        prizes,
        facesCollected,
      }),
    );
  };

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Stats"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg/70"
        aria-label="Close stats"
        onClick={() => setStatsOpen(false)}
      />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-2xl border border-border bg-surface shadow-soft sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold tracking-tight text-fg">
            Stats
          </h2>
          <button
            type="button"
            onClick={() => setStatsOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-elevated text-muted hover:text-fg"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="border-b border-border px-4 py-3">
          {topBadge ? (
            <div className="rounded-xl border border-accent/35 bg-elevated px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                Highest rank
              </p>
              <button
                type="button"
                onClick={voidbean ? toggleTitleAsO : undefined}
                disabled={!voidbean}
                className={`mt-0.5 text-left font-display text-base font-semibold text-fg ${
                  voidbean ? "active:scale-[0.98]" : ""
                }`}
                aria-label={
                  voidbean
                    ? titleAsO
                      ? "O  -  tap for BEAN GOD"
                      : "BEAN GOD  -  tap to become O"
                    : rank ?? "rank"
                }
              >
                {rank}
              </button>
              <p className="text-xs text-muted">
                {voidbean
                  ? titleAsO
                    ? "Tap title to restore BEAN GOD"
                    : "Tap title to become O"
                  : orbital
                    ? "Mythic path open"
                    : "Ascension path open"}
              </p>
              <button
                type="button"
                onClick={shareBadge}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-fg text-sm font-semibold text-bg active:scale-[0.98]"
              >
                <XIcon />
                Share rank
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-elevated/60 px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">
                Next rank
              </p>
              <p className="mt-0.5 text-sm font-medium text-fg">BEANMASTER</p>
              <p className="mt-0.5 text-xs text-muted">Max every core upgrade</p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent/70"
                  style={{ width: `${(maxed / UPGRADES.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-0 p-2">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between rounded-xl px-3 py-3"
            >
              <span className="text-sm text-muted">{r.label}</span>
              <span className="tabular text-sm font-medium text-fg">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={share}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-elevated text-sm font-medium text-fg hover:border-border-strong active:scale-[0.98]"
          >
            <XIcon />
            Share stats
          </button>
          <p className="text-center text-[11px] text-subtle">
            Optional · tags @{X_HANDLE}
          </p>
          <button
            type="button"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm("Reset all progress? This cannot be undone.")
              ) {
                resetProgress();
                setStatsOpen(false);
              }
            }}
            className="h-11 w-full rounded-xl border border-border bg-elevated text-sm font-medium text-danger hover:border-danger/40"
          >
            Reset progress
          </button>
        </div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}
