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

### R12: Dynamic Game Clock Display

**WHEN** the simulation clock advances, **THE SYSTEM SHALL** render the current in-game date and time in the HUD so players can track progression at a glance.

**Acceptance Criteria:**

- HUD reads the clock state from the Zustand slice (respecting pause and speed multipliers)
- Display updates every tick without requiring page refresh
- Date formatting follows `MMM YYYY` with 24-hour clock for time-of-day
- Pausing the simulation freezes the displayed time until resumed

---

### R13: Activity Sidebar Panels

**WHEN** the player opens the management sidebar, **THE SYSTEM SHALL** reveal stacked panels summarizing vehicle fleets, company finances, and alerts with modern Transport Tycoon styling.

**Acceptance Criteria:**

- Sidebar slides in/out with a toggle button in the HUD
- Panels show placeholder datasets (vehicle count, income/expenses, latest alerts)
- Layout adapts to viewport height with internal scrolling when necessary
- Component structure supports future injection of live data via props/state

---

### R14: Network Overview Minimap

**WHEN** the HUD renders, **THE SYSTEM SHALL** present a bottom-right minimap module that mirrors camera orientation and offers quick camera reposition controls.

**Acceptance Criteria:**

- Minimap is visible by default and styled with TT-style chrome
- Clicking the minimap recenters the main camera near the clicked coordinate
- Camera orientation indicator rotates with OrbitControls azimuth
- Component gracefully hides on small screens (< 768px width)

---

### R15: Expansion Progress Overview

**WHEN** the player opens the management sidebar, **THE SYSTEM SHALL** display a company expansion panel summarizing major network milestones with percentage progress bars so momentum is immediately visible.

**Acceptance Criteria:**

- Panel heading labeled "Expansion Progress" appears inside the sidebar
- At least three milestones render with labels, numeric percentages, and ARIA-compliant progress bars
- Percentages and status text stay in sync with their matching progress bar values in the DOM
- Layout adapts to existing sidebar styling without overlapping neighboring panels

---

### R16: Territory Composition Summary

**WHEN** the management sidebar is visible, **THE SYSTEM SHALL** provide a territory summary panel listing counts for towns, farms, industries, and mines alongside qualitative status text.

**Acceptance Criteria:**

- Panel displays category rows for "Towns", "Farms", "Industries", and "Mines"
- Each row contains a total count and a brief status descriptor (e.g., "Growing", "Idle")
- Counts and statuses render as semantic text, not background images, so they are screen-reader friendly
- Data shows placeholder values seeded from component data structures (no hard-coded JSX strings)

---

### R17: Production Opportunities Feed

**WHEN** the player views the management sidebar, **THE SYSTEM SHALL** reveal a production opportunities list that calls out key industries needing attention so planners can prioritize builds.

**Acceptance Criteria:**

- Panel labeled "Production Opportunities" renders within the sidebar
- List contains at least three entries referencing different industry types with status chips (e.g., "Needs rail link")
- Entries include location names and time-based freshness text ("Updated 3h ago")
- Component structure uses array-driven map rendering so future data wiring only requires updating the dataset

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
**Last Updated**: 2025-10-17
