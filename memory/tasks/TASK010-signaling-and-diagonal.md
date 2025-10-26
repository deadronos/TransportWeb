# TASK010 - Signaling system & diagonal track support

**Status:** Completed  
**Added:** 2025-10-20  
**Completed:** 2025-10-26

## Summary

Implement directional rail signaling with UI controls, ensure trains respect signal-controlled blocks, and allow diagonal track/road junctions with proper rendering.

## Requirements

- ✅ R25 Signal Placement & Visualization
- ✅ R26 Signal Removal Workflow
- ✅ R27 Signal-Constrained Train Movement
- ✅ R28 Diagonal Track Connectivity

## Design Reference

- DESIGN010-signaling-and-diagonal-tracks.md

## Confidence Assessment

- **Confidence**: 1.0 (Complete)
- **Rationale**: All features verified as implemented and tested. Signal system integrated with vehicle routing, diagonal connectivity working as designed.

## Plan

1. **Graph & Types**
   - Add `NetworkSignal` model, graph storage, serialization, and cleanup logic.
   - Update network store interface to expose signal CRUD helpers.
2. **Construction Tooling**
   - Extend construction slice to include `signal` tool.
   - Refactor `useConstructionMode` to compute diagonal-compatible neighbors and signal candidates.
   - Update ghost preview + TopMenuBar for the new tool.
3. **Rendering**
   - Introduce signal renderable kind and color palette entry.
   - Ensure track meshes rotate for diagonal segments.
4. **Vehicle Simulation**
   - Add block evaluation helpers and integrate signal checks into movement loop.
   - Introduce `blocked` state with resume logic when blocks clear.
5. **Testing & Validation**
   - Unit tests for graph signal operations and adjacency utils.
   - Integration test for vehicle blocking/resume scenario.
   - Run formatter, ESLint, TypeScript, and Vitest.

## Dependencies

- Existing network graph and vehicle routing systems (no external blockers identified).

## Exit Criteria

- Signals can be placed/removed visually on rails via UI.
- Vehicles wait at occupied signal blocks and continue once cleared.
- Diagonal rails/roads connect with rotated geometry and accurate graph metrics.
- All new logic covered by automated tests.

## Completion Report (2025-10-26)

### Implementation Verification

All features from the original plan have been successfully implemented and verified:

1. **Graph & Types** ✅
   - `NetworkSignal` interface defined in `types.ts` with all required fields
   - Graph storage using `Map<string, NetworkSignal>` and `signalsByEdge` index
   - Serialization in `toJSON()` includes signals array
   - Deserialization in `fromJSON()` restores signals with validation
   - Cascading deletion: signals removed when parent edge is deleted

2. **Construction Tooling** ✅
   - Construction slice extended with `"signal"` tool type
   - `useConstructionMode` handles signal placement with candidate detection
   - Ghost preview updates show signal position and rotation
   - TopMenuBar displays signal tool (🚦) with hotkey "L"

3. **Rendering** ✅
   - Signal renderable kind registered in ECS world types
   - Color palette includes signal yellow (#ffcc33)
   - SceneGraph renders signals as boxes with correct dimensions
   - Track meshes properly rotated for diagonal segments via `calculateYaw()`

4. **Vehicle Simulation** ✅
   - `isSignalBlockClear()` function evaluates block occupancy (lines 122-155)
   - Vehicles enter "blocked" state when signal block is occupied
   - Resume logic in main loop checks clearance every frame
   - Blocked vehicles maintain zero speed and update logistics status

5. **Testing & Validation** ✅
   - Unit tests in `graph.test.ts` cover signal CRUD operations
   - `utils.test.ts` validates diagonal neighbor detection
   - `vehicleRoutes.test.ts` includes signal blocking scenario
   - All 37+ tests passing, TypeScript compilation clean

### Code Locations

- Types: `src/game/network/types.ts` (lines 8, 55-70, 79)
- Graph: `src/game/network/graph.ts` (lines 17-18, 169-245, 386, 417-425)
- Store: `src/game/state/slices/network.ts` (lines 20-21, 58-64, 74-75)
- Construction: `src/game/state/slices/construction.ts` (line 10)
- Hook: `src/game/hooks/useConstructionMode.ts` (lines 586-677, 939-1005)
- UI: `src/game/ui/TopMenuBar.tsx` (line 22)
- Rendering: `src/game/SceneGraph.tsx` (line 20), `src/game/ecs/world.tsx` (line 23)
- Preview: `src/game/scene/GhostPreview.tsx` (lines 93-115)
- Simulation: `src/game/ecs/systems/vehicleRoutes.ts` (lines 122-155, 233-251, 545-562)
- Utils: `src/game/network/utils.ts` (lines 96-128, 172-179, 184-207)

### Features Verified

- ✅ Signals can be placed on rail edges via signal tool
- ✅ Shift modifier reverses signal direction
- ✅ Alt modifier mirrors signal placement side
- ✅ Clicking existing signal updates position/rotation
- ✅ Clicking with same modifiers removes signal
- ✅ Ghost preview shows signal candidate location
- ✅ Vehicles detect signals on edges they're about to traverse
- ✅ Blocked vehicles wait at signals until block clears
- ✅ Diagonal tracks connect with proper geometry rotation
- ✅ Signal data persists in graph serialization

## Notes

- Consider logging blocked states in debug panel in future iteration.
- 2025-10-20: Added modifier-based signal orientation controls (Shift toggles
  reverse direction, Alt mirrors placement) with in-place updates when clicking
  existing signals.
- 2025-10-21: Preview overlays show future rail/road connections, service radii,
  and settlement stats while using construction or query tools.
- 2025-10-26: Task completed - all requirements verified as implemented and tested.
