import { formatDistance, formatRubs, SITE_NAME, X_HANDLE } from "./store";

export type ShareCardStats = {
  title: string;
  totalRubs: number;
  lifetimeDistance?: number;
  bestCombo: number;
  climaxes?: number;
  prizes: number;
  facesCollected?: number;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function renderShareCard(stats: ShareCardStats): Promise<Blob> {
  const w = 1200;
  const h = 630;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("no canvas"));

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#0c0a0b");
  bg.addColorStop(1, "#1c181a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const orb = ctx.createRadialGradient(900, 280, 20, 900, 280, 280);
  orb.addColorStop(0, "rgba(232,164,168,0.55)");
  orb.addColorStop(1, "rgba(232,164,168,0)");
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(900, 280, 280, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e8a4a8";
  ctx.font = "600 22px Satoshi, sans-serif";
  ctx.fillText("FLICKBEAN", 72, 88);

  ctx.fillStyle = "#f3ecee";
  ctx.font = "700 64px 'Clash Display', Satoshi, sans-serif";
  ctx.fillText(stats.title, 72, 168);

  ctx.fillStyle = "#a89a9e";
  ctx.font = "500 28px Satoshi, sans-serif";
  ctx.fillText("rub, don't tap", 72, 214);

  const lines = [
    `${formatRubs(stats.totalRubs)} lifetime rubs`,
    stats.lifetimeDistance != null
      ? `${formatDistance(stats.lifetimeDistance)} distance`
      : null,
    `${stats.bestCombo} best combo`,
    `${stats.prizes} frenzy prizes`,
    stats.facesCollected && stats.facesCollected > 0
      ? `${stats.facesCollected} O Count`
      : null,
    stats.climaxes != null ? `${stats.climaxes} climaxes` : null,
  ].filter((x): x is string => Boolean(x));

  ctx.font = "500 26px Satoshi, sans-serif";
  let y = 300;
  for (const line of lines.slice(0, 5)) {
    ctx.fillStyle = "#6e6367";
    ctx.fillText("·", 72, y);
    ctx.fillStyle = "#f3ecee";
    ctx.fillText(line, 96, y);
    y += 42;
  }

  ctx.fillStyle = "#e8a4a8";
  ctx.font = "500 22px Satoshi, sans-serif";
  ctx.fillText(SITE_NAME, 72, 578);
  ctx.fillStyle = "#6e6367";
  ctx.fillText(`@${X_HANDLE}`, 72, 608);

  roundRect(ctx, 0, 0, w, 8, 0);
  ctx.fillStyle = "#e8a4a8";
  ctx.fillRect(0, 0, w, 8);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("blob failed"));
    }, "image/png");
  });
}

export async function shareCardOrDownload(
  stats: ShareCardStats,
  intentUrl: string,
): Promise<void> {
  const blob = await renderShareCard(stats);
  const file = new File([blob], "flickbean-card.png", { type: "image/png" });

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (typeof nav.share === "function") {
    const data: ShareData = {
      files: [file],
      text: `Stop tapping. Start rubbing. https://${SITE_NAME}`,
    };
    if (!nav.canShare || nav.canShare(data)) {
      try {
        await nav.share(data);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "flickbean-card.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  window.open(intentUrl, "_blank", "noopener,noreferrer");
}
