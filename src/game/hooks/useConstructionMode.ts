import { useThree } from "@react-three/fiber";
import { useState, useCallback, useEffect, useRef } from "react";
import { Vector2, Vector3 } from "three";
import { nanoid } from "nanoid";

import { useTerrainRaycaster } from "./useTerrainRaycaster";
import { snapToGrid } from "../utils/grid";
import {
  useConstruction,
  type ConstructionTool,
} from "../state/slices/construction";
import { useWorld, type Entity } from "../ecs/world";
import { useNetworkStore } from "../state/slices/network";
import { useToolPreviewStore } from "../state/slices/toolPreview";
import { useEconomyStore } from "../state/slices/economy";
import type { NetworkNode, TrackType } from "../network/types";
import {
  calculateDistance,
  calculateYaw,
  computeSignalPlacement,
  isGridNeighbor,
} from "../network/utils";
import type { NetworkSignal } from "../network/types";
import type { Farm, Industry, Mine, Town } from "../simulation/types";

type Settlement = Town | Farm | Industry | Mine;

export interface ConstructionModeState {
  hoverPosition: Vector3 | null;
  isValid: boolean;
  isActive: boolean;
}

const GRID_SIZE = 10;
const NODE_TOLERANCE = 0.5;
const SIGNAL_SEARCH_RADIUS = 6;
const SIGNAL_ALONG_OFFSET = 4;
const SIGNAL_LATERAL_OFFSET = 2;
const SIGNAL_HEIGHT_OFFSET = 1.8;
const QUERY_SEARCH_RADIUS = 24;

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

interface SignalCandidate {
  edgeId: string;
  position: [number, number, number];
  rotationY: number;
  existingSignal: NetworkSignal | null;
  reverse: boolean;
  sideMultiplier: 1 | -1;
}

interface ModifierState {
  alt: boolean;
  shift: boolean;
}

function determinePlacementValidity(
  tool: ConstructionTool,
  existing: NetworkNode | null,
  signalCandidate: SignalCandidate | null,
): boolean {
  switch (tool) {
    case "demolish":
      return Boolean(existing);
    case "signal":
      return Boolean(signalCandidate);
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

  return isGridNeighbor(
    node.position,
    position,
    GRID_SIZE,
    NODE_TOLERANCE,
    true,
  );
}

function findNearestSettlement(
  position: Vector3,
  radius: number,
): Settlement | null {
  const state = useEconomyStore.getState();
  const candidates: Settlement[] = [
    ...state.towns,
    ...state.farms,
    ...state.industries,
    ...state.mines,
  ];

  const sample: [number, number, number] = [position.x, position.y, position.z];

  let closest: Settlement | null = null;
  let closestDistance = radius;

  for (const settlement of candidates) {
    const distance = calculateDistance(settlement.position, sample);
    if (distance <= closestDistance) {
      closest = settlement;
      closestDistance = distance;
    }
  }

  return closest;
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
  const addSignal = useNetworkStore((state) => state.addSignal);
  const removeSignal = useNetworkStore((state) => state.removeSignal);
  const findNodeAtPosition = useNetworkStore(
    (state) => state.findNodeAtPosition,
  );
  const getSignalsForEdge = useNetworkStore((state) => state.getSignalsForEdge);
  const registerVisualEntity = useNetworkStore(
    (state) => state.registerVisualEntity,
  );
  const unregisterVisualEntity = useNetworkStore(
    (state) => state.unregisterVisualEntity,
  );
  const version = useNetworkStore((state) => state.version);
  const setSegments = useToolPreviewStore((state) => state.setSegments);
  const setFacility = useToolPreviewStore((state) => state.setFacility);
  const setQuery = useToolPreviewStore((state) => state.setQuery);
  const reset = useToolPreviewStore((state) => state.reset);

  const [hoverPosition, setHoverPosition] = useState<Vector3 | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [signalCandidate, setSignalCandidate] =
    useState<SignalCandidate | null>(null);
  const [modifierState, setModifierState] = useState<ModifierState>({
    alt: false,
    shift: false,
  });
  const lastWorldPositionRef = useRef<Vector3 | null>(null);

  // Construction mode is active when a tool is selected (but not Query)
  const isPlacementTool = tool !== "none" && tool !== "query";
  const hasActiveTool = tool !== "none";

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
      const rotationY = calculateYaw(from, to);

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

  const createSignalVisual = useCallback(
    (position: [number, number, number], rotationY: number) => {
      const entityId = nanoid();
      const entity = world.add({
        id: entityId,
        Transform: {
          position: [position[0], position[1], position[2]],
          rotation: [0, rotationY, 0],
        },
        Renderable: {
          kind: "signal",
          dimensions: [0.6, 2.4, 0.6],
          color: "#ffcc33",
        },
      });

      registerVisualEntity(entityId, entity);
      return entityId;
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

        const signals = getSignalsForEdge(edge.id);
        for (const signal of signals) {
          if (signal.visualEntityId) {
            visualIds.add(signal.visualEntityId);
          }
          removeSignal(signal.id);
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
    [
      findNodeAtPosition,
      getSignalsForEdge,
      graph,
      removeNode,
      removeSignal,
      unregisterVisualEntity,
      world,
    ],
  );

  const recomputePlacement = useCallback(
    (worldPos: Vector3 | null, modifiers: ModifierState) => {
      if (!worldPos) {
        setSignalCandidate(null);
        setHoverPosition(null);
        setGhostPosition(null);
        setIsValid(false);
        setValidPlacement(false);
        setSegments([]);
        setFacility(null);
        setQuery(null);
        return;
      }

      if (tool === "signal") {
        const sideMultiplier: 1 | -1 = modifiers.alt ? -1 : 1;
        const useReverse = modifiers.shift;
        const processedPairs = new Set<string>();
        let bestCandidate: SignalCandidate | null = null;
        let bestDistance = SIGNAL_SEARCH_RADIUS;

        for (const edge of graph.getAllEdges()) {
          if (edge.trackType !== "rail") {
            continue;
          }

          let activeEdge = edge;
          let reverseMode = false;

          if (useReverse) {
            const reverseEdge = graph.getReverseEdge(edge.id);
            if (!reverseEdge) {
              continue;
            }

            const key = [edge.id, reverseEdge.id].sort().join("|");
            if (processedPairs.has(key)) {
              continue;
            }
            processedPairs.add(key);

            activeEdge = reverseEdge;
            reverseMode = true;
          }

          const from = graph.getNode(activeEdge.fromNode);
          const to = graph.getNode(activeEdge.toNode);
          if (!from || !to) {
            continue;
          }

          const placement = computeSignalPlacement(
            from.position,
            to.position,
            SIGNAL_ALONG_OFFSET,
            SIGNAL_LATERAL_OFFSET,
            SIGNAL_HEIGHT_OFFSET,
            sideMultiplier,
          );

          const distance = calculateDistance(placement.position, [
            worldPos.x,
            worldPos.y,
            worldPos.z,
          ]);

          if (distance < bestDistance) {
            const existingSignal = getSignalsForEdge(activeEdge.id)[0] ?? null;
            bestDistance = distance;
            bestCandidate = {
              edgeId: activeEdge.id,
              position: placement.position,
              rotationY: placement.rotationY,
              existingSignal,
              reverse: reverseMode,
              sideMultiplier,
            };
          }
        }

        if (bestCandidate) {
          setSignalCandidate(bestCandidate);
          setHoverPosition(
            new Vector3(
              bestCandidate.position[0],
              bestCandidate.position[1],
              bestCandidate.position[2],
            ),
          );
          setGhostPosition(bestCandidate.position);
          setIsValid(true);
          setValidPlacement(true);
        } else {
          setSignalCandidate(null);
          setHoverPosition(null);
          setGhostPosition(null);
          setIsValid(false);
          setValidPlacement(false);
        }

        setSegments([]);
        setFacility(null);
        setQuery(null);

        return;
      }

      const snappedPos = snapToGrid(worldPos, GRID_SIZE);
      setSignalCandidate(null);
      setHoverPosition(snappedPos);
      setGhostPosition([snappedPos.x, snappedPos.y, snappedPos.z]);

      const nodePosition: [number, number, number] = [
        snappedPos.x,
        snappedPos.y,
        snappedPos.z,
      ];
      const existing = findNodeAtPosition(nodePosition, NODE_TOLERANCE);
      const valid = determinePlacementValidity(tool, existing, null);

      setIsValid(valid);
      setValidPlacement(valid);

      if (tool === "rail" || tool === "road") {
        if (!valid) {
          setSegments([]);
          setFacility(null);
          return;
        }

        const config = TOOL_CONFIG[tool];
        const neighbors = graph
          .getAllNodes()
          .filter(
            (candidate) =>
              candidate.id !== existing?.id &&
              isNeighborCompatible(candidate, nodePosition, config.trackType),
          );

        const segments = neighbors.map((neighbor) => {
          const midpoint: [number, number, number] = [
            (neighbor.position[0] + nodePosition[0]) / 2,
            nodePosition[1] + config.segment.thickness / 2,
            (neighbor.position[2] + nodePosition[2]) / 2,
          ];
          return {
            id: neighbor.id,
            midpoint,
            rotationY: calculateYaw(nodePosition, neighbor.position),
            length: calculateDistance(nodePosition, neighbor.position),
            thickness: config.segment.thickness,
            width: config.segment.width,
            trackType: config.trackType,
          };
        });

        setSegments(segments);
        setFacility(null);
        return;
      }

      setSegments([]);

      if (tool === "station" || tool === "depot") {
        const radius = FACILITY_RADIUS[tool];
        if (radius) {
          setFacility({
            position: [snappedPos.x, 0, snappedPos.z],
            radius,
            color: tool === "station" ? "#f5c66a" : "#c18b5a",
          });
        } else {
          setFacility(null);
        }
      } else {
        setFacility(null);
      }

      setQuery(null);
    },
    [
      findNodeAtPosition,
      getSignalsForEdge,
      graph,
      setFacility,
      setGhostPosition,
      setQuery,
      setSegments,
      setValidPlacement,
      tool,
    ],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!hasActiveTool) {
        lastWorldPositionRef.current = null;
        setHoverPosition(null);
        setGhostPosition(null);
        setIsValid(false);
        setValidPlacement(false);
        setSignalCandidate(null);
        reset();
        return;
      }

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const mouseNDC = new Vector2(x, y);
      const worldPos = raycast(mouseNDC);

      const modifiers: ModifierState = {
        alt: event.altKey,
        shift: event.shiftKey,
      };

      setModifierState((prev) => {
        if (prev.alt === modifiers.alt && prev.shift === modifiers.shift) {
          return prev;
        }
        return modifiers;
      });

      if (worldPos) {
        lastWorldPositionRef.current = worldPos.clone();
      } else {
        lastWorldPositionRef.current = null;
      }

      if (tool === "query") {
        setHoverPosition(null);
        setGhostPosition(null);
        setIsValid(false);
        setValidPlacement(false);

        if (!worldPos) {
          setQuery(null);
          setSegments([]);
          setFacility(null);
          return;
        }

        const settlement = findNearestSettlement(worldPos, QUERY_SEARCH_RADIUS);
        if (settlement) {
          setQuery({ settlement });
        } else {
          setQuery(null);
        }
        setSegments([]);
        setFacility(null);
        return;
      }

      setQuery(null);
      recomputePlacement(worldPos, modifiers);
    },
    [
      gl.domElement,
      hasActiveTool,
      raycast,
      recomputePlacement,
      reset,
      setFacility,
      setGhostPosition,
      setQuery,
      setSegments,
      setValidPlacement,
      tool,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Alt" && event.key !== "Shift") {
        return;
      }
      setModifierState((prev) => {
        const next: ModifierState = {
          alt: event.key === "Alt" ? true : prev.alt,
          shift: event.key === "Shift" ? true : prev.shift,
        };
        if (prev.alt === next.alt && prev.shift === next.shift) {
          return prev;
        }
        return next;
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Alt" && event.key !== "Shift") {
        return;
      }
      setModifierState((prev) => {
        const next: ModifierState = {
          alt: event.key === "Alt" ? false : prev.alt,
          shift: event.key === "Shift" ? false : prev.shift,
        };
        if (prev.alt === next.alt && prev.shift === next.shift) {
          return prev;
        }
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isPlacementTool) {
      setSegments([]);
      setFacility(null);
    }

    if (tool !== "query") {
      setQuery(null);
    }
  }, [isPlacementTool, setFacility, setSegments, setQuery, tool]);

  useEffect(() => {
    if (!isPlacementTool) {
      return;
    }

    const lastWorld = lastWorldPositionRef.current;
    if (!lastWorld) {
      return;
    }

    recomputePlacement(lastWorld.clone(), modifierState);
  }, [isPlacementTool, modifierState, recomputePlacement]);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isPlacementTool || !hoverPosition) {
        return;
      }

      if (tool === "signal") {
        if (!signalCandidate) {
          return;
        }

        event.stopPropagation();

        const { existingSignal, position, rotationY, edgeId } = signalCandidate;

        if (existingSignal) {
          const samePlacement =
            calculateDistance(existingSignal.position, position) < 1e-3 &&
            Math.abs(existingSignal.rotationY - rotationY) < 1e-3;

          const visualId = existingSignal.visualEntityId;
          if (visualId) {
            const entity = unregisterVisualEntity(visualId);
            if (entity) {
              world.remove(entity);
            }
          }

          removeSignal(existingSignal.id);

          if (!samePlacement) {
            const newVisualId = createSignalVisual(position, rotationY);
            addSignal({
              ...existingSignal,
              edgeId,
              position,
              rotationY,
              visualEntityId: newVisualId,
            });
          }

          const lastWorld = lastWorldPositionRef.current;
          if (lastWorld) {
            recomputePlacement(lastWorld.clone(), modifierState);
          } else {
            setSignalCandidate(null);
            setHoverPosition(null);
            setGhostPosition(null);
            setIsValid(false);
            setValidPlacement(false);
          }

          return;
        }

        const visualId = createSignalVisual(position, rotationY);
        addSignal({
          id: nanoid(),
          edgeId,
          direction: "forward",
          position,
          rotationY,
          visualEntityId: visualId,
        });

        if (lastWorldPositionRef.current) {
          recomputePlacement(
            lastWorldPositionRef.current.clone(),
            modifierState,
          );
        }
        return;
      }

      const nodePosition: [number, number, number] = [
        hoverPosition.x,
        hoverPosition.y,
        hoverPosition.z,
      ];
      const existing = findNodeAtPosition(nodePosition, NODE_TOLERANCE);

      if (!determinePlacementValidity(tool, existing, null)) {
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
      addSignal,
      createSignalVisual,
      demolishStructure,
      findNodeAtPosition,
      hoverPosition,
      isPlacementTool,
      modifierState,
      placeStructure,
      removeSignal,
      recomputePlacement,
      signalCandidate,
      tool,
      unregisterVisualEntity,
      setGhostPosition,
      setValidPlacement,
      world,
    ],
  );

  // Validate placement validity when hover position changes
  useEffect(() => {
    if (!isPlacementTool || !hoverPosition) {
      return;
    }

    const nodePosition: [number, number, number] = [
      hoverPosition.x,
      hoverPosition.y,
      hoverPosition.z,
    ];
    const existing = findNodeAtPosition(nodePosition, NODE_TOLERANCE);
    const valid = determinePlacementValidity(tool, existing, signalCandidate);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsValid(valid);
    setValidPlacement(valid);
  }, [
    findNodeAtPosition,
    hoverPosition,
    isPlacementTool,
    setValidPlacement,
    signalCandidate,
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
    isActive: isPlacementTool,
  };
}
