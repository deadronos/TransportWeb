# Product Context

## Why This Exists

Transport Tycoon (1994) and its successor OpenTTD remain beloved for their deep simulation gameplay, but they require installation and have steep learning curves. Modern web technologies (WebGL, Web Workers, WASM) now enable complex simulations in the browser with zero installation friction.

This project demonstrates that a deterministic, performant transport simulation can run entirely in a browser while maintaining the depth that makes the genre compelling.

## Problems It Solves

### For Players
- **Zero friction**: Click a link and play immediately
- **Cross-platform**: Works on any device with a modern browser
- **Shareable**: Send a URL to share saves or scenarios
- **Moddable**: Clear architecture encourages community content

### For Developers
- **Learning resource**: Production-quality ECS architecture example
- **Modern stack**: React 19 + Three.js + TypeScript best practices
- **Testing**: Comprehensive unit and E2E test examples
- **Documentation**: Spec-driven workflow with clear design decisions

## How It Should Work

### Core Loop
1. **Build Infrastructure**: Place tracks, roads, stations, depots
2. **Manage Vehicles**: Purchase trains/trucks, set routes
3. **Transport Cargo**: Connect industries to create supply chains
4. **Earn Money**: Delivery payments fund expansion
5. **Grow Network**: Optimize routes, add capacity, explore map

### Key Principles

**Deterministic Simulation**
- Fixed timestep (60fps) ensures reproducibility
- Seeded RNG makes saves perfectly replayable
- No race conditions or timing-dependent bugs

**Performance First**
- ECS architecture for efficient entity management
- Instanced rendering for thousands of objects
- Spatial culling and LOD for large maps
- Web Workers for pathfinding if needed

**Clear Separation**
- Simulation lives in ECS (game state truth)
- UI lives in Zustand (player preferences, view state)
- Rendering reads from ECS (reactive, no mutations)

## User Experience Goals

### Onboarding
- Tutorial scenario introduces mechanics gradually
- Visual feedback for all actions (ghost buildings, tooltips)
- Clear error messages when actions fail
- Sandbox mode for experimentation

### During Gameplay
- Smooth 60fps even with 500+ entities
- Responsive controls (camera, selection, tools)
- Real-time updates (income, cargo flow, vehicle status)
- Visual clarity (color coding, overlays, highlights)

### Meta Features
- Quick save/load (localStorage for now)
- Undo/redo for building mistakes
- Speed controls (pause, 1×, 2×, 4×)
- Statistics and performance graphs

## Success Metrics

### Technical
- Maintains 60fps with 100+ vehicles
- Loads save files in <1 second
- Zero memory leaks (stable over hours)
- Deterministic replay (same seed → same outcome)

### Gameplay
- Players can complete first scenario in 10-15 minutes
- Clear understanding of profit/loss within 5 minutes
- Pathfinding resolves complex networks without deadlocks
- Economy feels balanced and rewarding

### Development
- New cargo types addable in <50 lines
- New vehicle types addable in <100 lines
- Unit tests cover critical simulation systems
- E2E tests validate core user flows

---

**Status**: Active  
**Created**: 2025-10-11  
**Last Updated**: 2025-10-11
