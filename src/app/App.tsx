import { GameCanvas } from "@/game/GameCanvas";
import { WorldProvider } from "@/game/ecs/world";
import { HUD } from "@/game/ui/HUD";

export function App() {
  return (
    <WorldProvider>
      <div style={{ width: "100vw", height: "100vh" }}>
        <GameCanvas />
        <HUD />
      </div>
    </WorldProvider>
  );
}
