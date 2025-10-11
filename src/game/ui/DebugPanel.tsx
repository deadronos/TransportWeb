import { FormEvent, useState } from 'react';
import { nanoid } from 'nanoid';
import { useClock } from '@/game/state/slices/clock';
import { useDebug } from '@/game/state/slices/debug';
import { useWorld, type Entity } from '@/game/ecs/world';
import './DebugPanel.css';

type VehicleType = NonNullable<Entity['Vehicle']>['type'];

const VEHICLE_TYPES: { label: string; value: VehicleType }[] = [
  { label: 'Train', value: 'train' },
  { label: 'Truck', value: 'truck' },
];

export function DebugPanel() {
  const panelVisible = useDebug((state) => state.panelVisible);
  const closePanel = useDebug((state) => state.closePanel);
  const showStats = useDebug((state) => state.showStats);
  const setShowStats = useDebug((state) => state.setShowStats);
  const { speed, setSpeed, paused, togglePause } = useClock();
  const world = useWorld();

  const [vehicleType, setVehicleType] = useState<VehicleType>('train');
  const [spawnCount, setSpawnCount] = useState(1);
  const [maxSpeed, setMaxSpeed] = useState(3);
  const [acceleration, setAcceleration] = useState(0.5);

  if (!panelVisible) {
    return null;
  }

  const spawnVehicles = (event?: FormEvent) => {
    event?.preventDefault();
    const count = Math.max(1, Math.floor(spawnCount));

    for (let index = 0; index < count; index += 1) {
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetZ = (Math.random() - 0.5) * 40;

      world.add({
        id: nanoid(),
        Transform: { position: [offsetX, 0.5, offsetZ] },
        Renderable: { kind: 'vehicle' },
        Vehicle: {
          speed: 0,
          accel: Math.max(0, acceleration),
          maxSpeed: Math.max(0.1, maxSpeed),
          type: vehicleType,
        },
      });
    }
  };

  return (
    <aside className="debug-panel" role="dialog" aria-label="Debug controls">
      <header className="debug-panel__header">
        <h2>Debug Controls</h2>
        <button type="button" className="debug-panel__close" onClick={closePanel} aria-label="Close debug panel">
          ×
        </button>
      </header>

      <section className="debug-panel__section">
        <h3>Simulation</h3>
        <div className="debug-panel__field">
          <label htmlFor="debug-pause">Pause Simulation</label>
          <button
            id="debug-pause"
            type="button"
            className={`debug-panel__toggle ${paused ? 'debug-panel__toggle--active' : ''}`}
            onClick={togglePause}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>

        <div className="debug-panel__field">
          <label htmlFor="debug-speed">Game Speed</label>
          <div className="debug-panel__range">
            <input
              id="debug-speed"
              type="range"
              min={0.25}
              max={8}
              step={0.25}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
            <input
              type="number"
              min={0.25}
              max={8}
              step={0.25}
              value={speed}
              onChange={(event) => {
                const numericValue = Number(event.target.value);
                if (Number.isNaN(numericValue)) {
                  return;
                }

                const clamped = Math.min(8, Math.max(0.25, numericValue));
                setSpeed(clamped);
              }}
            />
            <span>×</span>
          </div>
        </div>

        <div className="debug-panel__field debug-panel__field--inline">
          <label htmlFor="debug-stats">Show Renderer Stats</label>
          <input
            id="debug-stats"
            type="checkbox"
            checked={showStats}
            onChange={(event) => setShowStats(event.target.checked)}
          />
        </div>
      </section>

      <section className="debug-panel__section">
        <h3>Vehicle Spawner</h3>
        <form className="debug-panel__form" onSubmit={spawnVehicles}>
          <div className="debug-panel__field">
            <label htmlFor="debug-vehicle-type">Vehicle Type</label>
            <select
              id="debug-vehicle-type"
              value={vehicleType}
              onChange={(event) => setVehicleType(event.target.value as VehicleType)}
            >
              {VEHICLE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="debug-panel__field">
            <label htmlFor="debug-spawn-count">Spawn Count</label>
            <input
              id="debug-spawn-count"
              type="number"
              min={1}
              max={20}
              value={spawnCount}
              onChange={(event) => {
                const numericValue = Number(event.target.value);
                if (Number.isNaN(numericValue)) {
                  return;
                }

                const clamped = Math.min(20, Math.max(1, Math.floor(numericValue)));
                setSpawnCount(clamped);
              }}
            />
          </div>

          <div className="debug-panel__field">
            <label htmlFor="debug-max-speed">Max Speed</label>
            <input
              id="debug-max-speed"
              type="number"
              min={0.1}
              max={20}
              step={0.1}
              value={maxSpeed}
              onChange={(event) => {
                const numericValue = Number(event.target.value);
                if (Number.isNaN(numericValue)) {
                  return;
                }

                const clamped = Math.min(20, Math.max(0.1, numericValue));
                setMaxSpeed(clamped);
              }}
            />
            <span className="debug-panel__suffix">units/s</span>
          </div>

          <div className="debug-panel__field">
            <label htmlFor="debug-acceleration">Acceleration</label>
            <input
              id="debug-acceleration"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={acceleration}
              onChange={(event) => {
                const numericValue = Number(event.target.value);
                if (Number.isNaN(numericValue)) {
                  return;
                }

                const clamped = Math.min(5, Math.max(0, numericValue));
                setAcceleration(clamped);
              }}
            />
            <span className="debug-panel__suffix">units/s²</span>
          </div>

          <button type="submit" className="debug-panel__primary">
            Spawn {spawnCount} {vehicleType === 'train' ? 'train(s)' : 'truck(s)'}
          </button>
        </form>
      </section>
    </aside>
  );
}
