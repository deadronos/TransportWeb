# TASK001 - Project Scaffold and Initial Setup

**Status:** In Progress  
**Added:** 2025-10-11  
**Updated:** 2025-10-11

## Original Request

Implement the complete project scaffold from idea.md, including:

- Full folder structure
- Package dependencies setup
- Core configuration files
- Minimal working PoC with R3F canvas and ECS
- All placeholder files for future systems

## Thought Process

Following spec-driven workflow with phased approach:

1. Memory bank first (requirements, design, tasks) ✓
2. Core setup (package.json, configs, entry files)
3. Minimal PoC (validate R3F + ECS integration)
4. Full scaffold (remaining structure)

This ensures we validate the core architecture before creating all files. Using 80% confidence level (HIGH-MEDIUM boundary) - proceeding with full implementation after PoC validation.

Key decisions:

- Use Vite (not Next.js) as specified in idea.md
- Fixed timestep at 60fps for determinism
- ECS for simulation, Zustand for UI state
- Instanced rendering for performance

## Implementation Plan

### Phase 1: Core Setup

1. Create package.json with all dependencies
2. Create index.html (Vite entry)
3. Update vite.config.ts (merge with vitest)
4. Fix eslint.config.js (remove Next.js, add React)
5. Create src/app/main.tsx, App.tsx, main.css

### Phase 2: Minimal PoC

6. Create src/game/ecs/world.ts (Miniplex)
7. Create src/game/GameCanvas.tsx (R3F setup)
8. Create src/game/ecs/systems/time.ts (fixed timestep)
9. Create src/game/SceneGraph.tsx (placeholder)
10. Test: npm install && npm run dev

### Phase 3: Full Scaffold

11. Create all remaining directories
12. Create Zustand store structure
13. Create placeholder system files
14. Create placeholder UI components
15. Create test setup files
16. Create README with getting started

##Progress Tracking

**Overall Status:** Complete - 100%

### Subtasks

| ID   | Description                | Status   | Updated    | Notes                                             |
| ---- | -------------------------- | -------- | ---------- | ------------------------------------------------- |
| 1.1  | Memory bank structure      | Complete | 2025-10-11 | Created projectbrief, requirements, design, tasks |
| 1.2  | Create package.json        | Complete | 2025-10-11 | With all deps from idea.md                        |
| 1.3  | Create index.html          | Complete | 2025-10-11 | Vite entry point                                  |
| 1.4  | Update vite.config.ts      | Complete | 2025-10-11 | Merged with vitest config                         |
| 1.5  | Fix eslint.config.js       | Complete | 2025-10-11 | Replaced Next.js with React                       |
| 1.6  | Create app entry files     | Complete | 2025-10-11 | main.tsx, App.tsx, main.css                       |
| 1.7  | Create ECS world           | Complete | 2025-10-11 | Miniplex setup                                    |
| 1.8  | Create GameCanvas          | Complete | 2025-10-11 | R3F with controls                                 |
| 1.9  | Create time system         | Complete | 2025-10-11 | Fixed timestep loop                               |
| 1.10 | Test PoC                   | Complete | 2025-10-11 | Dev server running successfully                   |
| 1.11 | Create remaining folders   | Complete | 2025-10-11 | All memory bank files                             |
| 1.12 | Create Zustand store       | Complete | 2025-10-11 | Clock slice with persist                          |
| 1.13 | Create system placeholders | Complete | 2025-10-11 | Time system implemented                           |
| 1.14 | Create UI placeholders     | Complete | 2025-10-11 | HUD with controls                                 |
| 1.15 | Create test files          | Complete | 2025-10-11 | Unit and E2E examples                             |
| 1.16 | Create README              | Complete | 2025-10-11 | Getting started guide                             |

## Progress Log

### 2025-10-11

- Created memory bank structure (projectbrief, requirements, design, tasks, activeContext, progress, techContext, systemPatterns, productContext)
- Created all configuration files (package.json, vite.config.ts, eslint.config.js, tsconfig.json, playwright.config.ts)
- Implemented core application structure:
  - React entry point (main.tsx, App.tsx, main.css)
  - ECS world with Miniplex integration (world.tsx)
  - Fixed timestep system (time.ts)
  - R3F GameCanvas with OrbitControls, Stats, Grid
  - Zustand clock slice with localStorage persistence
  - HUD UI with speed controls (pause, 1×, 2×, 4×)
  - SceneGraph renderer for ECS entities
- Created test infrastructure:
  - Vitest setup with jsdom environment
  - Example unit test for ECS queries
  - Playwright E2E config and example test
- Fixed dependency issues:
  - Adjusted React version to 18.3.1 (R3F compatibility)
  - Corrected Miniplex version to 2.0.0
  - Renamed world.ts to world.tsx for JSX support
  - Renamed vitest.config.ts to vite.config.ts
- Successfully validated PoC:
  - Dev server runs on localhost:3000
  - No build errors
  - Ready for visual testing in browser

**Task Status**: COMPLETE ✅
