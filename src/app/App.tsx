import { GameCanvas } from '@/game/GameCanvas';
import { HUD } from '@/game/ui/HUD';

export function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GameCanvas />
      <HUD />
    </div>
  );
}
