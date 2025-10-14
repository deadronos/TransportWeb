import { useRef } from "react";
import { useWorld, type Entity } from "./ecs/world";
import type { Mesh } from "three";
import { useEntityTransformSync } from "./scene/useEntityTransformSync";
import {
  SettlementPlaceholder,
  SETTLEMENT_PLACEHOLDER_DESCRIPTORS,
  type SettlementRenderableKind,
} from "./scene/settlementPlaceholders";

export function SceneGraph() {
  const world = useWorld();
  const entities = world.with("Transform", "Renderable");

  const colorByKind: Record<string, string> = {
    track: "#6f7a8a",
    road: "#505050",
    station: "#d1a054",
    depot: "#8c6239",
    signal: "#ffcc33",
    vehicle: "#c0392b",
    tree: "#2d8659",
    town: "#f6c177",
    farm: "#d26a52",
    industry: "#7f8fa6",
    mine: "#4b4b4b",
  };

  const settlementKinds = new Set<SettlementRenderableKind>(
    Object.keys(
      SETTLEMENT_PLACEHOLDER_DESCRIPTORS,
    ) as SettlementRenderableKind[],
  );

  // Small per-entity mesh that syncs the underlying Three.js object
  // from the entity's Transform each frame. We avoid relying on React
  // re-renders for position updates because the ECS mutates arrays in
  // place for performance.
  function EntityMesh({
    entity,
    dimensions,
    color,
  }: {
    entity: Entity;
    dimensions: [number, number, number];
    color: string;
  }) {
    const meshRef = useRef<Mesh | null>(null);
    useEntityTransformSync(entity, meshRef);

    return (
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={dimensions} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }

  return (
    <>
      {[...entities].map((entity) => {
        const transform = entity.Transform;
        const renderable = entity.Renderable;

        if (!transform || !renderable) return null;

        const dimensions = renderable.dimensions ?? [1, 1, 1];
        const color =
          renderable.color ?? colorByKind[renderable.kind] ?? "#888888";

        if (settlementKinds.has(renderable.kind as SettlementRenderableKind)) {
          return (
            <SettlementPlaceholder
              key={entity.id}
              entity={entity}
              kind={renderable.kind as SettlementRenderableKind}
            />
          );
        }

        return (
          <EntityMesh
            key={entity.id}
            entity={entity}
            dimensions={dimensions}
            color={color}
          />
        );
      })}
    </>
  );
}
