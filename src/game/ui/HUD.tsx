import { useClock } from '../state/slices/clock';

export function HUD() {
  const { speed, paused, setSpeed, togglePause } = useClock();

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '1rem',
        display: 'flex',
        gap: '0.5rem',
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto', display: 'flex', gap: '0.5rem' }}>
        <button onClick={togglePause}>{paused ? '▶ Play' : '⏸ Pause'}</button>
        <button onClick={() => setSpeed(1)} disabled={speed === 1}>
          ×1
        </button>
        <button onClick={() => setSpeed(2)} disabled={speed === 2}>
          ×2
        </button>
        <button onClick={() => setSpeed(4)} disabled={speed === 4}>
          ×4
        </button>
        <span
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '0.25rem',
          }}
        >
          Speed: ×{speed} {paused && '(Paused)'}
        </span>
      </div>
    </div>
  );
}
