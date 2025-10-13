# TASK010 - Signaling system & diagonal track support

## Summary

Implement directional rail signaling with UI controls, ensure trains respect signal-controlled blocks, and allow diagonal track/road junctions with proper rendering.

## Requirements

- R25 Signal Placement & Visualization
- R26 Signal Removal Workflow
- R27 Signal-Constrained Train Movement
- R28 Diagonal Track Connectivity

## Design Reference

- DESIGN010-signaling-and-diagonal-tracks.md

## Confidence Assessment

- **Confidence**: 0.72 (Medium)
- **Rationale**: Signal gating touches the vehicle route state machine and requires new geometry math, both moderately complex but within existing architecture patterns.

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

## Notes

- Consider logging blocked states in debug panel in future iteration.
- 2025-10-20: Added modifier-based signal orientation controls (Shift toggles
  reverse direction, Alt mirrors placement) with in-place updates when clicking
  existing signals.
- 2025-10-21: Preview overlays show future rail/road connections, service radii,
  and settlement stats while using construction or query tools.
