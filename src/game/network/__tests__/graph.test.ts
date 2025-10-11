import { describe, it, expect, beforeEach } from 'vitest';
import { NetworkGraph } from '../graph';
import type { NetworkNode, NetworkEdge } from '../types';

describe('NetworkGraph', () => {
  let graph: NetworkGraph;

  beforeEach(() => {
    graph = new NetworkGraph();
  });

  describe('Node Operations', () => {
    it('should add a node', () => {
      const node: NetworkNode = {
        id: 'node1',
        position: [0, 0, 0],
        type: 'junction',
        connections: [],
      };

      graph.addNode(node);
      expect(graph.getNode('node1')).toEqual({ ...node, connections: [] });
    });

    it('should throw when adding duplicate node', () => {
      const node: NetworkNode = {
        id: 'node1',
        position: [0, 0, 0],
        type: 'junction',
        connections: [],
      };

      graph.addNode(node);
      expect(() => graph.addNode(node)).toThrow('already exists');
    });

    it('should remove a node', () => {
      const node: NetworkNode = {
        id: 'node1',
        position: [0, 0, 0],
        type: 'junction',
        connections: [],
      };

      graph.addNode(node);
      graph.removeNode('node1');
      expect(graph.getNode('node1')).toBeUndefined();
    });

    it('should get all nodes', () => {
      const node1: NetworkNode = {
        id: 'node1',
        position: [0, 0, 0],
        type: 'junction',
        connections: [],
      };
      const node2: NetworkNode = {
        id: 'node2',
        position: [10, 0, 0],
        type: 'station',
        connections: [],
      };

      graph.addNode(node1);
      graph.addNode(node2);
      expect(graph.getAllNodes()).toHaveLength(2);
    });

    it('should get nodes by type', () => {
      const junction: NetworkNode = {
        id: 'node1',
        position: [0, 0, 0],
        type: 'junction',
        connections: [],
      };
      const station: NetworkNode = {
        id: 'node2',
        position: [10, 0, 0],
        type: 'station',
        connections: [],
      };

      graph.addNode(junction);
      graph.addNode(station);

  const stations = graph.getNodesByType('station');
  expect(stations).toHaveLength(1);
  expect(stations[0]?.id).toBe('node2');
    });
  });

  describe('Edge Operations', () => {
    beforeEach(() => {
      graph.addNode({
        id: 'node1',
        position: [0, 0, 0],
        type: 'junction',
        connections: [],
      });
      graph.addNode({
        id: 'node2',
        position: [10, 0, 0],
        type: 'junction',
        connections: [],
      });
    });

    it('should add an edge', () => {
      const edge: NetworkEdge = {
        id: 'edge1',
        fromNode: 'node1',
        toNode: 'node2',
        trackType: 'rail',
        length: 10,
        speedLimit: 50,
        capacity: 1,
        occupied: [],
        visualEntityId: null,
      };

      graph.addEdge(edge);
      expect(graph.getEdge('edge1')).toEqual({ ...edge, occupied: [] });
    });

    it('should throw when adding edge with non-existent nodes', () => {
      const edge: NetworkEdge = {
        id: 'edge1',
        fromNode: 'node1',
        toNode: 'node999',
        trackType: 'rail',
        length: 10,
        speedLimit: 50,
        capacity: 1,
        occupied: [],
        visualEntityId: null,
      };

      expect(() => graph.addEdge(edge)).toThrow('does not exist');
    });

    it('should update node connections when adding edge', () => {
      const edge: NetworkEdge = {
        id: 'edge1',
        fromNode: 'node1',
        toNode: 'node2',
        trackType: 'rail',
        length: 10,
        speedLimit: 50,
        capacity: 1,
        occupied: [],
        visualEntityId: null,
      };

      graph.addEdge(edge);

      const node1 = graph.getNode('node1');
      const node2 = graph.getNode('node2');

      expect(node1?.connections).toContain('edge1');
      expect(node2?.connections).toContain('edge1');
    });

    it('should remove an edge', () => {
      const edge: NetworkEdge = {
        id: 'edge1',
        fromNode: 'node1',
        toNode: 'node2',
        trackType: 'rail',
        length: 10,
        speedLimit: 50,
        capacity: 1,
        occupied: [],
        visualEntityId: null,
      };

      graph.addEdge(edge);
      graph.removeEdge('edge1');
      expect(graph.getEdge('edge1')).toBeUndefined();
    });

    it('should remove edge from node connections when removing edge', () => {
      const edge: NetworkEdge = {
        id: 'edge1',
        fromNode: 'node1',
        toNode: 'node2',
        trackType: 'rail',
        length: 10,
        speedLimit: 50,
        capacity: 1,
        occupied: [],
        visualEntityId: null,
      };

      graph.addEdge(edge);
      graph.removeEdge('edge1');

      const node1 = graph.getNode('node1');
      const node2 = graph.getNode('node2');

      expect(node1?.connections).not.toContain('edge1');
      expect(node2?.connections).not.toContain('edge1');
    });
  });

  describe('Graph Queries', () => {
    beforeEach(() => {
      // Create a simple network: node1 -- edge1 --> node2 -- edge2 --> node3
      graph.addNode({
        id: 'node1',
        position: [0, 0, 0],
        type: 'station',
        connections: [],
      });
      graph.addNode({
        id: 'node2',
        position: [10, 0, 0],
        type: 'junction',
        connections: [],
      });
      graph.addNode({
        id: 'node3',
        position: [20, 0, 0],
        type: 'station',
        connections: [],
      });

      graph.addEdge({
        id: 'edge1',
        fromNode: 'node1',
        toNode: 'node2',
        trackType: 'rail',
        length: 10,
        speedLimit: 50,
        capacity: 1,
        occupied: [],
        visualEntityId: null,
      });

      graph.addEdge({
        id: 'edge2',
        fromNode: 'node2',
        toNode: 'node3',
        trackType: 'rail',
        length: 10,
        speedLimit: 50,
        capacity: 1,
        occupied: [],
        visualEntityId: null,
      });
    });

    it('should get connected edges', () => {
      const edges = graph.getConnectedEdges('node2');
      expect(edges).toHaveLength(2);
      expect(edges.map((e) => e.id)).toContain('edge1');
      expect(edges.map((e) => e.id)).toContain('edge2');
    });

    it('should get neighbors', () => {
      const neighbors = graph.getNeighbors('node2');
      expect(neighbors).toHaveLength(2);
      expect(neighbors.map((n) => n.id)).toContain('node1');
      expect(neighbors.map((n) => n.id)).toContain('node3');
    });

    it('should check if nodes are connected', () => {
      expect(graph.areNodesConnected('node1', 'node2')).toBe(true);
      expect(graph.areNodesConnected('node1', 'node3')).toBe(false);
    });

    it('should get edges between nodes', () => {
  const edges = graph.getEdgesBetweenNodes('node1', 'node2');
  expect(edges).toHaveLength(1);
  expect(edges[0]?.id).toBe('edge1');
    });

    it('should calculate stats', () => {
      const stats = graph.getStats();
      expect(stats.nodeCount).toBe(3);
      expect(stats.edgeCount).toBe(2);
      expect(stats.totalLength).toBe(20);
      expect(stats.stationCount).toBe(2);
      expect(stats.junctionCount).toBe(1);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      graph.addNode({
        id: 'node1',
        position: [0, 0, 0],
        type: 'station',
        connections: [],
      });

      const json = graph.toJSON();
      expect(json.version).toBe(1);
      expect(json.nodes).toHaveLength(1);
      expect(json.edges).toHaveLength(0);
    });

    it('should deserialize from JSON', () => {
      const data = {
        version: 1,
        nodes: [
          {
            id: 'node1',
            position: [0, 0, 0] as [number, number, number],
            type: 'station' as const,
            connections: [],
          },
        ],
        edges: [],
      };

      const newGraph = NetworkGraph.fromJSON(data, false);
      expect(newGraph.getNode('node1')).toBeDefined();
    });

    it('should handle serialization round-trip', () => {
      graph.addNode({
        id: 'node1',
        position: [0, 0, 0],
        type: 'station',
        connections: [],
      });
      graph.addNode({
        id: 'node2',
        position: [10, 0, 0],
        type: 'junction',
        connections: [],
      });
      graph.addEdge({
        id: 'edge1',
        fromNode: 'node1',
        toNode: 'node2',
        trackType: 'rail',
        length: 10,
        speedLimit: 50,
        capacity: 1,
        occupied: [],
        visualEntityId: null,
      });

      const json = graph.toJSON();
      const newGraph = NetworkGraph.fromJSON(json, false);

      expect(newGraph.getAllNodes()).toHaveLength(2);
      expect(newGraph.getAllEdges()).toHaveLength(1);
      expect(newGraph.areNodesConnected('node1', 'node2')).toBe(true);
    });
  });

  describe('Graph Integrity', () => {
    it('should clear all data', () => {
      graph.addNode({
        id: 'node1',
        position: [0, 0, 0],
        type: 'station',
        connections: [],
      });

      graph.clear();
      expect(graph.getAllNodes()).toHaveLength(0);
      expect(graph.getAllEdges()).toHaveLength(0);
    });

    it('should remove edges when removing node', () => {
      graph.addNode({
        id: 'node1',
        position: [0, 0, 0],
        type: 'station',
        connections: [],
      });
      graph.addNode({
        id: 'node2',
        position: [10, 0, 0],
        type: 'station',
        connections: [],
      });
      graph.addEdge({
        id: 'edge1',
        fromNode: 'node1',
        toNode: 'node2',
        trackType: 'rail',
        length: 10,
        speedLimit: 50,
        capacity: 1,
        occupied: [],
        visualEntityId: null,
      });

      graph.removeNode('node1');
      expect(graph.getEdge('edge1')).toBeUndefined();
    });
  });
});
