# TASK009 - Economy Site Visual Layer

## Objective

Expose economy settlements on the 3D map using ECS renderables with placeholder meshes so towns and industries are visible for planning.

## Status

- Completed (2025-10-19)

## Requirements

- R22: Economy Site Visualization Sync
- R23: Economy Site Updates
- R24: Distinct Settlement Placeholder Meshes

## Plan

1. **Extend ECS Renderable Schema**
   - Update `Entity` type with new renderable kinds.
   - Adjust SceneGraph color map defaults to include settlement categories.
2. **Implement Economy Render Sync Hook**
   - Create `useEconomySiteRenderables` hook under `src/game/scene/`.
   - Diff Zustand state and mutate ECS world accordingly.
   - Cover with unit test verifying add/remove sync.
3. **Design Placeholder Mesh Factories**
   - Refactor SceneGraph to use per-kind render components.
   - Implement distinct mesh hierarchies for town, farm, industry, mine.
   - Add component tests (React Testing Library + drei) verifying structure.
4. **Wire Hook Into Simulation**
   - Mount hook inside `Simulation` component.
   - Ensure cleanup removes entities on unmount/reset.
5. **Validation Pass**
   - Run format, lint, typecheck, vitest.
   - Manual smoke test to confirm visuals render without console errors.

## Dependencies

- Shared ECS world provider (available).
- Economy store and generator (completed in TASK008).

## Deliverables

- Hook implementation with tests.
- SceneGraph refactor for custom settlement meshes.
- Documentation updates (requirements, design, task index, active context).

## Outcomes

- Added `useEconomySiteRenderables` hook with registry diffing and unit coverage to keep ECS entities aligned with the economy store.
- Introduced settlement placeholder descriptors and renderers so towns, farms, industries, and mines render unique silhouettes on the map.
- Updated SceneGraph, world type unions, and tests to recognize new renderable kinds and verify placeholder geometry metadata.
