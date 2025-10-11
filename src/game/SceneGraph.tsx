import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useWorld, type Entity } from "./ecs/world";
import type { Mesh } from "three";

export function SceneGraph() {
  const world = useWorld();
  const entities = world.with("Transform", "Renderable");

  const colorByKind: Record<string, string> = {
    track: "#6f7a8a",
    road: "#505050",
    station: "#d1a054",
    depot: "#8c6239",
    vehicle: "#c0392b",
    tree: "#2d8659",
  };

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

    useFrame(() => {
      const t = entity.Transform;
      const m = meshRef.current;
      if (!t || !m) return;

      const p = t.position;
      if (p) {
        m.position.set(p[0], p[1], p[2]);
      }

      const r = t.rotation;
      if (r) {
        m.rotation.set(r[0] ?? 0, r[1] ?? 0, r[2] ?? 0);
      }

      const s = t.scale;
      if (s) {
        m.scale.set(s[0] ?? 1, s[1] ?? 1, s[2] ?? 1);
      }
    });

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
