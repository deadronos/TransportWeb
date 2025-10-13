import { useEffect, useState, type FormEvent } from "react";
import { nanoid } from "nanoid";
import { useClock } from "@/game/state/slices/clock";
import { useDebug } from "@/game/state/slices/debug";
import { useWorld, type Entity } from "@/game/ecs/world";
import { useNetworkStore } from "@/game/state/slices/network";
import "./DebugPanel.css";

type VehicleType = NonNullable<Entity["Vehicle"]>["type"];

const VEHICLE_TYPES: { label: string; value: VehicleType }[] = [
  { label: "Train", value: "train" },
  { label: "Truck", value: "truck" },
];

export function DebugPanel() {
  const panelVisible = useDebug((state) => state.panelVisible);
  const closePanel = useDebug((state) => state.closePanel);
  const showStats = useDebug((state) => state.showStats);
  const setShowStats = useDebug((state) => state.setShowStats);
  const showEntityInspector = useDebug((state) => state.showEntityInspector);
  const setShowEntityInspector = useDebug(
    (state) => state.setShowEntityInspector,
  );
  const { speed, setSpeed, paused, togglePause } = useClock();
  const world = useWorld();

  const [vehicleType, setVehicleType] = useState<VehicleType>("train");
  const [spawnCount, setSpawnCount] = useState(1);
  const [maxSpeed, setMaxSpeed] = useState(3);
  const [acceleration, setAcceleration] = useState(0.5);
  const [entitySnapshot, setEntitySnapshot] = useState<Entity[]>([]);

  useEffect(() => {
    if (!panelVisible || !showEntityInspector) {
      return;
    }

    let mounted = true;
    let frameId = 0;

    const update = () => {
      if (!mounted) {
        return;
      }

      const snapshot = Array.from(world.entities);
      setEntitySnapshot((previous) => {
        if (
          previous.length === snapshot.length &&
          previous.every((entity, index) => entity === snapshot[index])
        ) {
          return previous;
        }

        return snapshot;
      });

      frameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      mounted = false;
      if (frameId) {
        if (typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(frameId);
        } else {
          clearTimeout(frameId);
        }
      }
      setEntitySnapshot([]);
    };
  }, [panelVisible, showEntityInspector, world]);

  if (!panelVisible) {
    return null;
  }

  const spawnVehicles = (event?: FormEvent) => {
    event?.preventDefault();
    const count = Math.max(1, Math.floor(spawnCount));
    const { graph } = useNetworkStore.getState();
    const nodes = graph.getAllNodes();

    for (let index = 0; index < count; index += 1) {
      const spawnNode =
        nodes.length > 0
          ? nodes[Math.floor(Math.random() * nodes.length)]
          : null;
      const position: [number, number, number] = spawnNode
        ? [
            spawnNode.position[0],
            spawnNode.position[1] + 0.5,
            spawnNode.position[2],
          ]
        : [(Math.random() - 0.5) * 40, 0.5, (Math.random() - 0.5) * 40];
      const currentNodeId = spawnNode ? spawnNode.id : null;

      world.add({
        id: nanoid(),
        Transform: { position },
        Renderable: { kind: "vehicle" },
        Vehicle: {
          speed: 0,
          accel: Math.max(0, acceleration),
          maxSpeed: Math.max(0.1, maxSpeed),
          capacity: vehicleType === "train" ? 80 : 40,
          type: vehicleType,
          assignment: { lineId: null, nextStopIndex: 0, direction: 1 },
          route: {
            state: "idle",
            currentNodeId,
            targetNodeId: null,
            path: null,
            currentEdgeIndex: 0,
            distanceAlongEdge: 0,
            dwellTimeRemaining: 0,
          },
        },
      });
    }
  };

  return (
    <aside className="debug-panel" role="dialog" aria-label="Debug controls">
      <header className="debug-panel__header">
        <h2>Debug Controls</h2>
        <button
          type="button"
          className="debug-panel__close"
          onClick={closePanel}
          aria-label="Close debug panel"
        >
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
            className={`debug-panel__toggle ${paused ? "debug-panel__toggle--active" : ""}`}
            onClick={togglePause}
          >
            {paused ? "Resume" : "Pause"}
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
              onChange={(event) =>
                setVehicleType(event.target.value as VehicleType)
              }
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

                const clamped = Math.min(
                  20,
                  Math.max(1, Math.floor(numericValue)),
                );
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
            Spawn {spawnCount}{" "}
            {vehicleType === "train" ? "train(s)" : "truck(s)"}
          </button>
        </form>
      </section>

      <section className="debug-panel__section">
        <h3>Entity Inspector</h3>
        <div className="debug-panel__field debug-panel__field--inline">
          <label htmlFor="debug-entity-inspector">Show Entity List</label>
          <button
            id="debug-entity-inspector"
            type="button"
            className={`debug-panel__toggle ${showEntityInspector ? "debug-panel__toggle--active" : ""}`}
            aria-pressed={showEntityInspector}
            onClick={() => setShowEntityInspector(!showEntityInspector)}
          >
            {showEntityInspector ? "Hide" : "Show"}
          </button>
        </div>

        {showEntityInspector && (
          <div
            className="debug-panel__entity-container"
            role="region"
            aria-live="polite"
          >
            {entitySnapshot.length === 0 ? (
              <div className="debug-panel__entity-empty">No entities</div>
            ) : (
              <ul className="debug-panel__entity-list" role="list">
                {entitySnapshot.map((entity) => {
                  const renderableKind = entity.Renderable?.kind ?? "—";
                  const position = entity.Transform?.position;
                  const components = Object.entries(entity)
                    .filter(([key, value]) => key !== "id" && value != null)
                    .map(([key]) => key)
                    .join(", ");
                  const positionLabel = position
                    ? position.map((value) => value.toFixed(1)).join(", ")
                    : "—";
                  const vehicle = entity.Vehicle;
                  const vehicleStatus = vehicle
                    ? `Speed ${vehicle.speed.toFixed(2)}/${vehicle.maxSpeed.toFixed(2)} | ${
                        vehicle.route?.state ?? "idle"
                      } → ${vehicle.route?.targetNodeId ?? "—"}`
                    : null;

                  return (
                    <li key={entity.id} className="debug-panel__entity-item">
                      <div className="debug-panel__entity-heading">
                        <span className="debug-panel__entity-id">
                          {entity.id}
                        </span>
                        <span className="debug-panel__entity-kind">
                          {renderableKind}
                        </span>
                      </div>
                      <div className="debug-panel__entity-meta">
                        <span>Components: {components || "—"}</span>
                        <span>Position: {positionLabel}</span>
                        {vehicleStatus && <span>{vehicleStatus}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </section>
    </aside>
  );
}
