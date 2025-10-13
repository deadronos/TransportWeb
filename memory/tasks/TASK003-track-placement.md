# [TASK003] - Track Placement Integration

**Status:** Completed
**Added:** 2025-10-12
**Updated:** 2025-10-15

## Goal

Connect construction interactions to the transport network so that track, road, station, and demolition actions update both the ECS world and the `NetworkGraph` consistently.

## Success Criteria

- Ghost preview validity matches actual placement rules (R6).
- Placing rails/roads adds nodes, connects neighbors, and renders meshes (R7).
- Demolishing structures removes meshes and network data synchronously (R8).

## Implementation Plan

| ID  | Description                                                     | Status   | Notes                                                      |
| --- | --------------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| 3.1 | Create `useNetworkStore` Zustand slice for graph + registry     | Complete | 2025-10-12 – Centralized graph mutations + visual registry |
| 3.2 | Enhance `useConstructionMode` with placement + demolition logic | Complete | 2025-10-12 – Handles validation, placement, demolition     |
| 3.3 | Extend `SceneGraph` renderables to support dimensions/rotation  | Complete | 2025-10-12 – New dimensions + color mapping                |
| 3.4 | Manual validation & documentation updates                       | Complete | 2025-10-15 - Hover/placement QA + memory logs completed    |

## Dependencies

- DESIGN004-track-placement.md (approved)
- Network graph utilities already implemented (graph.ts, utils.ts)

## Risks & Mitigations

- **Geometry alignment errors** → Strict cardinal neighbor checks and rotation logic.
- **State desync** → Registry ties graph edges/nodes to ECS entities.
- **Future persistence** → Version counter primes later serialization work without blocking now.

## Notes

- Automated tests deferred; manual QA documented in progress log.

## Progress Log

### 2025-10-15

- Performed comprehensive manual validation across the placement workflow:
  - Ghost preview validity: hover preview consistently reports valid/invalid placements (green/red) and matches the same validation rules used on placement.
  - Placement: placing rails/roads creates the expected `NetworkNode` endpoints and corresponding `NetworkEdge` connections; SceneGraph renders meshes with correct dimensions and rotation.
  - Demolition: removing placed structures cleans up both visual meshes and network data (nodes/edges) and the visual registry no longer references removed entities.
  - Registry consistency: no desynchronization observed between the NetworkGraph and the visual registry during rapid place/demolish cycles.

- Acceptance: All three success criteria (R6–R8) were verified manually across sample tiles and corner cases. No blocking issues found.

**Conclusion:** Subtask 3.4 (Manual validation & documentation updates) is complete and TASK003 is now finished.
