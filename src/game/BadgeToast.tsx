import { BADGE_META, type BadgeId } from "./progression";
import { shareBadgeUrl, useGame } from "./store";

/** Non-blocking toast for BEANMASTER / ORBITAL / BEAN GOD */
export function BadgeToast() {
  const badge = useGame((s) => s.badgeToast);
  const dismiss = useGame((s) => s.dismissBadgeToast);
  const totalRubs = useGame((s) => s.totalRubs);
  const bestCombo = useGame((s) => s.bestCombo);
  const prizes = useGame((s) => s.prizes);
  const facesCollected = useGame((s) => s.facesCollected);
  const setShopOpen = useGame((s) => s.setShopOpen);
  const setShopTab = useGame((s) => s.setShopTab);
  const toggleTitleAsO = useGame((s) => s.toggleTitleAsO);

  if (!badge) return null;

  const meta = BADGE_META[badge];
  const nextHint =
    badge === "beanMaster"
      ? "Ascension skills & Path unlocked"
      : badge === "orbital"
        ? "Mythic skills & Path unlocked"
        : "Tap your title anytime to become O";

  const share = () => {
    window.open(
      shareBadgeUrl(badge, { totalRubs, bestCombo, prizes, facesCollected }),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openPath = () => {
    dismiss();
    setShopTab(
      badge === "voidbean" ? "path" : badge === "orbital" ? "mythic" : "ascend",
    );
    setShopOpen(true);
  };

  const becomeO = () => {
    toggleTitleAsO();
    dismiss();
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface/95 p-4 shadow-soft backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-elevated text-accent"
            aria-hidden
          >
            <RankGlyph badge={badge} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
              Rank unlocked
            </p>
            <p className="mt-0.5 font-display text-lg font-semibold tracking-tight text-fg">
              {meta.name}
            </p>
            <p className="mt-1 text-sm leading-snug text-muted">{meta.blurb}</p>
            <p className="mt-1 text-xs text-subtle">{nextHint}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-subtle hover:text-fg"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={share}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-fg text-sm font-semibold text-bg active:scale-[0.98]"
          >
            <XIcon />
            Share on X
          </button>
          {badge === "voidbean" ? (
            <button
              type="button"
              onClick={becomeO}
              className="h-10 rounded-xl border border-accent/40 bg-elevated px-4 text-sm font-semibold text-accent"
            >
              Become O
            </button>
          ) : (
            <button
              type="button"
              onClick={openPath}
              className="h-10 rounded-xl border border-border bg-elevated px-4 text-sm font-medium text-fg"
            >
              Open path
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="h-10 rounded-xl border border-border bg-elevated px-4 text-sm font-medium text-muted hover:text-fg"
          >
            Keep going
          </button>
        </div>
      </div>
    </div>
  );
}

function RankGlyph({ badge }: { badge: BadgeId }) {
  if (badge === "voidbean") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    );
  }
  if (badge === "orbital") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <ellipse
          cx="12"
          cy="12"
          rx="9"
          ry="4"
          stroke="currentColor"
          strokeWidth="1.5"
          transform="rotate(-20 12 12)"
        />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse
        cx="12"
        cy="13"
        rx="6.5"
        ry="8"
        transform="rotate(-18 12 13)"
        fill="currentColor"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}
