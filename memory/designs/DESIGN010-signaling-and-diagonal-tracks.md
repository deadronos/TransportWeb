# DESIGN010 - Signaling System & Diagonal Track Support

## Summary

- Introduce directional rail signals that gate vehicle movement via block reservations.
- Extend construction tooling with a signal placement/removal workflow and diagonal adjacency detection.
- Update rendering and ECS systems to visualize signals and rotate track meshes for diagonal segments.

## Requirements Mapping

- R25 Signal Placement & Visualization
- R26 Signal Removal Workflow
- R27 Signal-Constrained Train Movement
- R28 Diagonal Track Connectivity

## Architecture Overview

1. **Network Graph Enhancements**
   - Maintain a `Map<string, NetworkSignal>` keyed by signal ID and an index by `edgeId`.
   - Extend serialization (`toJSON`/`fromJSON`) to include signal records.
   - Ensure node/edge removal cascades to attached signals.

2. **State Management**
   - Augment `useNetworkStore` with `addSignal`, `removeSignal`, and lookup helpers.
   - Reuse existing visual entity registry for signal meshes.

3. **Construction Tooling**
   - Expand `ConstructionTool` union to include `"signal"`.
   - In `useConstructionMode`, branch logic for signal placement:
     - Raycast world position without hard grid snapping.
     - Scan rail edges for the nearest directional candidate (offset from `fromNode`).
     - Toggle signal presence on click (add if absent, remove if present).
     - Publish ghost preview state using candidate position + rotation.
   - Update `GhostPreview` to render signal preview geometry.

4. **Rendering**
   - Register a new renderable kind `"signal"` with a slim pole mesh + emissive head color.
   - Rotate track segment entities via `atan2` so diagonals display correctly.

5. **Vehicle Simulation**
   - Extend route state machine with a `"blocked"` state and `blockedEdgeId` marker.
   - Before traversing an edge, evaluate `isSignalBlockClear(route, edgeId, vehicleId)`:
     - If a signal guards the edge and another vehicle occupies any edge before the next signal, hold the vehicle.
     - Resume movement when the block clears without dropping reservations.
   - Treat block checks as no-ops if no signal exists for the edge.

6. **Adjacency Detection**
   - Extract neighbor compatibility into `network/utils.ts` for shared use + unit tests.
   - Permit diagonal offsets (`dx === dz === gridSize`) alongside cardinal neighbors.

## Data Model Updates

```ts
export type SignalDirection = "forward";
// Direction inferred from owning edge; explicit enum retained for future-proofing.

export interface NetworkSignal {
  id: string;
  edgeId: string;
  direction: SignalDirection;
  position: [number, number, number];
  rotationY: number;
  visualEntityId: string | null;
  metadata?: Record<string, unknown>;
}
```

- `NetworkGraphData` gains a `signals: NetworkSignal[]` array.
- Signal position sits slightly above terrain, offset laterally from the track.

## Block Evaluation Algorithm

1. Given `route` and `edgeId`, identify the index of `edgeId` within `route.path.edges`.
2. Walk forward through `route.path.edges` accumulating edges until encountering another signal (exclusive) or reaching the path end.
3. For each edge in the block, check `edge.occupied` for IDs other than the current vehicle.
4. Block is clear iff no conflicting occupancy exists.

## Error Handling

- `addSignal` validates edge existence and prevents duplicate signals on the same edge.
- Signal placement gracefully aborts when no rail segment is within threshold distance.
- Vehicle block checks treat missing nodes/edges as a failure, reverting to existing reroute/clear logic.

## Testing Strategy

- **Unit**
  - `NetworkGraph` signal CRUD + cascading removal.
  - `network/utils` neighbor compatibility (cardinal + diagonal).
  - Block evaluation helper ensuring proper gating conditions.
- **Integration**
  - `vehicleRoutes.test.ts` scenario with two trains and a signal verifying blocked state + resume.
- **UI**
  - Extend existing construction mode tests via React Testing Library? (None currently); rely on hook-level behavior combined with store state assertions where feasible.

## Implementation Tasks

1. Update requirements/design/task artifacts (this doc, TASK010, requirements R25-R28).
2. Extend types/state/graph structures for signals + diagonal utilities.
3. Implement signal placement logic & UI adjustments (TopMenuBar, GhostPreview).
4. Integrate signal gating into vehicle simulation and ensure diagonal mesh rotation.
5. Author unit/integration tests; run lint, type-check, format, and test suites.
6. Document any follow-up debt in memory/progress if necessary.

## Open Questions / Future Work

- Whether to support two-way (paired) signal placement via modifier keys.
- Visual differentiation between block vs. path signals.
- Potential performance tuning for dense signal scanning (currently O(E)).
