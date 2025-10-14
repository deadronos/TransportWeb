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

### R18: Settlement Growth Simulation

**WHEN** the fixed-timestep simulation advances, **THE SYSTEM SHALL** update town populations and satisfaction metrics based on service coverage so that economic growth trends evolve over time.

**Acceptance Criteria:**

- Advancing the simulation increases or decreases population figures deterministically according to service coverage inputs.
- Satisfaction values remain clamped between 0 and 1 and trend toward coverage quality each tick.
- Growth trend labels (e.g., "Growing", "Stagnant") change when the rolling population delta crosses ±1% thresholds.
- Unit tests can step the simulation and assert the resulting population and satisfaction values.

---

### R19: Industry Production Dynamics

**WHEN** the economy simulation ticks, **THE SYSTEM SHALL** adjust industry inventory and throughput using supply fulfillment ratios so production surpluses and shortages are tracked.

**Acceptance Criteria:**

- Each industry tracks input fulfillment (0–1) and output stock (>= 0) that update on every tick.
- Shortages decrease output stock while surpluses accumulate inventory within capped limits.
- Industries expose utilization percentages derived from supply fulfillment and stock.
- Tests validate stock depletion when fulfillment is low and recovery when fulfillment improves.

---

### R20: Territory Summary Integration

**WHEN** the management sidebar renders, **THE SYSTEM SHALL** source territory counts and status text from the live economy simulation instead of static placeholder arrays.

**Acceptance Criteria:**

- Territory rows read from a selector backed by the economy state.
- Counts equal the number of simulated entities per category (towns, farms, industries, mines).
- Status strings reflect aggregate sentiment (e.g., average satisfaction/utilization) and change as simulation data shifts.
- UI tests cover that rendered content updates after mutating the store in a controlled fashion.

---

### R21: Opportunity Feed Generation

**WHEN** industries exhibit unmet demand or surplus capacity, **THE SYSTEM SHALL** surface production opportunities with status chips and freshness text derived from in-game time.

**Acceptance Criteria:**

- Opportunity items originate from simulation selectors and include location, industry type, status, and updatedAgo text.
- Status chips map to shortage ("needs-link"), idle, and expanding states based on fulfillment metrics.
- Freshness strings reflect the simulated time elapsed since the condition last changed.
- Tests confirm that shortages create "needs-link" entries and the freshness text updates when the clock advances.

---

### R22: Economy Site Visualization Sync

**WHEN** the economy state initializes or resets, **THE SYSTEM SHALL** populate the ECS world with renderable entities for every town, farm, industry, and mine so their locations appear in the 3D scene.

**Acceptance Criteria:**

- Each generated settlement site corresponds to an ECS entity with a `Transform.position` matching the economy state's coordinates.
- Entities are created for all settlement categories (town, farm, industry, mine) without omissions.
- Entities are removed and recreated when the economy seed resets so there are no stale renderables left in the world.
- Unit tests verify that syncing after a reset yields the correct entity counts and positions.

---

### R23: Economy Site Updates

**WHEN** the economy store gains or loses settlement entries, **THE SYSTEM SHALL** reconcile ECS renderables so additions appear and removals disappear on the next tick without duplicating entities.

**Acceptance Criteria:**

- Adding a new settlement to the store spawns exactly one new ECS entity with the expected renderable metadata.
- Removing a settlement from the store deletes its corresponding ECS entity.
- No duplicate ECS entities remain after repeated updates to the same settlement list.
- Tests simulate store mutations and assert entity counts remain consistent with the store contents.

---

### R24: Distinct Settlement Placeholder Meshes

**WHEN** the SceneGraph renders settlement renderables, **THE SYSTEM SHALL** display distinctive placeholder meshes for towns, farms, industries, and mines so players can differentiate them at a glance.

**Acceptance Criteria:**

- Towns render as clustered multi-building placeholders with warm accent colors.
- Farms render with barn-and-silo style geometry using earth tones.
- Industries render as factory blocks with smokestack shapes.
- Mines render as excavated pits or conveyors with darker palette cues.
- Visual regressions are covered by component-level tests or snapshot verification that ensures the correct mesh hierarchy per kind.

---

### R25: Signal Placement & Visualization

**WHEN** the player activates the signal construction tool and clicks near an existing rail segment, **THE SYSTEM SHALL** create a directional signal anchored to that segment with an in-world visual indicator.

**Acceptance Criteria:**

- A new signal is persisted in the `NetworkGraph` with the associated edge ID and orientation
- A signal mesh appears offset from the track in the scene graph
- Subsequent queries for signals on that edge return the placed signal
- Signals cannot be placed on non-rail edges or without a nearby segment target

---

### R26: Signal Removal Workflow

**WHEN** the player uses the signal tool on the location of an existing signal, **THE SYSTEM SHALL** remove that signal and its visual representation from the network.

**Acceptance Criteria:**

- The targeted signal no longer appears in `NetworkGraph.getSignalsForEdge`
- The associated ECS renderable is destroyed and disappears from the scene
- Removing a signal does not disturb neighboring signals or tracks
- Removing a track or node automatically cleans up any attached signals

---

### R27: Signal-Constrained Train Movement

**WHEN** a vehicle attempts to enter a rail edge protected by a signal whose block contains another vehicle, **THE SYSTEM SHALL** hold the vehicle at the signal until the block ahead becomes clear.

**Acceptance Criteria:**

- Vehicles encountering an occupied signal block transition into a waiting/blocked state without clearing their route
- Vehicles resume travel automatically once the controlling block is free of other vehicles
- Block checks ignore the waiting vehicle’s own reservations to prevent self-deadlocks
- Automated tests cover multi-vehicle scenarios demonstrating the hold-and-release behavior

---

### R28: Diagonal Track Connectivity

**WHEN** the player builds rails or roads on diagonally adjacent grid tiles, **THE SYSTEM SHALL** connect the nodes with correctly oriented geometry and reciprocal edges.

**Acceptance Criteria:**

- Nodes offset by equal X/Z grid steps are considered neighbors during placement
- Generated track meshes rotate to align with diagonal headings
- Network edges between diagonal nodes report accurate lengths via `calculateDistance`
- Unit tests verify diagonal adjacency detection and edge creation
