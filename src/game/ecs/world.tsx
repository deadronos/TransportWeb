import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import { World } from "miniplex";

export type Entity = {
  id: string;
  Transform?: {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  };
  Renderable?: {
    kind: "track" | "road" | "station" | "depot" | "vehicle" | "tree";
    meshId?: string;
    dimensions?: [number, number, number];
    color?: string;
  };
  Vehicle?: {
    speed: number;
    accel: number;
    maxSpeed: number;
    type: "train" | "truck";
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
