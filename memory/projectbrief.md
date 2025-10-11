# Project Brief: Transport Tycoon Web

## Vision

Build a performant, deterministic, and moddable Transport Tycoon-like simulation game that runs entirely in the browser.

## Core Goals

1. **Performance**: 60fps simulation with thousands of entities using ECS architecture
2. **Determinism**: Fixed timestep with seeded RNG for reproducible gameplay and save/load
3. **Moddability**: Clean separation of concerns allowing content additions
4. **Browser-native**: No installation required, runs on modern browsers

## Technology Stack

- **Frontend**: React 19 + Vite + TypeScript
- **3D Rendering**: react-three-fiber (R3F) + drei helpers
- **State Management**: Zustand (UI state only)
- **Simulation**: Miniplex ECS (entity-component-system)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Build**: Vite with code splitting, compression

## Core Features

### Phase 1 - Foundation
- Fixed timestep game loop (60fps)
- 3D camera controls and basic scene
- Grid overlay for building mode
- Track/road placement system

### Phase 2 - Network & Movement
- Graph-based pathfinding (A*)
- Vehicle motion with physics
- Station placement and connections
- Block-based signaling

### Phase 3 - Economy
- Cargo loading/unloading
- Industry production/consumption
- Income and expenses
- Company management

## Technical Constraints

- Browser-based (no native code)
- Deterministic simulation (reproducible from save)
- Serializable state (ECS + Zustand)
- Instanced rendering for performance
- WebGL 2 minimum requirement

## Success Criteria

1. Place tracks, spawn train, reaches station
2. Save/load game state perfectly
3. 60fps with 100+ vehicles on screen
4. Pathfinding handles complex networks
5. Economy simulation is balanced and fun

## Out of Scope (v1)

- Multiplayer/networking
- Mobile touch controls
- Custom terrain editor
- Mod marketplace/loading

---

**Status**: Initial scaffold phase  
**Created**: 2025-10-11  
**Last Updated**: 2025-10-11
