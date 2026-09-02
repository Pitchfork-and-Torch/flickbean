import { useEffect, useState } from "react";
import { useGame } from "./store";

/** ~280ms center flash  -  long enough to register */
const FACE_MS = 280;

/**
 * Brief center face flash on each frenzy prize.
 * Collection pile is handled by FacePile.
 */
export function FrenzyFace() {
  const key = useGame((s) => s.frenzyFaceKey);
  const [visible, setVisible] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (key <= 0) return;
    setAnimKey(key);
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), FACE_MS);
    return () => window.clearTimeout(t);
  }, [key]);

  if (!visible || animKey <= 0) return null;

  return (
    <div
      key={animKey}
      className="pointer-events-none absolute inset-0 z-[25] flex items-center justify-center frenzy-face-pop"
      aria-hidden
    >
      <img
        src="/img/frenzy-face.png"
        alt=""
        draggable={false}
        className="h-[min(52vh,340px)] w-auto max-w-[88vw] select-none object-contain drop-shadow-[0_12px_40px_rgb(0_0_0_/_0.55)]"
      />
    </div>
  );
}
