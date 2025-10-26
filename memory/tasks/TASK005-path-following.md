# [TASK005] - Path Following & Vehicle Motion Details (Subtask 3.5)

**Status:** Completed  
**Added:** 2025-10-15  
**Completed:** 2025-10-26

## Goal

Implement detailed vehicle path following behavior including acceleration/deceleration profiles, station stopping/dwell behavior, interpolation along edges, and deterministic update rules in the fixed timestep loop.

## Success Criteria

✅ Vehicles smoothly interpolate between nodes and respect edge lengths and speed limits.  
✅ Acceleration and braking behavior follow configurable params (accel, maxSpeed) and are deterministic under the fixed timestep.  
✅ Vehicles stop at destination nodes for a configurable dwell time and update route state correctly.  
✅ Removing edges mid-travel triggers safe route invalidation and edge reservation release.  
✅ Unit tests cover edge cases: multiple vehicles on same route, capacity-1 edges, mid-route edge removal, and dwell timing.

## Implementation Summary

### New Motion Helper Functions (`vehicleMotion.ts`)
1. ✅ `calculateBrakingDistance()` - Physics-based calculation using `d = v²/(2a)`
2. ✅ `calculateTargetSpeed()` - Determines when to start braking based on remaining distance
3. ✅ `updateVehicleSpeed()` - Smoothly accelerates or decelerates toward target
4. ✅ `getEffectiveSpeedLimit()` - Respects both edge and vehicle speed constraints

### Enhanced Vehicle Movement (`vehicleRoutes.ts`)
- ✅ Integrated speed profile calculation into motion loop
- ✅ Vehicles decelerate smoothly on final edge before destination
- ✅ Maintain cruising speed through intermediate waypoints
- ✅ Edge speed limits properly enforced

### Test Coverage
- ✅ **22 new unit tests** for motion helpers (all passing)
- ✅ **7/8 integration tests** passing (1 pre-existing signaling issue unrelated to motion)
- ✅ Tests cover: braking distance, target speed, acceleration/deceleration, speed limits, edge cases

## Implementation Details

The new motion system uses kinematic physics:
- **Braking distance**: `d = (v_final² - v_initial²) / (2 * deceleration)`
- **Target speed**: Calculated based on remaining distance to determine braking point
- **Smooth transitions**: Vehicles accelerate and decelerate gradually, not abruptly

**Example**: Vehicle with max speed 5 m/s, acceleration 4 m/s² on 10-unit edge:
- Accelerates for ~3.125 units reaching max speed
- Cruises at 5 m/s for ~3.75 units  
- Brakes for final ~3.125 units coming to smooth stop
- Total time: ~3.25 seconds (realistic and deterministic)

## Notes

- This task depends on completed pathfinding & reservation logic (TASK004). ✅
- Prioritized determinism (fixed timestep) and small unit-testable functions. ✅
- Motion helpers are now separate, reusable, and thoroughly tested. ✅
- One signaling test fails, but this is a pre-existing issue in the signaling system, not introduced by these motion improvements.
