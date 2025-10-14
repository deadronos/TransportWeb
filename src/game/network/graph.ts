import type {
  NetworkNode,
  NetworkEdge,
  NetworkGraphData,
  NetworkStats,
  NetworkSignal,
  SignalDirection,
} from "./types";

/**
 * Graph-based network structure for managing transport infrastructure.
 * Provides CRUD operations, pathfinding support, and serialization.
 */
export class NetworkGraph {
  private nodes: Map<string, NetworkNode>;
  private edges: Map<string, NetworkEdge>;
  private signals: Map<string, NetworkSignal>;
  private signalsByEdge: Map<string, Set<string>>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.signals = new Map();
    this.signalsByEdge = new Map();
  }

  // ============================================================================
  // Node Operations
  // ============================================================================

  /**
   * Add a node to the graph.
   * @throws Error if node with same ID already exists
   */
  addNode(node: NetworkNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with id ${node.id} already exists`);
    }
    this.nodes.set(node.id, { ...node, connections: [] });
  }

  /**
   * Get a node by ID.
   */
  getNode(id: string): NetworkNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Remove a node and all connected edges.
   */
  removeNode(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    // Remove all edges connected to this node
    for (const edgeId of [...node.connections]) {
      this.removeEdge(edgeId);
    }

    // Remove edges that reference this node from other nodes
    for (const edge of [...this.edges.values()]) {
      if (edge.fromNode === id || edge.toNode === id) {
        this.removeEdge(edge.id);
      }
    }

    this.nodes.delete(id);
  }

  /**
   * Get all nodes.
   */
  getAllNodes(): NetworkNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes by type.
   */
  getNodesByType(type: NetworkNode["type"]): NetworkNode[] {
    return this.getAllNodes().filter((node) => node.type === type);
  }

  // ============================================================================
  // Edge Operations
  // ============================================================================

  /**
   * Add an edge to the graph.
   * @throws Error if edge with same ID already exists or nodes don't exist
   */
  addEdge(edge: NetworkEdge): void {
    if (this.edges.has(edge.id)) {
      throw new Error(`Edge with id ${edge.id} already exists`);
    }

    const fromNode = this.nodes.get(edge.fromNode);
    const toNode = this.nodes.get(edge.toNode);

    if (!fromNode) {
      throw new Error(`Source node ${edge.fromNode} does not exist`);
    }
    if (!toNode) {
      throw new Error(`Destination node ${edge.toNode} does not exist`);
    }

    // Add edge to graph (initialize occupied if not provided)
    this.edges.set(edge.id, { ...edge, occupied: edge.occupied ?? [] });

    // Update node connections
    if (!fromNode.connections.includes(edge.id)) {
      fromNode.connections.push(edge.id);
    }
    if (!toNode.connections.includes(edge.id)) {
      toNode.connections.push(edge.id);
    }
  }

  /**
   * Get an edge by ID.
   */
  getEdge(id: string): NetworkEdge | undefined {
    return this.edges.get(id);
  }

  /**
   * Remove an edge from the graph.
   */
  removeEdge(id: string): void {
    const edge = this.edges.get(id);
    if (!edge) return;

    // Remove from node connections
    const fromNode = this.nodes.get(edge.fromNode);
    const toNode = this.nodes.get(edge.toNode);

    if (fromNode) {
      fromNode.connections = fromNode.connections.filter(
        (connId) => connId !== id,
      );
    }
    if (toNode) {
      toNode.connections = toNode.connections.filter((connId) => connId !== id);
    }

    this.edges.delete(id);

    // Remove attached signals
    const signalIds = this.signalsByEdge.get(id);
    if (signalIds) {
      for (const signalId of signalIds) {
        this.signals.delete(signalId);
      }
      this.signalsByEdge.delete(id);
    }
  }

  /**
   * Get all edges.
   */
  getAllEdges(): NetworkEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Add a signal guarding a directed edge.
   */
  addSignal(signal: NetworkSignal): void {
    if (this.signals.has(signal.id)) {
      throw new Error(`Signal with id ${signal.id} already exists`);
    }

    const edge = this.edges.get(signal.edgeId);
    if (!edge) {
      throw new Error(`Edge ${signal.edgeId} does not exist`);
    }

    const existing = this.getSignalsForEdge(signal.edgeId).find(
      (candidate) => candidate.direction === signal.direction,
    );
    if (existing) {
      throw new Error(
        `Signal already exists for edge ${signal.edgeId} direction ${signal.direction}`,
      );
    }

    this.signals.set(signal.id, signal);
    if (!this.signalsByEdge.has(signal.edgeId)) {
      this.signalsByEdge.set(signal.edgeId, new Set());
    }
    this.signalsByEdge.get(signal.edgeId)?.add(signal.id);
  }

  /**
   * Remove a signal by ID.
   */
  removeSignal(signalId: string): void {
    const signal = this.signals.get(signalId);
    if (!signal) return;

    const set = this.signalsByEdge.get(signal.edgeId);
    if (set) {
      set.delete(signalId);
      if (set.size === 0) {
        this.signalsByEdge.delete(signal.edgeId);
      }
    }

    this.signals.delete(signalId);
  }

  /**
   * Get a signal by ID.
   */
  getSignal(signalId: string): NetworkSignal | undefined {
    return this.signals.get(signalId);
  }

  /**
   * Get all signals for a given edge.
   */
  getSignalsForEdge(
    edgeId: string,
    direction?: SignalDirection,
  ): NetworkSignal[] {
    const ids = this.signalsByEdge.get(edgeId);
    if (!ids) return [];

    const results: NetworkSignal[] = [];
    for (const id of ids) {
      const signal = this.signals.get(id);
      if (!signal) continue;
      if (direction && signal.direction !== direction) continue;
      results.push(signal);
    }
    return results;
  }

  /**
   * Get all signals in the graph.
   */
  getAllSignals(): NetworkSignal[] {
    return Array.from(this.signals.values());
  }

  /**
   * Get all edges connected to a node.
   */
  getConnectedEdges(nodeId: string): NetworkEdge[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    return node.connections
      .map((edgeId) => this.edges.get(edgeId))
      .filter((edge): edge is NetworkEdge => edge !== undefined);
  }

  /**
   * Get edges between two specific nodes.
   */
  getEdgesBetweenNodes(nodeA: string, nodeB: string): NetworkEdge[] {
    return this.getAllEdges().filter(
      (edge) =>
        (edge.fromNode === nodeA && edge.toNode === nodeB) ||
        (edge.fromNode === nodeB && edge.toNode === nodeA),
    );
  }

  /**
   * Find the reverse edge (opposite direction) for a given edge.
   */
  getReverseEdge(edgeId: string): NetworkEdge | undefined {
    const edge = this.edges.get(edgeId);
    if (!edge) {
      return undefined;
    }

    const candidates = this.getEdgesBetweenNodes(edge.toNode, edge.fromNode);
    return candidates.find(
      (candidate) =>
        candidate.fromNode === edge.toNode &&
        candidate.toNode === edge.fromNode &&
        candidate.trackType === edge.trackType,
    );
  }

  // ============================================================================
  // Graph Queries
  // ============================================================================

  /**
   * Get neighboring nodes (directly connected).
   */
  getNeighbors(nodeId: string): NetworkNode[] {
    const edges = this.getConnectedEdges(nodeId);
    const neighborIds = new Set<string>();

    for (const edge of edges) {
      if (edge.fromNode === nodeId) {
        neighborIds.add(edge.toNode);
      }
      if (edge.toNode === nodeId) {
        neighborIds.add(edge.fromNode);
      }
    }

    return Array.from(neighborIds)
      .map((id) => this.nodes.get(id))
      .filter((node): node is NetworkNode => node !== undefined);
  }

  /**
   * Get neighboring nodes with edge information (for pathfinding).
   */
  getNeighborsWithEdges(
    nodeId: string,
  ): Array<{ nodeId: string; edgeId: string }> {
    const edges = this.getConnectedEdges(nodeId);
    const neighbors: Array<{ nodeId: string; edgeId: string }> = [];

    for (const edge of edges) {
      if (edge.fromNode === nodeId) {
        neighbors.push({ nodeId: edge.toNode, edgeId: edge.id });
      }
      if (edge.toNode === nodeId) {
        neighbors.push({ nodeId: edge.fromNode, edgeId: edge.id });
      }
    }

    return neighbors;
  }

  /**
   * Check if two nodes are directly connected.
   */
  areNodesConnected(nodeA: string, nodeB: string): boolean {
    return this.getEdgesBetweenNodes(nodeA, nodeB).length > 0;
  }

  /**
   * Get statistics about the network.
   */
  getStats(): NetworkStats {
    const nodes = this.getAllNodes();
    const edges = this.getAllEdges();

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      totalLength: edges.reduce((sum, edge) => sum + edge.length, 0),
      railLength: edges
        .filter((e) => e.trackType === "rail")
        .reduce((sum, edge) => sum + edge.length, 0),
      roadLength: edges
        .filter((e) => e.trackType === "road")
        .reduce((sum, edge) => sum + edge.length, 0),
      stationCount: nodes.filter((n) => n.type === "station").length,
      depotCount: nodes.filter((n) => n.type === "depot").length,
      junctionCount: nodes.filter((n) => n.type === "junction").length,
    };
  }

  /**
   * Clear all nodes and edges.
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.signals.clear();
    this.signalsByEdge.clear();
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Serialize graph to JSON.
   */
  toJSON(): NetworkGraphData {
    return {
      version: 1,
      nodes: this.getAllNodes(),
      edges: this.getAllEdges(),
      signals: this.getAllSignals(),
    };
  }

  /**
   * Deserialize graph from JSON.
   * @param data Serialized graph data
   * @param validate If true, validates graph integrity and logs warnings
   */
  static fromJSON(data: NetworkGraphData, validate = true): NetworkGraph {
    const graph = new NetworkGraph();

    // Add all nodes first
    for (const node of data.nodes) {
      try {
        graph.addNode(node);
      } catch (error) {
        console.warn(`Failed to add node ${node.id}:`, error);
      }
    }

    // Add all edges
    for (const edge of data.edges) {
      try {
        graph.addEdge(edge);
      } catch (error) {
        console.warn(`Failed to add edge ${edge.id}:`, error);
      }
    }

    // Add all signals
    if (Array.isArray(data.signals)) {
      for (const signal of data.signals) {
        try {
          graph.addSignal(signal);
        } catch (error) {
          console.warn(`Failed to add signal ${signal.id}:`, error);
        }
      }
    }

    if (validate) {
      graph.validateIntegrity();
    }

    return graph;
  }

  /**
   * Validate graph integrity and log warnings for issues.
   */
  private validateIntegrity(): void {
    let issueCount = 0;

    // Check for dangling edges (reference non-existent nodes)
    for (const edge of this.edges.values()) {
      if (!this.nodes.has(edge.fromNode)) {
        console.warn(
          `Edge ${edge.id} references non-existent fromNode ${edge.fromNode}`,
        );
        issueCount++;
      }
      if (!this.nodes.has(edge.toNode)) {
        console.warn(
          `Edge ${edge.id} references non-existent toNode ${edge.toNode}`,
        );
        issueCount++;
      }
    }

    // Check for disconnected nodes (no connections but should have some)
    for (const node of this.nodes.values()) {
      if (node.type !== "waypoint" && node.connections.length === 0) {
        console.warn(`Node ${node.id} (${node.type}) has no connections`);
        issueCount++;
      }
    }

    // Check for dangling signals (edge removed)
    for (const signal of this.signals.values()) {
      if (!this.edges.has(signal.edgeId)) {
        console.warn(
          `Signal ${signal.id} references non-existent edge ${signal.edgeId}`,
        );
        issueCount++;
      }
    }

    if (issueCount === 0) {
      console.log("✓ Network graph integrity validated - no issues found");
    } else {
      console.warn(`⚠ Network graph has ${issueCount} integrity issues`);
    }
  }
}
