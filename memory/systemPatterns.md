# System Patterns

## Architecture Overview

Transport Tycoon Web follows a clean separation of concerns:

```
┌──────────────────────────────────────┐
│          React Layer                 │
│  (UI, Controls, Overlays)            │
└──────────┬───────────────────────────┘
           │
┌──────────▼───────────────────────────┐
│       Zustand State                  │
│  (UI State, Preferences)             │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│    React-Three-Fiber                 │
│  (3D Rendering, Instancing)          │
└──────────┬───────────────────────────┘
           │ reads from
┌──────────▼───────────────────────────┐
│      Miniplex ECS                    │
│  (Simulation, Game State)            │
└──────────────────────────────────────┘
```

## ECS (Entity-Component-System)

### Core Pattern

**Entities**: Objects identified by unique ID
**Components**: Data-only structures attached to entities
**Systems**: Logic that operates on entities with specific components

### Implementation

Using Miniplex for TypeScript-first ECS:

```typescript
// Entity definition
type Entity = {
  id: string;
  Transform?: { position: [number, number, number] };
  Vehicle?: { speed: number; accel: number };
};

// World creation
const world = new World<Entity>();

// Add entity
world.add({
  id: nanoid(),
  Transform: { position: [0, 0, 0] },
  Vehicle: { speed: 0, accel: 1 },
});

// Query entities
for (const entity of world.with("Vehicle", "Transform")) {
  // System logic here
}
```

### Key Decisions

**Why ECS?**

- Performance: Iterate over contiguous memory
- Flexibility: Add/remove components dynamically
- Testability: Systems are pure functions
- Determinism: Clear data flow

**Why Miniplex?**

- TypeScript inference works perfectly
- Familiar query syntax
- React-friendly patterns
- Small bundle size

## Fixed Timestep Loop

### Problem

Variable frame rates cause non-deterministic physics and gameplay differences between machines.

### Solution

Accumulator pattern with fixed 16.67ms timestep:

```typescript
let accumulator = 0;
const FIXED_DT = 1 / 60;

function gameLoop(realDt: number) {
  accumulator += realDt;
  while (accumulator >= FIXED_DT) {
    tickAllSystems(FIXED_DT);
    accumulator -= FIXED_DT;
  }
  render(); // at display refresh rate
}
```

### Benefits

- Deterministic: Same inputs → same outputs
- Framerate independent: 30fps or 144fps produces identical simulation
- Predictable: No spiral of death
- Replayable: Save files work across machines

## State Management

### Zustand for UI State

```typescript
// Clock controls
const useClock = create((set, get) => ({
  speed: 1,
  paused: false,
  setSpeed: (speed) => set({ speed }),
  togglePause: () => set({ paused: !get().paused }),
}));
```

**Patterns:**

- Slice pattern: Each feature gets its own file
- Middleware: devtools, persist
- Selectors: Fine-grained subscriptions
- No providers: Direct imports

### ECS for Simulation State

```typescript
// Simulation queries
const vehicles = world.with("Vehicle", "Transform");
const stations = world.with("Station", "Transform");
```

**Patterns:**

- Components are data-only (no methods)
- Systems are pure functions
- Queries are reactive
- No mutations outside systems

### Boundary Rule

**Zustand → ECS**: ✅ Allowed (UI triggers simulation)
**ECS → Zustand**: ❌ Forbidden (simulation never touches UI)

## Rendering

### R3F Scene Graph

React components map to Three.js objects:

```typescript
<mesh position={[0, 1, 0]}>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial color="red" />
</mesh>
```

### Instancing Pattern

For repeated geometry (tracks, trees):

```typescript
<Instances>
  <boxGeometry />
  <meshStandardMaterial />
  {entities.map(e => (
    <Instance key={e.id} position={e.Transform.position} />
  ))}
</Instances>
```

### Rendering Loop

```typescript
useFrame(({ clock }) => {
  // Fixed timestep simulation (separate from render)
  tickSimulation(clock.elapsedTime);

  // Render happens automatically
});
```

## System Execution Order

Systems run in strict order each tick:

1. **time**: Accumulator, orchestration
2. **network**: Graph maintenance
3. **pathfinding**: A\* routing
4. **signaling**: Block reservations
5. **vehicleMotion**: Physics integration
6. **cargoFlow**: Loading/unloading
7. **industry**: Production/consumption
8. **economy**: Income/expenses
9. **despawn**: Cleanup

Order matters for determinism!

## Data Flow

```
User Input → Zustand → System → ECS → R3F → Screen
   ↑                                        ↓
   └────────── Visual Feedback ─────────────┘
```

### Example: Speed Control

1. User clicks "×2" button
2. Zustand `setSpeed(2)` updates state
3. Time system reads `speed` from Zustand
4. Simulation ticks 2× faster
5. R3F renders updated entity positions
6. User sees vehicles move faster

## Testing Patterns

### Unit Tests (Systems)

```typescript
test("vehicle motion integrates velocity", () => {
  const world = new World<Entity>();
  world.add({
    id: "1",
    Transform: { position: [0, 0, 0] },
    Vehicle: { speed: 5, accel: 0, maxSpeed: 10 },
  });

  vehicleMotionSystem(world, 1.0); // 1 second

  const entity = world.entities.find((e) => e.id === "1");
  expect(entity.Transform.position[0]).toBe(5);
});
```

### E2E Tests (User Flows)

```typescript
test("user can place track", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-tool="track"]');
  await page.click("canvas", { position: { x: 100, y: 100 } });
  await expect(page.locator("[data-track-count]")).toHaveText("1");
});
```

## Key Patterns Summary

| Pattern        | Purpose                 | Implementation       |
| -------------- | ----------------------- | -------------------- |
| ECS            | Simulation architecture | Miniplex             |
| Fixed Timestep | Determinism             | Accumulator loop     |
| State Slices   | UI state                | Zustand              |
| Instancing     | Rendering performance   | R3F Instances        |
| System Order   | Consistent updates      | Strict sequence      |
| Boundary       | Separation of concerns  | ECS ← Zustand, not → |

---

**Status**: Active  
**Created**: 2025-10-11  
**Last Updated**: 2025-10-11
