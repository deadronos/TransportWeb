import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import { World } from "miniplex";
import type { Path } from "@/game/network/pathfinding";

export type Entity = {
  id: string;
  Transform?: {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  };
  Renderable?: {
    kind:
      | "track"
      | "road"
      | "station"
      | "depot"
      | "signal"
      | "vehicle"
      | "tree"
      | "town"
      | "farm"
      | "industry"
      | "mine";
    meshId?: string;
    dimensions?: [number, number, number];
    color?: string;
  };
  Vehicle?: {
    speed: number;
    accel: number;
    maxSpeed: number;
    capacity: number;
    type: "train" | "truck";
    assignment?: {
      lineId: string | null;
      nextStopIndex: number;
      direction: 1 | -1;
    };
    route?: {
      state: "idle" | "moving" | "waiting" | "blocked";
      currentNodeId: string | null;
      targetNodeId: string | null;
      path: Path | null;
      currentEdgeIndex: number;
      distanceAlongEdge: number;
      dwellTimeRemaining: number;
      blockedEdgeId?: string | null;
    };
  };
};

const WorldContext = createContext<World<Entity> | null>(null);

export const useWorld = () => {
  const world = useContext(WorldContext);
  if (!world) {
    throw new Error("useWorld must be used within WorldProvider");
  }
  return world;
};

export const WorldProvider = ({ children }: PropsWithChildren) => {
  const world = useMemo(() => new World<Entity>(), []);
  return (
    <WorldContext.Provider value={world}>{children}</WorldContext.Provider>
  );
};
