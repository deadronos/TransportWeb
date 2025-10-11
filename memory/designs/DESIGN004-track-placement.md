# DESIGN004 - Track Placement & Demolition Integration

## Summary
Implement network-aware construction so that player actions translate into persistent graph data and ECS visuals. The design introduces a Zustand-powered network store, extends ECS renderables, and enhances construction hooks to manage placement, connectivity, and demolition in sync.

## Requirements Mapping
- R6: Ghost preview reflects valid placement by consulting the live network graph.
- R7: Valid clicks create nodes, connect neighbors, and spawn meshes for tracks/roads.
- R8: Demolition removes graph entries and visual entities.

## Architecture
```
[React UI]
   │
   ▼
TopMenuBar ──▶ useConstruction (Zustand)
                      │
                      ▼
            useConstructionMode Hook
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
useTerrainRaycaster        useNetworkStore (Zustand)
        │                           │
        ▼                           ▼
    Grid snapping        NetworkGraph instance
        │                           │
        └──────────────► ECS World ◄──────────────┘
```

### Key Components
- **useNetworkStore**: wraps a singleton `NetworkGraph`, exposes CRUD helpers, and tracks `version` for reactivity. Maintains a registry of ECS entities keyed by their `visualEntityId` for cleanup.
- **useConstructionMode**: central orchestrator. Handles pointer events, queries the network store for validity, snaps to grid, and coordinates entity/graph mutations.
- **SceneGraph**: renders `Renderable` entities with richer metadata (dimensions, colors, rotation) for track/road/station meshes.
- **Network Metadata**: nodes store `trackType` and `visualEntityId` (for stations/depots) inside `metadata`. Edges retain `visualEntityId` for shared meshes.

## Data Flow
1. **Hover**: Mouse move → raycast to plane → snap to 10-unit grid → query `useNetworkStore.findNodeAtPosition` to determine validity → update construction slice + ghost preview colors.
2. **Placement**: Valid click triggers `createStructure` for the active tool.
   - Generate deterministic IDs via `nanoid`.
   - Call `addNode` with metadata describing supported track type and optional building mesh ID.
   - Discover neighbors matching same track type and aligned exactly one grid step away.
   - For each new connection: create/record mesh entity, add bidirectional edges with consistent metadata, and mark store version bump.
3. **Demolition**: Valid demolish click gathers connected edges + metadata, removes meshes via registry, deletes node (which cascades edges) and bumps version.

## Interfaces & Contracts
```ts
// Zustand slice
interface NetworkState {
  graph: NetworkGraph;
  version: number;
  visualEntities: Record<string, Entity>;
  addNode(node: NetworkNode): void;
  removeNode(nodeId: string): void;
  addEdge(edge: NetworkEdge): void;
  removeEdge(edgeId: string): void;
  findNodeAtPosition(pos: [number, number, number], tolerance?: number): NetworkNode | null;
  registerVisualEntity(id: string, entity: Entity): void;
  unregisterVisualEntity(id: string): Entity | undefined;
  incrementVersion(): void;
}
```

`useConstructionMode` consumes selectors for `graph`, `version`, `findNodeAtPosition`, and registry helpers.

## Error Handling & Validations
- **Duplicate Placement**: `findNodeAtPosition` prevents building over existing nodes; `getEdgesBetweenNodes` stops duplicate edges.
- **Demolition Safety**: Node removal collects unique `visualEntityId`s before mutation, ensuring meshes are only removed once.
- **Reactivity**: `version` increments after each mutation so hover validation recomputes.
- **Fallbacks**: If removal cannot find a registered entity, it logs a warning (future improvement) but continues cleanup to keep graph consistent.

## Testing Strategy
- Manual: place sequential rail tiles, ensure edges connect; place road tiles separately; add station/depot and verify mesh; demolish structures and ensure ghost becomes valid again.
- Automated: extend future Vitest coverage for `useNetworkStore` helpers (deferred for follow-up due to heavy 3D dependencies).

## Risks & Mitigations
- **Mesh Orientation Errors**: Use axis-aligned checks (Δx vs Δz) to select rotation and geometry dimensions.
- **State Drift**: Registry ensures each graph edge/building has matching ECS entity for deterministic cleanup.
- **Performance**: Graph size small; reactivity via simple version counter avoids expensive deep comparisons.

## Decision Log
- Store graph in Zustand rather than React context to reuse existing state tooling and devtools.
- Represent track visuals with scaled box geometries for now—future work can replace with instanced meshes.
- Automatically connect only cardinal neighbors exactly one grid unit away to maintain grid topology (diagonals deferred).

## Next Steps
1. Implement `useNetworkStore` slice + registry helpers.
2. Enhance `useConstructionMode` with placement/demolition logic and validity checks.
3. Update `SceneGraph` to respect renderable metadata for new meshes.
4. Validate ghost preview behavior across tool changes.
