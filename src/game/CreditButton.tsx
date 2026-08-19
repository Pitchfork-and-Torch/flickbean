import { X_FOLLOW_URL, X_HANDLE } from "./store";

type Props = {
  className?: string;
  compact?: boolean;
};

/** Opens X follow intent for @SuddenlyJon */
export function CreditButton({ className = "", compact = false }: Props) {
  const openFollow = () => {
    window.open(X_FOLLOW_URL, "_blank", "noopener,noreferrer");
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={openFollow}
        className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated/90 px-3 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg ${className}`}
        aria-label={`Follow @${X_HANDLE} on X`}
      >
        <XMark />
        <span>
          made by <span className="text-fg">@{X_HANDLE}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openFollow}
      className={`pointer-events-auto flex h-11 w-full max-w-[280px] items-center justify-center gap-2 rounded-xl border border-border bg-elevated text-sm font-medium text-muted transition-colors hover:border-border-strong hover:text-fg active:scale-[0.99] ${className}`}
      aria-label={`Follow @${X_HANDLE} on X`}
    >
      <XMark />
      <span>
        made by <span className="text-fg">@{X_HANDLE}</span>
      </span>
      <span className="text-subtle">· follow</span>
    </button>
  );
}

function XMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}
