import { create } from 'zustand';
import { NetworkGraph } from '../../network/graph';
import type { NetworkEdge, NetworkNode } from '../../network/types';
import { positionsEqual } from '../../network/utils';
import type { Entity } from '../../ecs/world';

export interface NetworkState {
  graph: NetworkGraph;
  version: number;
  visualEntities: Record<string, Entity>;
  addNode: (node: NetworkNode) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: NetworkEdge) => void;
  removeEdge: (edgeId: string) => void;
  findNodeAtPosition: (
    position: [number, number, number],
    tolerance?: number
  ) => NetworkNode | null;
  registerVisualEntity: (id: string, entity: Entity) => void;
  unregisterVisualEntity: (id: string) => Entity | undefined;
  getVisualEntity: (id: string) => Entity | undefined;
  incrementVersion: () => void;
}

const graph = new NetworkGraph();

export const useNetworkStore = create<NetworkState>()((set, get) => ({
  graph,
  version: 0,
  visualEntities: {},
  addNode: (node) => {
    graph.addNode(node);
    set((state) => ({ version: state.version + 1 }));
  },
  removeNode: (nodeId) => {
    graph.removeNode(nodeId);
    set((state) => ({ version: state.version + 1 }));
  },
  addEdge: (edge) => {
    graph.addEdge(edge);
    set((state) => ({ version: state.version + 1 }));
  },
  removeEdge: (edgeId) => {
    graph.removeEdge(edgeId);
    set((state) => ({ version: state.version + 1 }));
  },
  findNodeAtPosition: (position, tolerance = 0.1) => {
    const nodes = graph.getAllNodes();
    return (
      nodes.find((node) => positionsEqual(node.position, position, tolerance)) ?? null
    );
  },
  registerVisualEntity: (id, entity) => {
    set((state) => ({
      visualEntities: {
        ...state.visualEntities,
        [id]: entity,
      },
    }));
  },
  unregisterVisualEntity: (id) => {
    const existing = get().visualEntities[id];
    if (!existing) {
      return undefined;
    }

    set((state) => {
      const { [id]: _removed, ...rest } = state.visualEntities;
      return { visualEntities: rest };
    });

    return existing;
  },
  getVisualEntity: (id) => get().visualEntities[id],
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
}));
