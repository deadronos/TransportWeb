# 🎛️ Goals

Build a performant, deterministic, and moddable Transport‑Tycoon‑like that runs in the browser using:

- **React (latest)** + **Vite** + **TypeScript**
- **react-three-fiber (R3F)** + **drei** for 3D rendering/UI overlays
- **Zustand** for UI/app state (serializable slices)
- **Miniplex** (ECS) for simulation entities & systems
- **Vitest** + **Playwright** for tests
- Optional: **Leva** for debug controls, **Zustand middleware** for time travel & persistence

The scaffold below is production‑minded (code splits, instancing, fixed timestep, deterministic RNG, save/load), but minimal enough to iterate fast.

---

## 1) Setup Commands (npm)

Use **npm** (Node 18+ recommended):

```bash
# Create the project
npm create vite@latest tycoon-web -- --template react-ts
cd tycoon-web

# App/runtime deps
npm install three @react-three/fiber @react-three/drei zustand miniplex nanoid seedrandom

# Build tooling & helpers (dev deps)
npm install -D @types/three vite-tsconfig-paths vite-plugin-compression vite-plugin-svgr

# Testing (unit + coverage)
npm install -D vitest jsdom @vitest/coverage-v8 @testing-library/react @testing-library/user-event

# Linting & formatting
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier prettier

# E2E testing
npm install -D playwright @playwright/test
```

> If you want the absolute latest React/Three stack, add `@latest` to the packages above where appropriate.

---

## 2) Project Structure

```
src/
  app/
    main.tsx
    App.tsx
    routes.tsx
  game/
    GameCanvas.tsx
    SceneGraph.tsx
    constants.ts
    shaders/
      grid.glsl
    terrain/
      heightmap.ts
    input/
      InputLayer.tsx
      usePointer.ts
    ecs/
      world.ts
      components.ts
      systems/
        index.ts
        time.ts
        buildTool.ts
        network.ts         # graph maintenance (tracks/roads)
        pathfinding.ts     # A* + reservations
        signaling.ts
        vehicleMotion.ts
        cargoFlow.ts
        industry.ts
        economy.ts
        despawn.ts
      factories/
        spawnVehicle.ts
        placeTrack.ts
        placeRoad.ts
        placeStation.ts
    state/
      store.ts            # Zustand root with slices
      slices/
        ui.ts
        build.ts
        clock.ts
        selection.ts
        settings.ts
        economy.ts
    ui/
      HUD.tsx
      BuildPalette.tsx
      MoneyBar.tsx
      MiniMap.tsx
      DebugPanel.tsx
  assets/
    fonts/
    textures/
    models/

tests/
  pathfinding.spec.ts
  economy.spec.ts

vite.config.ts
tsconfig.json
.eslintrc.cjs
.prettierrc
```

---

## 3) Core Architecture

### 3.1 Fixed Timestep Loop (Deterministic)

- **Render** at display FPS.
- **Simulate** at fixed dt (e.g., 16ms). Accumulator pattern to avoid spiral of death.
- Seeded RNG (seedrandom) so savegames replay identically.

### 3.2 Separation of Concerns

- **ECS (Miniplex)**: all simulation data lives in components; systems tick via `time.ts`.
- **Zustand**: UI, meta state, build tool mode, user settings, selection—**never** the simulation truth.
- **R3F**: purely views/instancing. Reads from ECS queries.

### 3.3 Save/Load

- Serialize ECS: component tables → JSON (ids + component payloads).
- Serialize Zustand slices (exclude ephemeral with `partialize`).
- Versioned snapshots (migrations on load).

---

## 4) Key Simulation Concepts (ECS)

**Components** (suggested minimal set):

- `Transform { position: vec3, rotation: quat, scale: vec3 }`
- `Renderable { kind: 'track'|'road'|'station'|'vehicle'|'tree' }`
- `NetworkNode { id, links: string[] }`
- `TrackSegment { nodeA, nodeB, length, grade, curve }`
- `RoadSegment { nodeA, nodeB, lanes }`
- `Signal { blockId, state: 'red'|'yellow'|'green' }`
- `Station { id, kind: 'rail'|'truck', capacity }`
- `Vehicle { type: 'train'|'truck'; speed, accel, maxSpeed }`
- `Route { waypoints: string[]; currentIndex }`
- `Path { nodes: string[]; reservedBlocks: string[] }`
- `Cargo { type: 'coal'|'grain'|...; amount }`
- `Industry { kind: 'mine'|'farm'|'factory'; productionRate; storage }`
- `OwnedBy { companyId }`
- `Money { balance }`
- `Lifetime { ttl }` (for temporary fx)

**Systems** (order matters):

1. `time` – accumulator, fixed‑dt tick broadcast
2. `network` – recompute/maintain graph when building/demolishing
3. `pathfinding` – A\* using `NetworkNode` graph; precompute block reservations
4. `signaling` – block reservation & release; deadlock prevention primitives
5. `vehicleMotion` – integrate speed/pos; obey signals & curves/grades
6. `cargoFlow` – load/unload at stations, propagate along vehicles
7. `industry` – produce/consume cargo, interact with economy prices
8. `economy` – income/expenses, interest, maintenance
9. `despawn` – clean up

---

## 5) Zustand Slices (App/UI)

- `clock`: play/pause/speed, simTime
- `ui`: modals, tooltips, overlays
- `build`: current tool (track/road/station), preview, snap settings
- `selection`: hovered/selected entity ids
- `settings`: graphics, audio, controls
- `economy`: difficulty, loans, company name/colors

Each slice should be serializable; persist selectively.

---

## 6) R3F Scene Graph

- `Canvas` with `frameloop="demand"` for UI‑driven rerenders, or `always` for simplicity first.
- Lighting: single directional + ambient to start.
- Controls: `drei` MapControls/OrbitControls with constrained tilt.
- **Instancing**: use `Merged` or `Instances` (from drei) for tracks/roads/trees.
- A simple **grid shader** for building mode.

---

## 7) Minimal Working Code (Essentials)

### 7.1 `src/app/main.tsx`

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./main.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### 7.2 `src/app/App.tsx`

```tsx
import React from "react";
import { GameCanvas } from "@/game/GameCanvas";
import { HUD } from "@/game/ui/HUD";

export function App() {
  return (
    <div className="h-screen w-screen">
      <GameCanvas />
      <HUD />
    </div>
  );
}
```

### 7.3 `src/game/GameCanvas.tsx`

```tsx
import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, StatsGl } from "@react-three/drei";
import { WorldProvider, useWorld } from "./ecs/world";
import { useTimeSystem } from "./ecs/systems/time";
import { SceneGraph } from "./SceneGraph";

function Simulation() {
  const world = useWorld();
  useTimeSystem(world);
  useEffect(() => {
    // bootstrap demo entities here or via factories
  }, [world]);
  return <SceneGraph />;
}

export const GameCanvas: React.FC = () => (
  <WorldProvider>
    <Canvas shadows camera={{ position: [12, 12, 12], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.1} castShadow />
      <Simulation />
      <OrbitControls makeDefault enablePan enableZoom enableRotate />
      <StatsGl />
    </Canvas>
  </WorldProvider>
);
```

### 7.4 `src/game/ecs/world.ts`

```tsx
import React, { createContext, useContext, useMemo } from "react";
import { World } from "miniplex";

export type Entity = {
  id: string;
  Transform?: {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  };
  Renderable?: { kind: "track" | "road" | "station" | "vehicle" | "tree" };
  Vehicle?: { speed: number; accel: number; maxSpeed: number };
};

const Ctx = createContext<World<Entity> | null>(null);
export const useWorld = () => {
  const w = useContext(Ctx);
  if (!w) throw new Error("World missing");
  return w;
};

export const WorldProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const world = useMemo(() => new World<Entity>(), []);
  return <Ctx.Provider value={world}>{children}</Ctx.Provider>;
};
```

### 7.5 `src/game/ecs/systems/time.ts`

```tsx
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { World } from "miniplex";

const FIXED_DT = 1 / 60;

export function useTimeSystem(world: World<any>) {
  const acc = useRef(0);
  const last = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    const prev = last.current ?? now;
    let dt = now - prev;
    last.current = now;

    acc.current += dt;
    while (acc.current >= FIXED_DT) {
      tick(world, FIXED_DT);
      acc.current -= FIXED_DT;
    }
  });
}

function tick(world: World<any>, dt: number) {
  // Example: naive vehicle integrator
  for (const e of world.with("Vehicle", "Transform")) {
    const v = e.Vehicle;
    const t = e.Transform;
    v.speed = Math.min(v.maxSpeed, v.speed + v.accel * dt);
    t.position[0] += v.speed * dt; // placeholder forward axis
  }
}
```

### 7.6 `src/game/ui/HUD.tsx`

```tsx
import React from "react";
import { useClock } from "@/game/state/slices/clock";
import { BuildPalette } from "./BuildPalette";

export const HUD: React.FC = () => {
  const { speed, paused, setSpeed, togglePause } = useClock();
  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <div className="pointer-events-auto flex gap-2 p-2">
        <button onClick={togglePause}>⏯ {paused ? "Play" : "Pause"}</button>
        <button onClick={() => setSpeed(1)}>x1</button>
        <button onClick={() => setSpeed(2)}>x2</button>
        <button onClick={() => setSpeed(4)}>x4</button>
      </div>
      <BuildPalette />
    </div>
  );
};
```

### 7.7 `src/game/state/store.ts` (+ `slices/clock.ts` example)

```tsx
import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

export type ClockState = {
  speed: number;
  paused: boolean;
  setSpeed: (s: number) => void;
  togglePause: () => void;
};

export const useClock = create<ClockState>()(
  devtools(
    persist(
      (set, get) => ({
        speed: 1,
        paused: false,
        setSpeed: (s) => set({ speed: s }),
        togglePause: () => set({ paused: !get().paused }),
      }),
      {
        name: "clock",
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ speed: s.speed }),
      },
    ),
  ),
);
```

---

## 8) Systems Design Notes

### 8.1 Network & Pathfinding

- Maintain a _bidirectional weighted graph_ of `NetworkNode`s.
- For rails, pre‑segment into **blocks** with signals. A\* path cost includes curvature & grade.
- Reservation system: vehicles reserve upcoming blocks; release when leaving.

### 8.2 Vehicle Motion

- Kinematics with curve/grade speed limits.
- Station dwell times; priority queues for platforms.

### 8.3 Cargo & Industry

- Industry produces/consumes cargo per tick (Poisson noise optional but seedable).
- Stations buffer cargo; vehicles load/unload until capacity/dwell limit.
- Economy values: distance × cargo class × difficulty modifiers.

---

## 9) Rendering & Performance

- Aggressive **instancing** for tracks/roads/trees/props.
- Frustum culling via R3F + spatial hashing of ECS entities.
- LOD meshes and merged geometries for far tiles.
- Texture atlases, baked AO where helpful.

---

## 10) Testing

- **Vitest** unit tests: pathfinding edge cases, economy math, serializer round‑trip.
- **Playwright**: build a small E2E: place track → spawn train → reaches station.

---

## 11) Roadmap (Phases)

1. **Core Loop**: fixed timestep, camera, grid, place straight tracks, spawn a train that moves.
2. **Graph & Pathfinding**: curves/switches, basic A\* + reservations.
3. **Stations & Cargo**: load/unload loops, income, expenses, bankruptcy.
4. **Signals**: block system to prevent collisions + simple deadlock avoidance.
5. **Road Vehicles**: trucks, depots, industries on map.
6. **UX Polish**: blueprints/ghosts, snapping, bulldozer, undo/redo.
7. **Saves & Scenarios**: persistence, scripted goals.

---

## 12) Nice‑to‑Have Utilities

- **Importer** for heightmaps (PGM/PNG) → terrain.
- **Map generator**: noise + rivers → industry placement heuristics.
- **Mod hooks**: register new cargo types/industry recipes.
- **Telemetry**: sim step timings (per system) + Profiler overlay.

---

## 13) Tips for React 19+ stack

- Prefer **use** and **Actions** only if you opt into RSC—otherwise keep to CSR with R3F.
- Keep React components thin; simulation lives outside React in ECS.
- Consider `frameloop="demand"` for UI‑heavy screens; switch to `always` while sim runs.

---

## 14) Next Steps (you can do in minutes)

- Paste the files above, run `pnpm dev`, confirm a moving demo vehicle.
- Add `placeTrack.ts` that spawns two nodes + one segment and an instance.
- Unit‑test A\* with a small fabricated graph.
- Add a `DebugPanel` with Leva to toggle speeds and spawn vehicles.

---

If you want, I can extend this with a **ready‑to‑run starter repo** in this canvas: fully wired graph, a simple rail placer, a moving train entity, and a save/load button.
