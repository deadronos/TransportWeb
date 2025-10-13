# DESIGN009 - Economy Site Visual Layer

## Summary

Create a render layer that mirrors economy settlement data into ECS entities with distinctive placeholder meshes for towns, farms, industries, and mines. This makes seeded sites visible on the world map without waiting for final art.

## Goals

- Synchronize the economy store with scene graph entities so every settlement has a visual representation.
- Provide differentiated placeholder geometry per settlement category.
- Keep synchronization reactive to store resets or mutations without leaking ECS entities.

## Architecture Overview

```
EconomyStore (Zustand)
    │  subscribe (settlement snapshot)
    ▼
EconomyRenderSync hook (React effect)
    │  diff + apply to ECS World
    ├─ addEntity(site)  ──> World.add(Entity{Transform, Renderable})
    └─ removeEntity(id) ──> World.remove(Entity)

SceneGraph (R3F component)
    │  renders based on Renderable.kind
    └─ Mesh Factories per settlement type
```

- **EconomyRenderSync hook** lives in `src/game/scene` to emphasize scene responsibilities.
- Hook runs inside `Simulation` component so it gains access to the shared ECS world.
- Renderable metadata includes `kind` (extended union) and optional styling tokens (color palette, scale).
- SceneGraph chooses specialized mesh hierarchies per `kind` to display placeholder silhouettes.

## Data Flow

1. On mount, hook grabs `useEconomyStore.getState()` to seed current settlements.
2. Diff pass builds `Map<siteId, Entity>` so we can reconcile additions/removals.
3. Zustand subscription triggers on any settlement array change; hook recomputes diffs and updates ECS world accordingly.
4. SceneGraph iterates `world.with("Transform", "Renderable")` each frame and dispatches to placeholder factories.
5. When component unmounts, hook removes all spawned entities to avoid orphaned renderables.

## Interfaces

- `Renderable.kind` union extends to include `"town" | "farm" | "industry" | "mine"`.
- Hook helper signature: `function syncSitesToWorld(world: World<Entity>, state: EconomyState): void`.
- Mesh factory type: `type RenderFactory = (entity: Entity) => JSX.Element;` stored in map keyed by `Renderable.kind`.

## Placeholder Mesh Design

- **Town**: group of three boxes of varying heights with warm roof color accent; positioned relative to entity origin.
- **Farm**: base barn box + adjacent cylinder silo; muted reds/orange and gray.
- **Industry**: wide base box with tall smokestack cylinder and rooftop vent boxes.
- **Mine**: low base with wedge ramp (use box + rotated plane) and support frame (thin boxes) in dark palette.

## Risks & Mitigations

- **Duplicate Entities**: Use `Map` to track `siteId -> entity` and cleanup removed ids each sync.
- **Performance**: Site counts are low (<25), so direct diffing is acceptable; no instancing required.
- **Subscription Loops**: Hook uses Zustand `subscribe` without selectors; ensures setState is not called inside render cycle to avoid loops.

## Validation Strategy

- Unit test for sync helper ensuring world entity counts match settlement arrays after add/remove.
- Snapshot test for SceneGraph to confirm mesh hierarchy per kind (assert children counts / geometry types).
- Manual: run app, verify colored placeholders appear at seeded coordinates and respond to economy reset via debug (if available).
