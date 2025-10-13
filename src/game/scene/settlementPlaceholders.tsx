import { useRef } from "react";
import type { Group } from "three";
import { useEntityTransformSync } from "./useEntityTransformSync";
import type { Entity } from "@/game/ecs/world";

export type SettlementRenderableKind = Extract<
  NonNullable<Entity["Renderable"]>["kind"],
  "town" | "farm" | "industry" | "mine"
>;

type PlaceholderDescriptor =
  | {
      geometry: "box";
      args: [number, number, number];
      position: [number, number, number];
      rotation?: [number, number, number];
      color: string;
      castShadow?: boolean;
    }
  | {
      geometry: "cylinder";
      args: [number, number, number, number?];
      position: [number, number, number];
      rotation?: [number, number, number];
      color: string;
      castShadow?: boolean;
    }
  | {
      geometry: "cone";
      args: [number, number, number?];
      position: [number, number, number];
      rotation?: [number, number, number];
      color: string;
      castShadow?: boolean;
    };

export const SETTLEMENT_PLACEHOLDER_DESCRIPTORS: Record<
  SettlementRenderableKind,
  PlaceholderDescriptor[]
> = {
  town: [
    {
      geometry: "box",
      args: [1.6, 2.4, 1.6],
      position: [-0.9, 1.2, -0.4],
      color: "#f6c177",
    },
    {
      geometry: "box",
      args: [1.4, 3.2, 1.4],
      position: [0.8, 1.6, 0.5],
      color: "#f4a259",
    },
    {
      geometry: "box",
      args: [1.2, 1.8, 1.2],
      position: [0.2, 0.9, -1],
      color: "#f28482",
    },
    {
      geometry: "box",
      args: [1.6, 0.4, 1.6],
      position: [-0.9, 2.2, -0.4],
      color: "#3a3a3a",
    },
    {
      geometry: "box",
      args: [1.4, 0.4, 1.4],
      position: [0.8, 3.2, 0.5],
      color: "#3a3a3a",
    },
  ],
  farm: [
    {
      geometry: "box",
      args: [2.8, 1.6, 2.2],
      position: [0, 0.8, 0],
      color: "#d26a52",
    },
    {
      geometry: "box",
      args: [2.8, 0.6, 2.2],
      position: [0, 1.6, 0],
      color: "#8b3a2b",
    },
    {
      geometry: "cylinder",
      args: [0.55, 0.55, 2.4, 12],
      position: [1.8, 1.2, -0.6],
      color: "#d7d3c8",
    },
    {
      geometry: "cone",
      args: [0.6, 0.6, 12],
      position: [1.8, 2.4, -0.6],
      color: "#9d9481",
    },
  ],
  industry: [
    {
      geometry: "box",
      args: [3.2, 1.4, 2.4],
      position: [0, 0.7, 0],
      color: "#7f8fa6",
    },
    {
      geometry: "box",
      args: [1.2, 2.4, 1.2],
      position: [-1.1, 1.9, 0.5],
      color: "#596275",
    },
    {
      geometry: "cylinder",
      args: [0.45, 0.45, 3.4, 16],
      position: [1.4, 1.7, -0.8],
      color: "#d1d8e0",
    },
    {
      geometry: "box",
      args: [1, 0.4, 1.6],
      position: [0.6, 1.5, 0.8],
      color: "#a5b1c2",
    },
  ],
  mine: [
    {
      geometry: "box",
      args: [3.4, 0.6, 3],
      position: [0, 0.3, 0],
      color: "#4b4b4b",
    },
    {
      geometry: "box",
      args: [2.2, 0.2, 1.8],
      position: [-0.6, 0.6, 0.2],
      rotation: [-0.4, 0, 0],
      color: "#2e2e2e",
    },
    {
      geometry: "box",
      args: [0.35, 2.6, 0.35],
      position: [1.4, 1.3, -0.2],
      color: "#616161",
    },
    {
      geometry: "box",
      args: [1.2, 0.2, 0.3],
      position: [0.8, 1.9, -0.2],
      color: "#3d3d3d",
    },
    {
      geometry: "cylinder",
      args: [0.35, 0.35, 0.6, 12],
      position: [0.8, 1.2, -0.2],
      color: "#b0b0b0",
    },
  ],
};

export function SettlementPlaceholder({
  entity,
  kind,
}: {
  entity: Entity;
  kind: SettlementRenderableKind;
}) {
  const groupRef = useRef<Group | null>(null);
  useEntityTransformSync(entity, groupRef);

  return (
    <group ref={groupRef} castShadow receiveShadow>
      {SETTLEMENT_PLACEHOLDER_DESCRIPTORS[kind].map((piece, index) => {
        const key = `${kind}-${index}`;
        if (piece.geometry === "box") {
          return (
            <mesh
              key={key}
              position={piece.position}
              rotation={piece.rotation}
              castShadow={piece.castShadow ?? true}
              receiveShadow
            >
              <boxGeometry args={piece.args} />
              <meshStandardMaterial color={piece.color} />
            </mesh>
          );
        }
        if (piece.geometry === "cylinder") {
          return (
            <mesh
              key={key}
              position={piece.position}
              rotation={piece.rotation}
              castShadow={piece.castShadow ?? true}
              receiveShadow
            >
              <cylinderGeometry args={piece.args} />
              <meshStandardMaterial color={piece.color} />
            </mesh>
          );
        }
        return (
          <mesh
            key={key}
            position={piece.position}
            rotation={piece.rotation}
            castShadow={piece.castShadow ?? true}
            receiveShadow
          >
            <coneGeometry args={piece.args} />
            <meshStandardMaterial color={piece.color} />
          </mesh>
        );
      })}
    </group>
  );
}
