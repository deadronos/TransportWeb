import { useThree } from "@react-three/fiber";
import { useState, useCallback, useEffect } from "react";
import { Vector2, type Vector3 } from "three";
import { nanoid } from "nanoid";

import { useTerrainRaycaster } from "./useTerrainRaycaster";
import { snapToGrid } from "../utils/grid";
import {
  useConstruction,
  type ConstructionTool,
} from "../state/slices/construction";
import { useWorld, type Entity } from "../ecs/world";
import { useNetworkStore } from "../state/slices/network";
import type { NetworkNode, TrackType } from "../network/types";
import { calculateDistance } from "../network/utils";

export interface ConstructionModeState {
  hoverPosition: Vector3 | null;
  isValid: boolean;
  isActive: boolean;
}

const GRID_SIZE = 10;
const NODE_TOLERANCE = 0.5;

const FACILITY_RADIUS: Partial<Record<BuildTool, number>> = {
  station: 140,
  depot: 90,
};

let stationSequence = 1;
let depotSequence = 1;

type BuildTool = Extract<
  ConstructionTool,
  "rail" | "road" | "station" | "depot"
>;

type SegmentRenderableKind = Extract<
  NonNullable<Entity["Renderable"]>["kind"],
  "track" | "road"
>;

type BuildingRenderableKind = Extract<
  NonNullable<Entity["Renderable"]>["kind"],
  "station" | "depot"
>;

interface ToolConfig {
  nodeType: NetworkNode["type"];
  trackType: TrackType;
  segment: {
    renderKind: SegmentRenderableKind;
    thickness: number;
    width: number;
    speedLimit: number;
    capacity: number;
  };
  building?: {
    renderKind: BuildingRenderableKind;
    dimensions: [number, number, number];
    color?: string;
  };
}

const TOOL_CONFIG: Record<BuildTool, ToolConfig> = {
  rail: {
    nodeType: "junction",
    trackType: "rail",
    segment: {
      renderKind: "track",
      thickness: 0.3,
      width: 2,
      speedLimit: 60,
      capacity: 1,
    },
  },
  road: {
    nodeType: "junction",
    trackType: "road",
    segment: {
      renderKind: "road",
      thickness: 0.2,
      width: 4,
      speedLimit: 40,
      capacity: 2,
    },
  },
  station: {
    nodeType: "station",
    trackType: "rail",
    segment: {
      renderKind: "track",
      thickness: 0.3,
      width: 2,
      speedLimit: 40,
      capacity: 1,
    },
    building: {
      renderKind: "station",
      dimensions: [20, 4, 10],
      color: "#d1a054",
    },
  },
  depot: {
    nodeType: "depot",
    trackType: "rail",
    segment: {
      renderKind: "track",
      thickness: 0.3,
      width: 2,
      speedLimit: 40,
      capacity: 1,
    },
    building: {
      renderKind: "depot",
      dimensions: [15, 4, 15],
      color: "#8c6239",
    },
  },
};

function determinePlacementValidity(
  tool: ConstructionTool,
  existing: NetworkNode | null,
): boolean {
  switch (tool) {
    case "demolish":
      return Boolean(existing);
    case "rail":
    case "road":
    case "station":
    case "depot":
      return !existing;
    default:
      return false;
  }
}

function isNeighborCompatible(
  node: NetworkNode,
  position: [number, number, number],
  trackType: TrackType,
) {
  const nodeTrackType =
    (node.metadata?.trackType as TrackType | undefined) ?? null;
  if (nodeTrackType && nodeTrackType !== trackType) {
    return false;
  }

  const dx = Math.abs(node.position[0] - position[0]);
  const dz = Math.abs(node.position[2] - position[2]);
  const dy = Math.abs(node.position[1] - position[1]);

  const isCardinalNeighbor =
    dy < NODE_TOLERANCE &&
    ((dx === GRID_SIZE && dz === 0) || (dz === GRID_SIZE && dx === 0));

  return isCardinalNeighbor;
}

/**
 * Hook for managing construction mode interactions.
 * Handles mouse movement, raycasting, grid snapping, and placement logic.
 */
export function useConstructionMode() {
  const tool = useConstruction((state) => state.tool);
  const setGhostPosition = useConstruction((state) => state.setGhostPosition);
  const setValidPlacement = useConstruction((state) => state.setValidPlacement);
  const { gl } = useThree();
  const raycast = useTerrainRaycaster();
  const world = useWorld();

  const graph = useNetworkStore((state) => state.graph);
  const addNode = useNetworkStore((state) => state.addNode);
  const addEdge = useNetworkStore((state) => state.addEdge);
  const removeNode = useNetworkStore((state) => state.removeNode);
  const findNodeAtPosition = useNetworkStore(
    (state) => state.findNodeAtPosition,
  );
  const registerVisualEntity = useNetworkStore(
    (state) => state.registerVisualEntity,
  );
  const unregisterVisualEntity = useNetworkStore(
    (state) => state.unregisterVisualEntity,
  );
  const version = useNetworkStore((state) => state.version);

  const [hoverPosition, setHoverPosition] = useState<Vector3 | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Construction mode is active when a tool is selected (but not Query)
  const isActive = tool !== "none" && tool !== "query";

  const createSegmentVisual = useCallback(
    (
      from: [number, number, number],
      to: [number, number, number],
      segment: ToolConfig["segment"],
    ) => {
      const length = calculateDistance(from, to);
      const entityId = nanoid();
      const midpoint: [number, number, number] = [
        (from[0] + to[0]) / 2,
        from[1] + segment.thickness / 2,
        (from[2] + to[2]) / 2,
      ];
      const alongZ = Math.abs(to[2] - from[2]) > Math.abs(to[0] - from[0]);
      const rotationY = alongZ ? Math.PI / 2 : 0;

      const entity = world.add({
        id: entityId,
        Transform: {
          position: midpoint,
          rotation: [0, rotationY, 0],
        },
        Renderable: {
          kind: segment.renderKind,
          dimensions: [length, segment.thickness, segment.width],
        },
      });

      registerVisualEntity(entityId, entity);

      return { visualEntityId: entityId, length };
    },
    [registerVisualEntity, world],
  );

  const connectNeighbors = useCallback(
    (
      nodeId: string,
      nodePosition: [number, number, number],
      config: ToolConfig,
    ) => {
      const neighbors = graph
        .getAllNodes()
        .filter(
          (candidate) =>
            candidate.id !== nodeId &&
            isNeighborCompatible(candidate, nodePosition, config.trackType),
        );

      for (const neighbor of neighbors) {
        if (graph.getEdgesBetweenNodes(nodeId, neighbor.id).length > 0) {
          continue;
        }

        const { visualEntityId, length } = createSegmentVisual(
          nodePosition,
          neighbor.position,
          config.segment,
        );

        const edgeBase = {
          trackType: config.trackType,
          length,
          speedLimit: config.segment.speedLimit,
          capacity: config.segment.capacity,
          occupied: [] as string[],
          visualEntityId,
        };

        addEdge({
          id: nanoid(),
          fromNode: nodeId,
          toNode: neighbor.id,
          ...edgeBase,
        });

        addEdge({
          id: nanoid(),
          fromNode: neighbor.id,
          toNode: nodeId,
          ...edgeBase,
        });
      }
    },
    [addEdge, createSegmentVisual, graph],
  );

  const placeStructure = useCallback(
    (activeTool: BuildTool, position: Vector3) => {
      const config = TOOL_CONFIG[activeTool];
      const nodeId = nanoid();
      const nodePosition: [number, number, number] = [
        position.x,
        position.y,
        position.z,
      ];
      nodePosition[1] = 0; // ensure structures rest on the terrain plane

      const metadata: Record<string, unknown> = { trackType: config.trackType };

      if (activeTool === "station") {
        metadata.name = `Station ${stationSequence.toString().padStart(2, "0")}`;
        metadata.serviceRadius = FACILITY_RADIUS.station;
        stationSequence += 1;
      } else if (activeTool === "depot") {
        metadata.name = `Depot ${depotSequence.toString().padStart(2, "0")}`;
        metadata.serviceRadius = FACILITY_RADIUS.depot;
        depotSequence += 1;
      }

      if (config.building) {
        const buildingId = nanoid();
        const dims = config.building.dimensions;
        const entity = world.add({
          id: buildingId,
          Transform: {
            position: [
              nodePosition[0],
              nodePosition[1] + dims[1] / 2,
              nodePosition[2],
            ],
          },
          Renderable: {
            kind: config.building.renderKind,
            dimensions: dims,
            color: config.building.color,
          },
        });

        registerVisualEntity(buildingId, entity);
        metadata.visualEntityId = buildingId;
      }

      addNode({
        id: nodeId,
        position: nodePosition,
        type: config.nodeType,
        connections: [],
        metadata,
      });

      connectNeighbors(nodeId, nodePosition, config);
    },
    [addNode, connectNeighbors, registerVisualEntity, world],
  );

  const demolishStructure = useCallback(
    (position: Vector3) => {
      const nodePosition: [number, number, number] = [
        position.x,
        position.y,
        position.z,
      ];
      const node = findNodeAtPosition(nodePosition, NODE_TOLERANCE);

      if (!node) {
        return;
      }

      const edges = graph.getConnectedEdges(node.id);
      const visualIds = new Set<string>();

      for (const edge of edges) {
        if (edge.visualEntityId) {
          visualIds.add(edge.visualEntityId);
        }
      }

      const metadataVisualId = node.metadata?.visualEntityId;
      if (typeof metadataVisualId === "string") {
        visualIds.add(metadataVisualId);
      }

      for (const visualId of visualIds) {
        const entity = unregisterVisualEntity(visualId);
        if (entity) {
          world.remove(entity);
        }
      }

      removeNode(node.id);
    },
    [findNodeAtPosition, graph, removeNode, unregisterVisualEntity, world],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isActive) {
        setHoverPosition(null);
        setGhostPosition(null);
        setIsValid(false);
        setValidPlacement(false);
        return;
      }

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const mouseNDC = new Vector2(x, y);
      const worldPos = raycast(mouseNDC);

      if (worldPos) {
        const snappedPos = snapToGrid(worldPos, GRID_SIZE);
        setHoverPosition(snappedPos);
        setGhostPosition([snappedPos.x, snappedPos.y, snappedPos.z]);

        const nodePosition: [number, number, number] = [
          snappedPos.x,
          snappedPos.y,
          snappedPos.z,
        ];
        const existing = findNodeAtPosition(nodePosition, NODE_TOLERANCE);
        const valid = determinePlacementValidity(tool, existing);

        setIsValid(valid);
        setValidPlacement(valid);
      } else {
        setHoverPosition(null);
        setGhostPosition(null);
        setIsValid(false);
        setValidPlacement(false);
      }
    },
    [
      findNodeAtPosition,
      gl.domElement,
      isActive,
      raycast,
      setGhostPosition,
      setValidPlacement,
      tool,
    ],
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isActive || !hoverPosition) {
        return;
      }

      const nodePosition: [number, number, number] = [
        hoverPosition.x,
        hoverPosition.y,
        hoverPosition.z,
      ];
      const existing = findNodeAtPosition(nodePosition, NODE_TOLERANCE);

      if (!determinePlacementValidity(tool, existing)) {
        return;
      }

      event.stopPropagation();

      if (tool === "demolish") {
        demolishStructure(hoverPosition);
        return;
      }

      if (
        tool === "rail" ||
        tool === "road" ||
        tool === "station" ||
        tool === "depot"
      ) {
        placeStructure(tool, hoverPosition);
      }
    },
    [
      demolishStructure,
      findNodeAtPosition,
      hoverPosition,
      isActive,
      placeStructure,
      tool,
    ],
  );

  // Validate placement validity when hover position changes
  useEffect(() => {
    if (!isActive || !hoverPosition) {
      return;
    }

    const nodePosition: [number, number, number] = [
      hoverPosition.x,
      hoverPosition.y,
      hoverPosition.z,
    ];
    const existing = findNodeAtPosition(nodePosition, NODE_TOLERANCE);
    const valid = determinePlacementValidity(tool, existing);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsValid(valid);
    setValidPlacement(valid);
  }, [
    findNodeAtPosition,
    hoverPosition,
    isActive,
    setValidPlacement,
    tool,
    version,
  ]);

  useEffect(() => {
    const canvas = gl.domElement;

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [gl.domElement, handleClick, handleMouseMove]);

  return {
    hoverPosition,
    isValid,
    isActive,
  };
}
