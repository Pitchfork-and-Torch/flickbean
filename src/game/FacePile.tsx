import type { CSSProperties } from "react";
import { useGame } from "./store";

const FACE_SRC = "/img/frenzy-face.png";

/**
 * Collected frenzy faces heaped along the bottom of the screen.
 * Newest faces land on top with a drop animation.
 */
export function FacePile() {
  const faces = useGame((s) => s.faces);
  const facesCollected = useGame((s) => s.facesCollected);
  const started = useGame((s) => s.started);

  if (!started || faces.length === 0) return null;

  const newestId = faces[faces.length - 1]?.id;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[min(28vh,220px)] overflow-visible"
      aria-hidden
    >
      <div className="absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 h-6 w-[min(70vw,320px)] -translate-x-1/2 rounded-[100%] bg-bg/50 blur-md" />

      <div className="absolute bottom-[max(0.35rem,env(safe-area-inset-bottom))] left-1/2 h-full w-[min(92vw,520px)] -translate-x-1/2">
        {faces.map((f, i) => {
          const n = faces.length;
          const spread = Math.min(1, 0.55 + n * 0.012);
          const xPct = 50 + f.x * 22 * spread;
          const stack = n === 1 ? 1 : i / (n - 1);
          const yPx = 8 + stack * 28 + f.y * 10;
          const z = i + 1;
          const isNew = f.id === newestId;
          const size = Math.round(54 * f.scale + Math.min(18, n * 0.35));

          const style = {
            left: `${xPct}%`,
            bottom: `${yPx}px`,
            width: `${size}px`,
            height: "auto",
            zIndex: z,
            "--face-rot": `${f.rot}deg`,
          } as CSSProperties;

          return (
            <img
              key={f.id}
              src={FACE_SRC}
              alt=""
              draggable={false}
              className={`absolute select-none object-contain drop-shadow-[0_6px_14px_rgb(0_0_0_/_0.45)] ${
                isNew ? "face-pile-land" : "face-pile-rest"
              }`}
              style={style}
            />
          );
        })}
      </div>

      {facesCollected > 0 && (
        <div className="absolute bottom-[max(0.15rem,env(safe-area-inset-bottom))] right-3 rounded-full border border-border/80 bg-elevated/80 px-2 py-0.5 text-[10px] font-medium tabular tracking-wide text-muted backdrop-blur-sm">
          ×{facesCollected}
        </div>
      )}
    </div>
  );
}
