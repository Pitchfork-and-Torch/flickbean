import { useEffect } from "react";
import { AgeGatedApp } from "./AgeGate";
import { BadgeToast } from "./BadgeToast";
import { FacePile } from "./FacePile";
import { FrenzyFace } from "./FrenzyFace";
import { HUD } from "./HUD";
import { RubCanvas } from "./RubCanvas";
import { ShopPanel } from "./ShopPanel";
import { StartScreen } from "./StartScreen";
import { StatsPanel } from "./StatsPanel";
import { useGame } from "./store";

export function GameApp() {
  return (
    <AgeGatedApp>
      <GameShell />
    </AgeGatedApp>
  );
}

function GameShell() {
  const hydrate = useGame((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      <RubCanvas />
      <FacePile />
      <FrenzyFace />
      <HUD />
      <ShopPanel />
      <StatsPanel />
      <BadgeToast />
      <StartScreen />
    </div>
  );
}
