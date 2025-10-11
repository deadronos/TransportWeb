# Phase 3: Network & Movement System - Planning Document

## Overview

**Goal**: Implement a graph-based network system that allows vehicles to pathfind and travel along player-built tracks and roads.

**Prerequisites**: ✅ Phase 2 complete (Interactive construction system operational)

**Status**: Planning

## Core Requirements

### 1. Network Graph Structure

- Represent tracks/roads as a directed graph
- Nodes represent junctions, stations, and decision points
- Edges represent track/road segments with properties:
  - Length (for travel time calculation)
  - Capacity (for block signaling)
  - Track type (rail/road)
  - Speed limit
  - Current occupancy

### 2. Pathfinding System

- A\* algorithm for shortest path calculation
- Block reservation system (prevent collisions)
- Dynamic rerouting when blocks are occupied
- Path caching for performance

### 3. Track/Road Placement

- Convert ghost preview clicks into actual network segments
- Create ECS entities for visual representation
- Update network graph with new connections
- Validate placement (no overlaps, proper connections)

### 4. Vehicle Movement

- Follow paths returned by pathfinding
- Smooth interpolation between waypoints
- Acceleration/deceleration physics
- Station stopping behavior

## Architecture Design

### Network Graph Data Structure

```typescript
interface NetworkNode {
  id: string;
  position: [number, number, number];
  type: "junction" | "station" | "depot" | "waypoint";
  connections: string[]; // Edge IDs
}

interface NetworkEdge {
  id: string;
  fromNode: string;
  toNode: string;
  trackType: "rail" | "road";
  length: number;
  speedLimit: number;
  capacity: number; // How many vehicles can occupy this edge
  occupied: string[]; // Vehicle IDs currently on this edge
  visualEntityId: string; // Link to ECS entity for rendering
}

interface NetworkGraph {
  nodes: Map<string, NetworkNode>;
  edges: Map<string, NetworkEdge>;
}
```

### ECS Components

```typescript
// New components for network infrastructure
interface Track {
  edgeId: string; // Link to network graph
  trackType: "rail" | "road";
  startPos: [number, number, number];
  endPos: [number, number, number];
}

interface Station {
  nodeId: string; // Link to network graph
  platforms: number;
  capacity: number;
  currentOccupancy: number;
}

// Enhanced vehicle component
interface Vehicle {
  speed: number;
  maxSpeed: number;
  accel: number;
  type: "train" | "truck" | "bus";
  currentPath: string[]; // Node IDs
  currentEdgeIndex: number;
  targetNodeId: string | null;
}
```

### State Management

```typescript
// New Zustand slice for network management
interface NetworkState {
  graph: NetworkGraph;
  selectedNodeId: string | null;
  highlightedPath: string[] | null;

  addNode: (node: NetworkNode) => void;
  addEdge: (edge: NetworkEdge) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  findPath: (fromId: string, toId: string) => string[] | null;
}
```

## Implementation Plan (TASK003)

### Subtask 3.1: Network Graph Core

- Create `src/game/network/graph.ts` with NetworkGraph class
- Implement add/remove node/edge methods
- Create graph serialization (for save/load)
- Add graph visualization helper (debug mode)

### Subtask 3.2: Pathfinding System

- Create `src/game/network/pathfinding.ts` with A\* implementation
- Implement block reservation system
- Add path caching for performance
- Create pathfinding visualization (debug arrows)

### Subtask 3.3: Track/Road Placement

- Modify `useConstructionMode` to create network entities
- Implement automatic node creation at junctions
- Add edge creation between connected segments
- Validate placement (snap to existing nodes, prevent overlaps)

### Subtask 3.4: ECS Integration

- Create Track and Station ECS components
- Update simulation system to handle pathfinding
- Create mesh generation for tracks/roads (replace ghost preview boxes)
- Add station building models

### Subtask 3.5: Vehicle Pathfinding

- Enhance Vehicle component with path state
- Implement path-following movement system
- Add waypoint interpolation
- Create station stopping behavior

### Subtask 3.6: Network State Management

- Create Zustand network slice
- Integrate with construction tools
- Add network debugging UI (node/edge inspector)
- Persist network graph to localStorage

### Subtask 3.7: Visual Improvements

- Replace track preview boxes with proper rail meshes
- Add road texture/material
- Create station building models
- Add waypoint markers for debugging

### Subtask 3.8: Testing & Validation

- Unit tests for graph operations
- Unit tests for A\* pathfinding
- E2E test: place track, spawn vehicle, verify movement
- Performance test: 100+ vehicles with pathfinding

## Technical Decisions to Make

### 1. Graph Topology

**Question**: How to handle track curves and diagonal connections?

**Options**:

- A) Grid-aligned only (4-directional: N/S/E/W)
- B) 8-directional (add diagonals)
- C) Free-form curves with Bezier splines

**Recommendation**: Start with A (grid-aligned), add B (diagonals) in polish phase, defer C to future version.

### 2. Pathfinding Performance

**Question**: When to recalculate paths?

**Options**:

- A) Every frame (expensive but most dynamic)
- B) On demand when vehicle spawns or route blocked
- C) Precomputed paths with lazy recalculation

**Recommendation**: B (on demand) with path caching. Only recalculate when:

- Vehicle spawns at station
- Current path blocked by another vehicle
- Network topology changes (new track placed)

### 3. Block Signaling

**Question**: How to prevent vehicle collisions?

**Options**:

- A) Simple edge capacity (max N vehicles per edge)
- B) Proper block signaling with signals and reservations
- C) Collision detection with dynamic avoidance

**Recommendation**: Start with A (simple capacity), upgrade to B (block signaling) in Phase 4.

### 4. Network Serialization

**Question**: How to save/load network graphs?

**Options**:

- A) Store full graph in localStorage as JSON
- B) Reconstruct graph from placed track entities
- C) Hybrid: store graph + validate against entities

**Recommendation**: C (hybrid). Store graph for fast load, validate against ECS entities for consistency.

## Success Criteria

- [ ] Can place connected track segments that form a network
- [ ] Can spawn vehicle at depot/station
- [ ] Vehicle pathfinds to destination station
- [ ] Vehicle follows track visually
- [ ] Multiple vehicles don't collide
- [ ] Network persists on page reload
- [ ] 60fps maintained with 20+ vehicles
- [ ] Debug UI shows graph structure

## Estimated Effort

- **Subtasks**: 8
- **Total Complexity**: High (involves graph algorithms, physics, ECS coordination)
- **Estimated Time**: 4-6 sessions
- **Dependencies**: None (Phase 2 complete)

## References

- [A\* Pathfinding Explanation](https://www.redblobgames.com/pathfinding/a-star/introduction.html)
- [Transport Tycoon Network System](https://wiki.openttd.org/en/Manual/Railway%20construction)
- [Block Signaling](https://wiki.openttd.org/en/Manual/Signals)

## Next Actions

1. Review this plan with user
2. Create TASK003 in memory bank
3. Start with subtask 3.1 (Network Graph Core)
4. Iterate with user feedback

---

**Created**: 2025-10-11  
**Status**: Draft - Awaiting approval  
**Estimated Start**: After TASK002 celebration 🎉
