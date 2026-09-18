import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "../game/GameApp";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <GameApp />;
}
