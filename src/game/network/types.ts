/**
 * Network graph types for transport network management.
 * Represents the logical structure of tracks, roads, stations, and their connections.
 */

export type NodeType = "junction" | "station" | "depot" | "waypoint";
export type TrackType = "rail" | "road";
export type SignalDirection = "forward" | "backward";

/**
 * Represents a point in the network where tracks connect or vehicles stop.
 */
export interface NetworkNode {
  /** Unique identifier */
  id: string;
  /** World position [x, y, z] */
  position: [number, number, number];
  /** Type determines behavior (junction, station, depot, waypoint) */
  type: NodeType;
  /** IDs of edges connected to this node */
  connections: string[];
  /** Optional metadata (station name, depot capacity, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a connection between two nodes (track segment or road).
 */
export interface NetworkEdge {
  /** Unique identifier */
  id: string;
  /** Source node ID */
  fromNode: string;
  /** Destination node ID */
  toNode: string;
  /** Track or road type */
  trackType: TrackType;
  /** Length in world units */
  length: number;
  /** Maximum speed (units per second) */
  speedLimit: number;
  /** How many vehicles can occupy this edge simultaneously */
  capacity: number;
  /** IDs of vehicles currently on this edge */
  occupied: string[];
  /** Link to ECS entity for rendering */
  visualEntityId: string | null;
  /** Optional metadata (terrain type, construction cost, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a signal guarding travel along a directed edge.
 */
export interface NetworkSignal {
  /** Unique identifier */
  id: string;
  /** Directed edge this signal controls */
  edgeId: string;
  /** Direction of travel (relative to owning edge) */
  direction: SignalDirection;
  /** World position [x, y, z] */
  position: [number, number, number];
  /** Rotation around Y axis for visualization */
  rotationY: number;
  /** Linked renderable entity */
  visualEntityId: string | null;
  /** Optional metadata (e.g., placement mode) */
  metadata?: Record<string, unknown>;
}

/**
 * Serializable representation of the network graph.
 */
export interface NetworkGraphData {
  version: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  signals: NetworkSignal[];
}

/**
 * Statistics about the network graph.
 */
export interface NetworkStats {
  nodeCount: number;
  edgeCount: number;
  totalLength: number;
  railLength: number;
  roadLength: number;
  stationCount: number;
  depotCount: number;
  junctionCount: number;
}
