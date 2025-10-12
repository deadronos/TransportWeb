# [TASK005] - Path Following & Vehicle Motion Details (Subtask 3.5)

**Status:** Pending
**Added:** 2025-10-15

## Goal

Implement detailed vehicle path following behavior including acceleration/deceleration profiles, station stopping/dwell behavior, interpolation along edges, and deterministic update rules in the fixed timestep loop.

## Success Criteria

- Vehicles smoothly interpolate between nodes and respect edge lengths and speed limits.
- Acceleration and braking behavior follow configurable params (accel, maxSpeed) and are deterministic under the fixed timestep.
- Vehicles stop at destination nodes for a configurable dwell time and update route state correctly.
- Removing edges mid-travel triggers safe route invalidation and edge reservation release.
- Unit tests cover edge cases: multiple vehicles on same route, capacity-1 edges, mid-route edge removal, and dwell timing.

## Implementation Plan

1. Design `VehicleMotion` helper utilities for interpolation and speed profile calculations.
2. Extend `advanceVehicleSimulation` to use motion helpers (separate concerns: routing vs motion).
3. Add tests for acceleration/deceleration timing and arrival/dwell semantics.
4. Add deterministic seeds/fixtures for repeatable multi-vehicle tests.
5. Document API changes and update memory progress items.

## Notes

- This task depends on completed pathfinding & reservation logic (TASK004).
- Prioritize determinism (fixed timestep) and small unit-testable functions.
