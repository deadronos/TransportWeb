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
**Last Updated**: 2025-10-11
