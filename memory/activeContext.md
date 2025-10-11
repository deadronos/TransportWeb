# Active Context

## Current Focus

**Phase**: Transport Tycoon UI Implementation (TASK002) - 70% COMPLETE

**Status**: Core visual foundation and UI framework complete. Interactive construction features pending.

## What We're Building Now

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

### In Progress (TASK002 - Phase 2)
- 🔄 Ghost preview system (transparent building overlay with validity colors)
- 🔄 Raycasting for tile selection (mouse → world position)
- 🔄 useConstructionMode hook (orchestration logic)

### Next Steps
1. Implement ghost preview system (2.7)
2. Add raycasting for tile selection (2.8)
3. Create useConstructionMode hook (2.9)
4. Test full construction workflow
5. Update progress.md and complete TASK002

## Recent Changes

**2025-01-XX (TASK002)**: Transport Tycoon UI Implementation
- Created `src/game/utils/grid.ts` with snap-to-grid utilities
- Created `src/game/state/slices/construction.ts` for state management
- Created `src/game/ui/TopMenuBar.tsx` (90 lines) with 3-section layout
- Created `src/game/ui/TopMenuBar.css` (187 lines) with Transport Tycoon styling
- Created `src/game/scene/Terrain.tsx` for grass plane
- Modified `src/game/GameCanvas.tsx` with camera constraints and dual grid system
- Modified `src/game/ui/HUD.tsx` to use TopMenuBar
- Documented completion in `memory/IMPLEMENTATION-PHASE1-COMPLETE.md`
- Documented research in `memory/designs/UI-RESEARCH-transport-tycoon-visual-design.md`

**2025-10-11 (TASK001)**: Initial scaffold creation
- Created complete project structure from idea.md specification
- Implemented minimal PoC with working R3F + ECS integration
- Added example tests and documented architecture

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

## Blockers

None.

## Questions

- [x] Camera angle for Transport Tycoon? → Answered: π/6 to π/3 polar angles
- [x] Grid visibility strategy? → Answered: Auto-show with construction tools
- [ ] Ghost preview color scheme? (Suggestion: Green=valid, Red=invalid)
- [ ] Raycasting performance with large grids? (Test after implementation)

---

**Next Action**: Implement ghost preview system (TASK002 subtask 2.7)  
**Last Updated**: 2025-01-XX
