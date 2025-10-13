import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Object3D } from "three";
import type { Entity } from "@/game/ecs/world";

export function useEntityTransformSync(
  entity: Entity,
  ref: React.RefObject<Object3D | null>,
) {
  const transformRef = useRef(entity.Transform);

  useFrame(() => {
    const object = ref.current;
    const transform = entity.Transform;

    if (!object || !transform) {
      return;
    }

    transformRef.current = transform;

    const position = transform.position;
    if (position) {
      object.position.set(position[0], position[1], position[2]);
    }

    const rotation = transform.rotation;
    if (rotation) {
      object.rotation.set(rotation[0] ?? 0, rotation[1] ?? 0, rotation[2] ?? 0);
    }

    const scale = transform.scale;
    if (scale) {
      object.scale.set(scale[0] ?? 1, scale[1] ?? 1, scale[2] ?? 1);
    }
  });
}
