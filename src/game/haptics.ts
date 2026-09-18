import { isMuted } from "./audio";
import { prefersReducedMotion } from "./motion";

export function hapticPulse(kind: "prize" | "climax"): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  if (isMuted()) return;
  if (prefersReducedMotion()) return;
  try {
    navigator.vibrate(kind === "prize" ? 18 : 12);
  } catch {
    /* ignore */
  }
}
