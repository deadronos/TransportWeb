# Active Context

## Current Focus

**Phase**: Vehicle Routing & Debug Inspector (TASK004) - IN PROGRESS

**Status**: Implementation in verification; vehicle routing loop and inspector UI landed, tightening tests + docs.

## What We're Building Now

### Completed (TASK003)

- ✅ Requirements drafted for construction validation, placement, and demolition
- ✅ Design for network-backed placement approved (DESIGN004)
- ✅ Task plan captured in memory/tasks/TASK003-track-placement.md
- ✅ Implemented `useNetworkStore` slice with graph + visual registry
- ✅ Updated `useConstructionMode` for placement, connectivity, demolition
- ✅ Enhanced `SceneGraph` rendering for new mesh metadata

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

### In Progress (TASK004)

- ✅ Vehicle route-following system tied to transport network (simulation + edge reservations)
- ✅ Debug entity inspector toggle + live list wired to ECS world
- 🔄 Final documentation + regression sweep for TASK003 follow-up items

### Next Steps

1. Capture manual QA notes for construction + routing loop (TASK003 wrap-up)
2. Monitor DebugPanel act() warnings in Vitest — evaluate alternate snapshot strategy if they become blocking
3. Plan additional routing edge-case tests (multi-vehicle, path invalidation) for follow-up iteration

## Recent Changes

**2025-10-15 (Vehicle Routing + Inspector)**: Integrated network-backed vehicle motion and live debug tooling

- Implemented `advanceVehicleSimulation` system to assign routes, reserve edges, and animate vehicles along tracks with dwell logic.
- Hooked debug panel spawner into network nodes and added toggleable entity inspector with live ECS snapshots.
- Authored focused Vitest coverage for routing logic and inspector behavior; stabilized requestAnimationFrame stubs.

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

**Next Action**: Complete TASK003 subtask 3.4 (manual QA + documentation)
**Last Updated**: 2025-10-15
