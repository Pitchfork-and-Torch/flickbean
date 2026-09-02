import { formatRubs, type ShopTab, useGame } from "./store";
import {
  maxAffordableLevels,
  superBoostMult,
  totalUpgradeLevels,
  UPGRADES,
  upgradeCost,
  upgradeCostBulk,
} from "./upgrades";
import {
  ASCEND_SKILLS,
  type AscendId,
  BADGE_META,
  CHALLENGES,
  challengeProgress,
  maxAffordableSkill,
  MYTHIC_SKILLS,
  type MythicId,
  pathBoostMult,
  rankDisplayName,
  skillCost,
  skillCostBulk,
} from "./progression";
import type { UpgradeId } from "./types";
import { incomeLabel } from "./format";

export function ShopPanel() {
  const open = useGame((s) => s.shopOpen);
  const setShopOpen = useGame((s) => s.setShopOpen);
  const tab = useGame((s) => s.shopTab);
  const setShopTab = useGame((s) => s.setShopTab);
  const rubs = useGame((s) => s.rubs);
  const upgrades = useGame((s) => s.upgrades);
  const ascend = useGame((s) => s.ascend);
  const mythic = useGame((s) => s.mythic);
  const prizes = useGame((s) => s.prizes);
  const facesCollected = useGame((s) => s.facesCollected);
  const beanMaster = useGame((s) => s.beanMaster);
  const orbital = useGame((s) => s.orbital);
  const voidbean = useGame((s) => s.voidbean);
  const titleAsO = useGame((s) => s.titleAsO);
  const challenges = useGame((s) => s.challenges);
  const bestCombo = useGame((s) => s.bestCombo);
  const climaxes = useGame((s) => s.climaxes);
  const lifetimeDistance = useGame((s) => s.lifetimeDistance);
  const buyUpgrade = useGame((s) => s.buyUpgrade);
  const buyAscend = useGame((s) => s.buyAscend);
  const buyMythic = useGame((s) => s.buyMythic);
  const toggleTitleAsO = useGame((s) => s.toggleTitleAsO);

  if (!open) return null;

  const boost =
    superBoostMult(upgrades, prizes, facesCollected) *
    pathBoostMult(ascend, mythic, orbital, voidbean);
  const levels = totalUpgradeLevels(upgrades);
  const rankName = rankDisplayName(voidbean, orbital, beanMaster, titleAsO);

  const tabs: {
    id: ShopTab;
    label: string;
    locked?: boolean;
    lockHint?: string;
  }[] = [
    { id: "core", label: "Core" },
    { id: "ascend", label: "Ascend", locked: !beanMaster, lockHint: "BEANMASTER" },
    { id: "mythic", label: "Mythic", locked: !orbital, lockHint: "ORBITAL" },
    { id: "path", label: "Path", locked: !beanMaster, lockHint: "BEANMASTER" },
  ];

  const ctx = {
    beanMaster,
    orbital,
    voidbean,
    facesCollected,
    bestCombo,
    prizes,
    climaxes,
    lifetimeDistance,
    ascend,
    mythic,
    upgrades,
  };

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Progression"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg/70"
        aria-label="Close"
        onClick={() => setShopOpen(false)}
      />
      <div className="relative z-10 flex max-h-[min(92dvh,780px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-soft sm:rounded-2xl">
        {/* Header */}
        <div className="border-b border-border px-5 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
                Progression
              </p>
              <p className="mt-1 font-display text-xl font-semibold tracking-tight text-fg">
                {rankName ?? "Apprentice"}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                <span className="tabular text-accent">{formatRubs(rubs)}</span>
                {" · "}
                <span className="tabular">{incomeLabel(boost)}</span> boost
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShopOpen(false)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated text-muted hover:text-fg"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Rank ladder */}
          <div className="mt-4">
            <RankLadder
              beanMaster={beanMaster}
              orbital={orbital}
              voidbean={voidbean}
              titleAsO={titleAsO}
              onBeanGodClick={voidbean ? toggleTitleAsO : undefined}
            />
          </div>
        </div>

        {/* Segmented tabs */}
        <div className="border-b border-border px-3 py-2.5">
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-elevated p-1">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!!t.locked}
                  onClick={() => {
                    if (!t.locked) setShopTab(t.id);
                  }}
                  className={`min-h-10 rounded-lg text-xs font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                    active
                      ? "bg-fg text-bg shadow-sm"
                      : "text-muted hover:text-fg"
                  }`}
                  title={t.locked ? `Requires ${t.lockHint}` : t.label}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "core" && (
          <div className="border-b border-border px-5 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Core levels</span>
              <span className="tabular text-fg">{levels}/205</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent/80 transition-[width] duration-200"
                style={{ width: `${Math.min(100, (levels / 205) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {tab === "core" &&
            UPGRADES.map((def) => {
              const id = def.id as UpgradeId;
              const level = upgrades[id];
              const maxed = level >= def.maxLevel;
              const cost1 = upgradeCost(def, level);
              const afford = maxed ? 0 : maxAffordableLevels(def, level, rubs, 99);
              const buyN = Math.min(5, afford);
              return (
                <SkillCard
                  key={def.id}
                  name={def.name}
                  blurb={def.blurb}
                  level={level}
                  maxLevel={def.maxLevel}
                  maxed={maxed}
                  cost1={cost1}
                  buyN={buyN}
                  costN={buyN > 0 ? upgradeCostBulk(def, level, buyN) : 0}
                  afford={afford}
                  costMax={afford > 0 ? upgradeCostBulk(def, level, afford) : 0}
                  rubs={rubs}
                  onBuy1={() => buyUpgrade(id, 1)}
                  onBuyN={() => buyUpgrade(id, buyN)}
                  onBuyMax={() => buyUpgrade(id, afford)}
                />
              );
            })}

          {tab === "ascend" && (
            <>
              <TierIntro
                tier="II"
                title="Ascension"
                body="Unique powers after BEANMASTER. Clear Path challenges to rank ORBITAL."
              />
              {ASCEND_SKILLS.map((def) => skillFrom(def, ascend, rubs, buyAscend))}
            </>
          )}

          {tab === "mythic" && (
            <>
              <TierIntro
                tier="III"
                title="Mythic"
                body="Apex skills after ORBITAL. Beat every Mythic challenge to become BEAN GOD."
              />
              {MYTHIC_SKILLS.map((def) => skillFrom(def, mythic, rubs, buyMythic))}
            </>
          )}

          {tab === "path" && (
            <>
              <TierIntro
                tier="★"
                title="The Path"
                body="Challenges complete as you play. Finish both tiers for BEAN GOD  -  then tap your title to become O."
              />
              <PathSection
                title="Ascension"
                rankTarget="ORBITAL"
                unlocked={beanMaster}
                complete={orbital}
                challenges={CHALLENGES.filter((c) => c.tier === 2)}
                doneMap={challenges}
                ctx={ctx}
              />
              <PathSection
                title="Mythic"
                rankTarget="BEAN GOD"
                unlocked={orbital}
                complete={voidbean}
                challenges={CHALLENGES.filter((c) => c.tier === 3)}
                doneMap={challenges}
                ctx={ctx}
              />
              {voidbean && (
                <button
                  type="button"
                  onClick={toggleTitleAsO}
                  className="flex w-full items-center justify-between rounded-xl border border-accent/40 bg-elevated px-4 py-3.5 text-left active:scale-[0.99]"
                >
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                      Title
                    </p>
                    <p className="mt-0.5 font-display text-lg font-semibold text-fg">
                      {titleAsO ? "O" : "BEAN GOD"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Tap to {titleAsO ? "restore BEAN GOD" : "become O"}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-accent">
                    {titleAsO ? "BEAN GOD" : "→ O"}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function skillFrom(
  def: (typeof ASCEND_SKILLS)[0] | (typeof MYTHIC_SKILLS)[0],
  levels: Record<string, number>,
  rubs: number,
  buy: (id: never, n?: number) => boolean,
) {
  const id = def.id;
  const level = levels[id] ?? 0;
  const maxed = level >= def.maxLevel;
  const cost1 = skillCost(def, level);
  const afford = maxed ? 0 : maxAffordableSkill(def, level, rubs, 99);
  const buyN = Math.min(5, afford);
  return (
    <SkillCard
      key={def.id}
      name={def.name}
      blurb={def.blurb}
      level={level}
      maxLevel={def.maxLevel}
      maxed={maxed}
      cost1={cost1}
      buyN={buyN}
      costN={buyN > 0 ? skillCostBulk(def, level, buyN) : 0}
      afford={afford}
      costMax={afford > 0 ? skillCostBulk(def, level, afford) : 0}
      rubs={rubs}
      onBuy1={() => buy(id as never, 1)}
      onBuyN={() => buy(id as never, buyN)}
      onBuyMax={() => buy(id as never, afford)}
    />
  );
}

function RankLadder({
  beanMaster,
  orbital,
  voidbean,
  titleAsO,
  onBeanGodClick,
}: {
  beanMaster: boolean;
  orbital: boolean;
  voidbean: boolean;
  titleAsO: boolean;
  onBeanGodClick?: () => void;
}) {
  const steps = [
    {
      id: "beanMaster" as const,
      active: beanMaster,
      label: BADGE_META.beanMaster.name,
    },
    {
      id: "orbital" as const,
      active: orbital,
      label: BADGE_META.orbital.name,
    },
    {
      id: "voidbean" as const,
      active: voidbean,
      label: titleAsO ? "O" : BADGE_META.voidbean.name,
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.id} className="flex min-w-0 flex-1 items-center gap-1">
          <button
            type="button"
            disabled={!(s.id === "voidbean" && voidbean && onBeanGodClick)}
            onClick={() => {
              if (s.id === "voidbean" && onBeanGodClick) onBeanGodClick();
            }}
            className={`min-w-0 flex-1 rounded-lg border px-1.5 py-2 text-center transition-colors ${
              s.active
                ? "border-accent/45 bg-elevated"
                : "border-border/70 bg-bg/40"
            } ${
              s.id === "voidbean" && voidbean
                ? "cursor-pointer enabled:active:scale-[0.98]"
                : "cursor-default"
            }`}
            aria-label={
              s.id === "voidbean" && voidbean
                ? `Title ${s.label}. Tap to toggle O`
                : s.label
            }
          >
            <p
              className={`text-[9px] font-medium uppercase tracking-[0.12em] ${
                s.active ? "text-accent" : "text-subtle"
              }`}
            >
              {BADGE_META[s.id].short}
            </p>
            <p
              className={`mt-0.5 truncate text-[10px] font-semibold ${
                s.active ? "text-fg" : "text-subtle"
              }`}
            >
              {s.label}
            </p>
          </button>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-2 shrink-0 ${
                steps[i + 1]!.active ? "bg-accent/60" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function TierIntro({
  tier,
  title,
  body,
}: {
  tier: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-elevated/55 px-3.5 py-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 min-w-6 items-center justify-center rounded-md border border-accent/30 bg-surface px-1.5 text-[10px] font-semibold tabular text-accent">
          {tier}
        </span>
        <p className="text-sm font-semibold text-fg">{title}</p>
      </div>
      <p className="mt-1.5 text-sm leading-snug text-muted">{body}</p>
    </div>
  );
}

function PathSection({
  title,
  rankTarget,
  unlocked,
  complete,
  challenges,
  doneMap,
  ctx,
}: {
  title: string;
  rankTarget: string;
  unlocked: boolean;
  complete: boolean;
  challenges: typeof CHALLENGES;
  doneMap: Record<string, boolean>;
  ctx: Parameters<typeof challengeProgress>[1];
}) {
  const doneCount = challenges.filter((c) => doneMap[c.id]).length;
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2 px-0.5 pt-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
            {title}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {complete ? `${rankTarget} earned` : `Complete for ${rankTarget}`}
          </p>
        </div>
        <span
          className={`text-xs font-semibold tabular ${
            complete ? "text-accent" : unlocked ? "text-fg" : "text-subtle"
          }`}
        >
          {unlocked ? `${doneCount}/${challenges.length}` : "Locked"}
        </span>
      </div>
      {!unlocked && (
        <p className="rounded-lg border border-border/60 bg-elevated/30 px-3 py-2 text-xs text-muted">
          Rank up first to unlock this tier.
        </p>
      )}
      {challenges.map((c) => {
        const prog = challengeProgress(c.id, ctx);
        const done = Boolean(doneMap[c.id]) || prog.done;
        const pct = Math.min(100, (prog.current / Math.max(1, prog.target)) * 100);
        return (
          <div
            key={c.id}
            className={`rounded-xl border px-3.5 py-3 ${
              done
                ? "border-accent/30 bg-elevated"
                : unlocked
                  ? "border-border bg-elevated/65"
                  : "border-border/50 bg-elevated/25 opacity-45"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-fg">{c.name}</p>
                <p className="mt-0.5 text-sm text-muted">{c.blurb}</p>
              </div>
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular ${
                  done
                    ? "bg-accent/15 text-accent"
                    : "bg-border/50 text-muted"
                }`}
              >
                {done
                  ? "DONE"
                  : `${formatShort(prog.current)}/${formatShort(prog.target)}`}
              </span>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-border">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ${
                  done ? "bg-accent" : "bg-fg/45"
                }`}
                style={{ width: `${done ? 100 : pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-subtle">{c.targetLabel}</p>
          </div>
        );
      })}
    </div>
  );
}

function formatShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return Math.floor(n).toString();
}

function SkillCard({
  name,
  blurb,
  level,
  maxLevel,
  maxed,
  cost1,
  buyN,
  costN,
  afford,
  costMax,
  rubs,
  onBuy1,
  onBuyN,
  onBuyMax,
}: {
  name: string;
  blurb: string;
  level: number;
  maxLevel: number;
  maxed: boolean;
  cost1: number;
  buyN: number;
  costN: number;
  afford: number;
  costMax: number;
  rubs: number;
  onBuy1: () => void;
  onBuyN: () => void;
  onBuyMax: () => void;
}) {
  const can1 = !maxed && rubs >= cost1;
  return (
    <div className="rounded-xl border border-border bg-elevated/80 p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-fg">{name}</span>
        <span className="shrink-0 text-xs tabular text-subtle">
          {maxed ? "MAX" : `Lv ${level}/${maxLevel}`}
        </span>
      </div>
      <p className="mt-1 text-sm leading-snug text-muted">{blurb}</p>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent/70"
          style={{ width: `${(level / maxLevel) * 100}%` }}
        />
      </div>
      {!maxed && (
        <div className="mt-3 flex flex-wrap gap-2">
          <BuyBtn
            label={`+1 · ${formatRubs(cost1)}`}
            disabled={!can1}
            onClick={onBuy1}
            primary
          />
          {buyN >= 2 && (
            <BuyBtn
              label={`+${buyN} · ${formatRubs(costN)}`}
              disabled={buyN < 2}
              onClick={onBuyN}
            />
          )}
          {afford >= 3 && (
            <BuyBtn
              label={`Max ${afford}`}
              disabled={afford < 1}
              onClick={onBuyMax}
            />
          )}
        </div>
      )}
      {maxed && (
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-subtle">
          Maxed
        </p>
      )}
    </div>
  );
}

function BuyBtn({
  label,
  disabled,
  onClick,
  primary,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-10 rounded-lg border px-3 text-xs font-semibold tabular transition-colors enabled:active:scale-[0.98] disabled:opacity-40 ${
        primary
          ? "border-accent/35 bg-accent text-accent-fg"
          : "border-border bg-surface text-fg enabled:hover:border-border-strong"
      }`}
    >
      {label}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
