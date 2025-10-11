# Requirements - Transport Tycoon Web

## EARS Format Requirements

### R1: Project Initialization

**WHEN** the project is scaffolded, **THE SYSTEM SHALL** create all necessary folders and files matching the architecture specification.

**Acceptance Criteria:**

- All directories from idea.md section 2 exist
- Package.json includes all dependencies from idea.md section 1
- Configuration files (vite, eslint, tsconfig) are properly set up
- Entry point files (index.html, main.tsx) are created

---

### R2: 3D Canvas Rendering

**WHEN** the development server starts, **THE SYSTEM SHALL** render a 3D canvas with functional camera controls.

**Acceptance Criteria:**

- Browser displays R3F Canvas with 3D scene
- OrbitControls allow pan, zoom, and rotate
- Ambient and directional lighting are visible
- Stats display shows FPS counter
- No console errors during initialization

---

### R3: Fixed Timestep Simulation

**WHEN** the game loop runs, **THE SYSTEM SHALL** update ECS entities at a fixed 60fps rate independent of render framerate.

**Acceptance Criteria:**

- Simulation ticks every 16.67ms regardless of display refresh
- Accumulator pattern prevents spiral of death
- Console logging shows consistent dt values
- Frame drops don't cause simulation speed changes

---

### R4: ECS World Management

**WHEN** entities are added to the world, **THE SYSTEM SHALL** manage them through Miniplex ECS with component queries.

**Acceptance Criteria:**

- World instance is provided via React context
- Entities can have Transform, Renderable, Vehicle components
- Queries filter entities by component presence
- Systems can iterate over entity subsets efficiently

---

### R5: Zustand UI State

**WHEN** user interacts with UI controls, **THE SYSTEM SHALL** update application state through Zustand slices.

**Acceptance Criteria:**

- Clock slice controls play/pause/speed
- Build slice manages current tool mode
- Selection slice tracks hovered/selected entities
- State persists to localStorage where appropriate

---

### R6: Construction Ghost Validation

**WHEN** a construction tool is active and the cursor hovers over the terrain, **THE SYSTEM SHALL** display a ghost preview snapped to the build grid that reflects whether placement is valid based on existing structures.

**Acceptance Criteria:**

- Ghost preview follows mouse and snaps to 10-unit grid
- Preview turns green when placement is allowed and red when blocked by an existing node
- Demolish tool only shows valid state when a removable structure is under the cursor
- Zustand state (`ghostPosition`, `isValidPlacement`) reflects the rendered preview

---

### R7: Track & Road Placement

**WHEN** the player clicks while a track or road tool is active and the placement is valid, **THE SYSTEM SHALL** create network nodes, connect neighboring segments, and spawn ECS entities representing the visual track or road geometry.

**Acceptance Criteria:**

- Nodes are added to the `NetworkGraph` with correct type and metadata
- Adjacent segments connect automatically via graph edges without duplicates
- Visual meshes appear in the scene aligned with the segment direction
- Graph version increments so dependent systems can react

---

### R8: Structure Removal

**WHEN** the player uses the demolish tool on an existing structure, **THE SYSTEM SHALL** remove associated graph nodes, edges, and visual ECS entities in sync.

**Acceptance Criteria:**

- Targeted node is removed along with all connected edges
- Visual meshes for tracks/roads/stations/depot are destroyed
- Neighboring segments remain intact and functional
- Re-hovering immediately reflects the cleared placement slot as valid

### R9: Vehicle Route Assignment

**WHEN** a vehicle is spawned while the network graph has at least two connected nodes, **THE SYSTEM SHALL** locate a valid origin and destination node, compute a path, and reserve its edges for that vehicle.

**Acceptance Criteria:**

- Vehicles spawn at the closest network node position
- A\* pathfinding returns a non-empty path when connectivity allows
- Edge `occupied` lists include the vehicle ID after spawning
- Vehicles without a path remain idle without errors

### R10: Vehicle Route Following

**WHEN** the simulation ticks and a vehicle has an assigned path, **THE SYSTEM SHALL** advance the vehicle along its reserved edges respecting acceleration, release edges as they are cleared, and recycle a new destination upon arrival.

**Acceptance Criteria:**

- Vehicle transforms interpolate along edge positions during movement
- Completed edges are removed from the graph occupancy list immediately after traversal
- Vehicles pick a new destination node once they reach the end of a path
- Vehicles halt gracefully if their reserved edges disappear mid-route

### R11: Debug Entity Inspector

**WHEN** the user toggles the entity inspector in the debug panel, **THE SYSTEM SHALL** display a scrollable list of live ECS entities with their IDs, component summary, and route status for vehicles.

**Acceptance Criteria:**

- Debug panel gains a toggle control for the inspector without affecting default layout
- Entity list updates as entities are added or removed from the world
- Vehicle rows show current speed and destination (if any)
- Panel hides the list when the toggle is off

---

## Non-Functional Requirements

### NFR1: Performance

- Target: 60fps with 100+ entities
- Method: Instanced rendering, spatial culling
- Validation: Browser performance profiler

### NFR2: Code Quality

- TypeScript strict mode enabled
- ESLint passes with no warnings
- Vitest unit tests for systems
- Self-documenting code with minimal comments

### NFR3: Maintainability

- Clear separation: ECS (simulation) vs Zustand (UI)
- Modular system architecture
- Serializable state for save/load
- Version-tagged save format

---

**Status**: Active  
**Created**: 2025-10-11  
**Last Updated**: 2025-10-15
