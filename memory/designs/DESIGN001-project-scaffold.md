# DESIGN001 - Project Scaffold & Architecture

**Status**: In Progress  
**Created**: 2025-10-11  
**Updated**: 2025-10-11

## Overview

Initial project scaffold for Transport Tycoon Web following the architecture specified in idea.md. This design establishes the foundation for a deterministic, ECS-based transport simulation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌───────────────────────────────────────────┐  │
│  │           React Application               │  │
│  │  ┌─────────────┐  ┌──────────────────┐  │  │
│  │  │   Zustand   │  │    R3F Canvas    │  │  │
│  │  │  (UI State) │  │  (3D Rendering)  │  │  │
│  │  └──────┬──────┘  └────────┬─────────┘  │  │
│  │         │                   │             │  │
│  │         │         ┌─────────▼─────────┐  │  │
│  │         │         │   Miniplex ECS    │  │  │
│  │         │         │   (Simulation)    │  │  │
│  │         │         │                   │  │  │
│  │         │         │  - Components     │  │  │
│  │         │         │  - Systems        │  │  │
│  │         │         │  - Fixed Timestep │  │  │
│  │         │         └───────────────────┘  │  │
│  │         │                                 │  │
│  │  ┌──────▼──────────────────────────────┐ │  │
│  │  │         UI Overlays (HUD)           │ │  │
│  │  └─────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Vite vs Next.js

**Decision**: Use Vite (as specified in idea.md)  
**Rationale**:

- Faster dev server for 3D development
- Simpler build configuration for CSR app
- Better HMR for game development iteration
- No RSC complexity needed

**Impact**: Must update existing Next.js-oriented ESLint config

### 2. State Separation

**Decision**: ECS for simulation, Zustand for UI/meta state  
**Rationale**:

- Clear boundary prevents bugs from UI state affecting simulation
- ECS optimized for performance-critical game logic
- Zustand provides ergonomic React integration for UI
- Enables independent serialization strategies

**Interfaces**:

```typescript
// Simulation lives in ECS
type Entity = {
  id: string;
  Transform?: { position: vec3; rotation?: quat; scale?: vec3 };
  Vehicle?: { speed: number; accel: number; maxSpeed: number };
  Renderable?: { kind: "track" | "road" | "vehicle" };
};

// UI state lives in Zustand
type UIState = {
  clock: { speed: number; paused: boolean };
  build: { tool: Tool; preview?: Entity };
  selection: { hoveredId?: string; selectedIds: string[] };
};
```

### 3. Fixed Timestep Implementation

**Decision**: Accumulator pattern with 60fps (16.67ms) fixed dt  
**Rationale**:

- Deterministic physics/simulation
- Framerate independence
- Prevents spiral of death

**Algorithm**:

```typescript
let accumulator = 0;
const FIXED_DT = 1 / 60;

function gameLoop(realDt: number) {
  accumulator += realDt;
  while (accumulator >= FIXED_DT) {
    tickAllSystems(FIXED_DT);
    accumulator -= FIXED_DT;
  }
  render(); // happens at display refresh rate
}
```

### 4. Rendering Strategy

**Decision**: Instanced rendering for repeated geometry  
**Rationale**:

- Tracks/roads/trees are repeated thousands of times
- Instancing reduces draw calls from 1000+ to ~10
- R3F provides `<Instances>` helper from drei

**Performance Target**: 60fps with 500+ visible entities

### 5. Directory Structure

**Decision**: Feature-based organization within `src/game/`  
**Rationale**:

- Co-locates related ECS systems
- Clear separation of concerns
- Easy to find and modify features

```
src/
  app/          # React bootstrapping
  game/         # Game-specific code
    ecs/        # ECS world & systems
    state/      # Zustand slices
    ui/         # React UI components
    terrain/    # Heightmap & generation
    input/      # Mouse/keyboard handling
  assets/       # Static resources
tests/          # Unit & E2E tests
```

## Data Models

### Core Components

```typescript
// Position/rotation/scale in world
Transform {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
}

// Visual representation
Renderable {
  kind: 'track' | 'road' | 'station' | 'vehicle' | 'tree'
  meshId?: string  // for instancing
}

// Vehicle kinematics
Vehicle {
  speed: number
  accel: number
  maxSpeed: number
  type: 'train' | 'truck'
}

// Network graph node
NetworkNode {
  id: string
  links: string[]  // connected node IDs
}

// Track/road segment
TrackSegment {
  nodeA: string
  nodeB: string
  length: number
  grade: number   // slope
  curve: number   // curvature
}

// Pathfinding route
Route {
  waypoints: string[]
  currentIndex: number
}

// Cargo payload
Cargo {
  type: 'coal' | 'grain' | 'goods'
  amount: number
}
```

## System Execution Order

1. **time** - Accumulator & fixed timestep orchestration
2. **network** - Graph maintenance when building
3. **pathfinding** - A\* routing & block reservations
4. **signaling** - Block state & collision avoidance
5. **vehicleMotion** - Integrate velocity, obey signals
6. **cargoFlow** - Load/unload at stations
7. **industry** - Produce/consume resources
8. **economy** - Income/expenses/maintenance
9. **despawn** - Cleanup temporary entities

## Error Handling

- **ECS world not found**: Throw error with clear message
- **Missing components**: Systems skip entities lacking required components
- **Invalid state**: Validation layer before serialization
- **Build conflicts**: Preview system shows errors before placement

## Testing Strategy

### Unit Tests (Vitest)

- ECS component queries
- Fixed timestep accumulator
- Pathfinding algorithm
- Economy calculations
- Serialization round-trip

### E2E Tests (Playwright)

- Canvas renders successfully
- Camera controls work
- Place track → spawn train → reaches destination
- Save/load preserves state

## Performance Considerations

1. **Instancing**: Use drei `<Instances>` for tracks/roads/trees
2. **Spatial culling**: Only render entities in frustum
3. **LOD**: Swap meshes based on camera distance
4. **Code splitting**: Lazy load non-critical UI
5. **Web Workers**: Consider for pathfinding if needed

## Migration Path

### Phase 1: Minimal PoC (This Design)

- Core loop + canvas + ECS + 1 moving entity

### Phase 2: Network

- Graph system + pathfinding + stations

### Phase 3: Economy

- Cargo + industry + income

### Phase 4: Polish

- Save/load + undo/redo + scenarios

## Open Questions

- [ ] WebWorker for pathfinding? (defer until needed)
- [ ] Leva debug panel in production build? (likely yes, feature-flagged)
- [ ] Texture atlasing strategy? (defer to asset implementation)

---

**Next Steps**: Create task list and begin implementation
