# Active Context

## Current Focus

**Phase**: Phase 3 - Network & Movement System Complete

**Status**: TASK010 (Signaling & Diagonal Track Support) verified as complete. All requirements implemented and tested.

## What We're Building Now

### Completed (TASK010 - 2025-10-26)

- ✅ R25 - Signal Placement & Visualization (signal tool, ghost preview, placement logic)
- ✅ R26 - Signal Removal Workflow (click to remove, modifier-based updates)
- ✅ R27 - Signal-Constrained Train Movement (block evaluation, blocked state, resume logic)
- ✅ R28 - Diagonal Track Connectivity (neighbor detection with diagonal support)
- ✅ NetworkSignal data model with full serialization
- ✅ Graph operations for signal CRUD
- ✅ Construction mode signal placement with modifiers (Shift=reverse, Alt=mirror)
- ✅ Vehicle blocking system with `isSignalBlockClear()` checks
- ✅ Comprehensive test coverage (37+ passing tests)

### Completed

- ✅ TASK003 - Requirements drafted for construction validation, placement, and demolition
- ✅ TASK003 - Design for network-backed placement approved (DESIGN004)
- ✅ TASK003 - Task plan captured in memory/tasks/TASK003-track-placement.md
- ✅ TASK003 - Implemented `useNetworkStore` slice with graph + visual registry
- ✅ TASK003 - Updated `useConstructionMode` for placement, connectivity, demolition
- ✅ TASK003 - Enhanced `SceneGraph` rendering for new mesh metadata

### Completed (TASK002 - Phase 1 & 2)

- ✅ Isometric camera constraints (polar angles π/6 to π/3)
- ✅ Dual-layer grid system (10-unit construction + 1-unit base)
- ✅ Grass terrain rendering (500×500 units, #2d5016)
- ✅ Grid utility functions (snapToGrid, worldToGrid, gridToWorld)
- ✅ Construction state management (Zustand slice with persistence)
- ✅ TopMenuBar component (Transport Tycoon aesthetic)
- ✅ HUD integration (replaced inline controls)
- ✅ Full Transport Tycoon styling (gradients, hover effects, colors)

### Completed (TASK001 - Initial Scaffold)

- ✅ Memory bank structure
- ✅ Package.json with React 18 + Vite 6 + Three.js + R3F + Miniplex 2.0 + Zustand
- ✅ Configuration files (Vite, ESLint, TypeScript, Playwright)
- ✅ ECS world setup with fixed timestep (60 UPS)
- ✅ R3F GameCanvas with OrbitControls
- ✅ Zustand clock slice
- ✅ SceneGraph component
- ✅ Example unit and E2E tests

### Completed (TASK004)

- ✅ Vehicle route-following system tied to transport network (simulation + edge reservations)
- ✅ Debug entity inspector toggle + live list wired to ECS world
- ✅ Final documentation and regression sweep for TASK003 follow-up items

### Completed (TASK003)

- ✅ Track placement integration (ghost validation, placement, demolition)
- ✅ Manual validation and documentation updates (subtask 3.4)

### Next Steps

TASK010 is complete. Ready for next task assignment or feature development.

## Recent Changes

**2025-10-26 (TASK010 Verification)**: Confirmed signaling and diagonal track features are fully implemented

- Verified all four requirements (R25-R28) are complete and tested
- Signal placement tool with modifier keys (Shift/Alt) working as designed
- Vehicle blocking system correctly gates trains at occupied signal blocks
- Diagonal track connectivity validated with proper geometry rotation
- Updated task documentation to reflect completion status

**2025-10-22 (Rail/Road Connection Heuristics)**: Made construction tools default to sensible links

- Limited automatic junction fan-out to the two best neighbors so freshly placed rails and roads extend straight instead of sprouting every diagonal.
- Reused Shift as a "fan-out" modifier so intersections are still one-click when desired, while the preview now mirrors the eventual links.
- Persisted the last placement context to keep dragging along a corridor intuitive across multiple clicks.

**2025-10-21 (Construction Tool Previews)**: Extended building UX with live previews

- Added neighbor-aware rail/road ghost segments that mirror the connections created on placement, giving early feedback on diagonals and junctions.
- Rendered station/depot service radii during placement so coverage tradeoffs are visible before committing.
- Introduced a query overlay that summarizes town growth, industry utilization, and site coverage in-world when the Query tool hovers a settlement.

**2025-10-20 (Signal Orientation Controls)**: Added modifier-driven placement options for signals

- Shift now targets the reverse-direction edge so signals can be placed for opposing traffic without repositioning the cursor.
- Alt mirrors the placement to the opposite side of the track, with ghost previews updating as modifiers change.
- Clicking an existing signal updates its orientation when modifiers adjust; repeated placement without modifiers still removes it.

**2025-10-18 (Economy Simulation 2.0)**: Replaced placeholder sidebar data with live economy state

- Added dedicated economy store with seeded settlements, industries, and mines.
- Implemented fixed-timestep simulation covering growth, fulfillment, stock, and opportunity freshness.
- Wired ManagementSidebar selectors + Vitest coverage to validate live data rendering.
- Updated memory artifacts (requirements, design, tasks) to reflect completion.

**2025-10-15 (Vehicle Routing + Inspector)**: Integrated network-backed vehicle motion and live debug tooling

- Implemented `advanceVehicleSimulation` system to assign routes, reserve edges, and animate vehicles along tracks with dwell logic.
- Hooked debug panel spawner into network nodes and added toggleable entity inspector with live ECS snapshots.
- Authored focused Vitest coverage for routing logic and inspector behavior; stabilized requestAnimationFrame stubs.

**2025-10-17 (Sidebar Growth Dashboard)**: Expanded management sidebar analytics footprint

- Added expansion progress meters, territory summary cards, and production opportunity feed with placeholder datasets.
- Styled new panels with TT-inspired chrome and status chips for at-a-glance readability.
- Extended HUD Vitest suite to assert progress bars, category counts, and opportunity metadata render correctly.

**2025-10-14 (Debug Utilities)**: Added toggleable debug panel to accelerate vehicle prototyping

- Built HUD toggle and in-world panel for spawning vehicles and tweaking simulation speed.
- Added stats visibility toggle tied to the new debug controls.

**2025-10-14 (Testing Infrastructure)**: Restored Vitest suite after registry blocks

- Aliased `@testing-library/jest-dom/vitest` to a local matcher polyfill to bypass the 403 download restriction.
- Re-ran the full Vitest suite to confirm the fallback behaves like the upstream matchers.

**2025-10-13 (Bugfix)**: Stabilized construction runtime loop

- Reworked Zustand selectors in GameCanvas + construction hooks to remove render storm causing infinite loop errors.
- Validated ghost preview + grid rendering without React depth errors.

**2025-10-12 (TASK003)**: Track Placement Integration kickoff

- Authored EARS requirements R6–R8 for ghost validation, placement, and demolition
- Logged design plan in `memory/designs/DESIGN004-track-placement.md`
- Created task tracker entry `memory/tasks/TASK003-track-placement.md`
- Established next-step checklist for implementation phase

## Active Decisions

### Technical Decisions

- **Camera Constraints**: minPolarAngle=π/6, maxPolarAngle=π/3 for forced isometric view
- **Grid Strategy**: Auto-show grid when construction tool active, hide with Query tool
- **State Persistence**: Construction state persists to localStorage
- **Color Palette**: Transport Tycoon standard (#2d5016 grass, #4a7c59 active, #2a2a2a UI)
- **Vite over Next.js**: Faster dev server, simpler CSR setup
- **Fixed 60fps timestep**: Ensures deterministic simulation
- **ECS boundary**: Simulation never touches Zustand (one-way flow)

### Design Decisions

- **Phased Approach**: Visual foundation → Interactive features → Advanced graphics
- **Grid Snap**: Default 10-unit grid for tracks/roads, 1-unit precision available
- **Tool Workflow**: Tool selection → Grid auto-shows → Ghost preview → Placement
- **PoC first**: Validate core architecture before expanding features

## Known Issues

- R3F TypeScript errors on JSX intrinsics (false positives, non-blocking)
- Markdown lint warnings in memory bank (formatting only, non-blocking)
- Vitest reports act() warnings when exercising DebugPanel animations (non-blocking, under observation)

## Blockers

None.

## Questions

- [x] Camera angle for Transport Tycoon? → Answered: π/6 to π/3 polar angles
- [x] Grid visibility strategy? → Answered: Auto-show with construction tools
- [ ] Ghost preview color scheme? (Suggestion: Green=valid, Red=invalid)
- [ ] Raycasting performance with large grids? (Test after implementation)

---

**Next Action**: Schedule TASK005 planning session for vehicle motion polish
**Last Updated**: 2025-10-22
