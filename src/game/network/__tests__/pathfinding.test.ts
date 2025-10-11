/**
 * Tests for Pathfinding System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NetworkGraph } from '../graph';
import {
  findPath,
  reservePath,
  releasePath,
  findAlternatePath,
  PathCache,
} from '../pathfinding';
import type { NetworkNode } from '../types';

describe('Pathfinding System', () => {
  let graph: NetworkGraph;

  beforeEach(() => {
    graph = new NetworkGraph();
  });

  describe('Basic Pathfinding', () => {
    it('should find simple 3-node path', () => {
      // Create linear graph: A -> B -> C
      const nodeA: NetworkNode = {
        id: 'A',
        position: [0, 0, 0],
        type: 'junction',
        connections: [],
      };
      const nodeB: NetworkNode = {
        id: 'B',
        position: [10, 0, 0],
        type: 'junction',
        connections: [],
      };
      const nodeC: NetworkNode = {
        id: 'C',
        position: [20, 0, 0],
        type: 'junction',
        connections: [],
      };

      graph.addNode(nodeA);
      graph.addNode(nodeB);
      graph.addNode(nodeC);

      graph.addEdge({
        id: 'AB',
        fromNode: 'A',
        toNode: 'B',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'BC',
        fromNode: 'B',
        toNode: 'C',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      const result = findPath(graph, 'A', 'C');

      expect(result.success).toBe(true);
      expect(result.path).not.toBeNull();
      expect(result.path?.nodes).toEqual(['A', 'B', 'C']);
      expect(result.path?.edges).toEqual(['AB', 'BC']);
      expect(result.path?.totalCost).toBe(20);
    });

    it('should return early when start equals end', () => {
      const nodeA: NetworkNode = {
        id: 'A',
        position: [0, 0, 0],
        type: 'junction',
        connections: [],
      };
      graph.addNode(nodeA);

      const result = findPath(graph, 'A', 'A');

      expect(result.success).toBe(true);
      expect(result.path?.nodes).toEqual(['A']);
      expect(result.path?.edges).toEqual([]);
      expect(result.path?.totalCost).toBe(0);
    });

    it('should handle missing start node', () => {
      const result = findPath(graph, 'nonexistent', 'B');

      expect(result.success).toBe(false);
      expect(result.path).toBeNull();
      expect(result.message).toBe('Start node not found');
    });

    it('should handle missing end node', () => {
      const nodeA: NetworkNode = {
        id: 'A',
        position: [0, 0, 0],
        type: 'junction',
        connections: [],
      };
      graph.addNode(nodeA);

      const result = findPath(graph, 'A', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.path).toBeNull();
      expect(result.message).toBe('End node not found');
    });
  });

  describe('Path Selection', () => {
    it('should choose shortest path when multiple routes exist', () => {
      // Create diamond graph:
      //     B (10)
      //   /   \
      //  A     D
      //   \   /
      //     C (5)
      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'B', position: [10, 10, 0], type: 'junction', connections: [] },
        { id: 'C', position: [10, -10, 0], type: 'junction', connections: [] },
        { id: 'D', position: [20, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      graph.addEdge({
        id: 'AB',
        fromNode: 'A',
        toNode: 'B',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'BD',
        fromNode: 'B',
        toNode: 'D',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'AC',
        fromNode: 'A',
        toNode: 'C',
        trackType: 'rail',
        length: 5,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'CD',
        fromNode: 'C',
        toNode: 'D',
        trackType: 'rail',
        length: 5,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      const result = findPath(graph, 'A', 'D');

      expect(result.success).toBe(true);
      expect(result.path?.edges).toEqual(['AC', 'CD']);
      expect(result.path?.totalCost).toBe(10);
    });
  });

  describe('Capacity Constraints', () => {
    it('should avoid edges at capacity', () => {
      // Create graph with blocked short path
      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'B', position: [10, 0, 0], type: 'junction', connections: [] },
        { id: 'C', position: [20, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      // Direct path (blocked)
      graph.addEdge({
        id: 'AC',
        fromNode: 'A',
        toNode: 'C',
        trackType: 'rail',
        length: 20,
        speedLimit: 100,
        capacity: 1,
        occupied: ['vehicle1'], // At capacity
        visualEntityId: '',
      });

      // Alternate path (available)
      graph.addEdge({
        id: 'AB',
        fromNode: 'A',
        toNode: 'B',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'BC',
        fromNode: 'B',
        toNode: 'C',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      const result = findPath(graph, 'A', 'C', { respectCapacity: true });

      expect(result.success).toBe(true);
      expect(result.path?.edges).toEqual(['AB', 'BC']);
    });

    it('should use blocked edge when respectCapacity is false', () => {
      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'C', position: [20, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      graph.addEdge({
        id: 'AC',
        fromNode: 'A',
        toNode: 'C',
        trackType: 'rail',
        length: 20,
        speedLimit: 100,
        capacity: 1,
        occupied: ['vehicle1'],
        visualEntityId: '',
      });

      const result = findPath(graph, 'A', 'C', { respectCapacity: false });

      expect(result.success).toBe(true);
      expect(result.path?.edges).toEqual(['AC']);
    });
  });

  describe('No Path Scenarios', () => {
    it('should return no path for disconnected nodes', () => {
      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'B', position: [100, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      const result = findPath(graph, 'A', 'B');

      expect(result.success).toBe(false);
      expect(result.path).toBeNull();
      expect(result.message).toBe('No path found');
    });
  });

  describe('Path Reservation', () => {
    it('should reserve path successfully', () => {
      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'B', position: [10, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      graph.addEdge({
        id: 'AB',
        fromNode: 'A',
        toNode: 'B',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      const pathResult = findPath(graph, 'A', 'B');
      expect(pathResult.success).toBe(true);

      const reserved = reservePath(graph, pathResult.path!, 'vehicle1');
      expect(reserved).toBe(true);

      const edge = graph.getEdge('AB');
      expect(edge?.occupied).toEqual(['vehicle1']);
    });

    it('should fail reservation when at capacity', () => {
      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'B', position: [10, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      graph.addEdge({
        id: 'AB',
        fromNode: 'A',
        toNode: 'B',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 1,
        occupied: ['vehicle1'],
        visualEntityId: '',
      });

      const pathResult = findPath(graph, 'A', 'B', { respectCapacity: false });
      const reserved = reservePath(graph, pathResult.path!, 'vehicle2');

      expect(reserved).toBe(false);
    });

    it('should release path reservation', () => {
      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'B', position: [10, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      graph.addEdge({
        id: 'AB',
        fromNode: 'A',
        toNode: 'B',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      const pathResult = findPath(graph, 'A', 'B');
      reservePath(graph, pathResult.path!, 'vehicle1');

      releasePath(graph, pathResult.path!, 'vehicle1');

      const edge = graph.getEdge('AB');
      expect(edge?.occupied).toEqual([]);
    });
  });

  describe('Alternate Path Finding', () => {
    it('should find alternate path when primary is blocked', () => {
      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'B', position: [10, 10, 0], type: 'junction', connections: [] },
        { id: 'C', position: [10, -10, 0], type: 'junction', connections: [] },
        { id: 'D', position: [20, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      graph.addEdge({
        id: 'AB',
        fromNode: 'A',
        toNode: 'B',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'BD',
        fromNode: 'B',
        toNode: 'D',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'AC',
        fromNode: 'A',
        toNode: 'C',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'CD',
        fromNode: 'C',
        toNode: 'D',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      // Block primary path AB
      const result = findAlternatePath(graph, 'A', 'D', ['AB']);

      expect(result.success).toBe(true);
      expect(result.path?.edges).toEqual(['AC', 'CD']);
    });
  });

  describe('PathCache', () => {
    it('should cache and retrieve paths', () => {
      const cache = new PathCache();
      const path = {
        nodes: ['A', 'B', 'C'],
        edges: ['AB', 'BC'],
        totalCost: 20,
      };

      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'B', position: [10, 0, 0], type: 'junction', connections: [] },
        { id: 'C', position: [20, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      graph.addEdge({
        id: 'AB',
        fromNode: 'A',
        toNode: 'B',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'BC',
        fromNode: 'B',
        toNode: 'C',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      cache.set('A', 'C', path);
      const retrieved = cache.get('A', 'C', graph);

      expect(retrieved).toEqual(path);
    });

    it('should return null for cache miss', () => {
      const cache = new PathCache();
      const retrieved = cache.get('A', 'B', graph);

      expect(retrieved).toBeNull();
    });

    it('should invalidate cache when node removed', () => {
      const cache = new PathCache();
      const path = {
        nodes: ['A', 'B', 'C'],
        edges: ['AB', 'BC'],
        totalCost: 20,
      };

      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'B', position: [10, 0, 0], type: 'junction', connections: [] },
        { id: 'C', position: [20, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      graph.addEdge({
        id: 'AB',
        fromNode: 'A',
        toNode: 'B',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'BC',
        fromNode: 'B',
        toNode: 'C',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      cache.set('A', 'C', path);
      cache.invalidate('B');

      const retrieved = cache.get('A', 'C', graph);
      expect(retrieved).toBeNull();
    });

    it('should clear all cache entries', () => {
      const cache = new PathCache();
      cache.set('A', 'B', {
        nodes: ['A', 'B'],
        edges: ['AB'],
        totalCost: 10,
      });
      cache.set('B', 'C', {
        nodes: ['B', 'C'],
        edges: ['BC'],
        totalCost: 10,
      });

      expect(cache.getSize()).toBe(2);

      cache.invalidate();
      expect(cache.getSize()).toBe(0);
    });

    it('should evict oldest entry when at capacity', () => {
      const cache = new PathCache(2); // Max size 2

      const nodes: NetworkNode[] = [
        { id: 'A', position: [0, 0, 0], type: 'junction', connections: [] },
        { id: 'B', position: [10, 0, 0], type: 'junction', connections: [] },
        { id: 'C', position: [20, 0, 0], type: 'junction', connections: [] },
        { id: 'D', position: [30, 0, 0], type: 'junction', connections: [] },
      ];

      for (const node of nodes) {
        graph.addNode(node);
      }

      graph.addEdge({
        id: 'AB',
        fromNode: 'A',
        toNode: 'B',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'BC',
        fromNode: 'B',
        toNode: 'C',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      graph.addEdge({
        id: 'CD',
        fromNode: 'C',
        toNode: 'D',
        trackType: 'rail',
        length: 10,
        speedLimit: 100,
        capacity: 5,
        occupied: [],
        visualEntityId: '',
      });

      cache.set('A', 'B', {
        nodes: ['A', 'B'],
        edges: ['AB'],
        totalCost: 10,
      });
      cache.set('B', 'C', {
        nodes: ['B', 'C'],
        edges: ['BC'],
        totalCost: 10,
      });
      cache.set('C', 'D', {
        nodes: ['C', 'D'],
        edges: ['CD'],
        totalCost: 10,
      });

      expect(cache.getSize()).toBe(2);
      expect(cache.get('A', 'B', graph)).toBeNull(); // First entry evicted
      expect(cache.get('B', 'C', graph)).not.toBeNull();
      expect(cache.get('C', 'D', graph)).not.toBeNull();
    });
  });
});
