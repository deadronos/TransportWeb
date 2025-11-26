import { useRef } from "react";
import type { Group } from "three";
import type { Entity } from "../ecs/world";
import { useEntityTransformSync } from "./useEntityTransformSync";

interface RoadSegmentProps {
  entity: Entity;
  dimensions: [number, number, number];
}

const ASPHALT_COLOR = "#3a3a3a";
const CURB_COLOR = "#6b6b6b";
const MARKING_COLOR = "#e8e8e8";
const ROAD_HEIGHT = 0.08;
const CURB_HEIGHT = 0.12;
const CURB_WIDTH = 0.25;
const MARKING_WIDTH = 0.15;

/**
 * Road segment with asphalt surface, curbs, and center line marking.
 * Creates a realistic road appearance for transport networks.
 */
export function RoadSegment({ entity, dimensions }: RoadSegmentProps) {
  const groupRef = useRef<Group | null>(null);
  useEntityTransformSync(entity, groupRef);

  const [length, , width] = dimensions;
  const roadWidth = Math.max(width, 4);

  return (
    <group ref={groupRef}>
      {/* Road bed/foundation */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[length, 0.04, roadWidth + 0.6]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>

      {/* Main asphalt surface */}
      <mesh position={[0, ROAD_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[length, ROAD_HEIGHT, roadWidth]} />
        <meshStandardMaterial color={ASPHALT_COLOR} />
      </mesh>

      {/* Left curb */}
      <mesh position={[0, CURB_HEIGHT / 2, -roadWidth / 2 - CURB_WIDTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[length, CURB_HEIGHT, CURB_WIDTH]} />
        <meshStandardMaterial color={CURB_COLOR} />
      </mesh>

      {/* Right curb */}
      <mesh position={[0, CURB_HEIGHT / 2, roadWidth / 2 + CURB_WIDTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[length, CURB_HEIGHT, CURB_WIDTH]} />
        <meshStandardMaterial color={CURB_COLOR} />
      </mesh>

      {/* Center line marking (dashed appearance through multiple segments) */}
      {length > 3 && (
        <mesh position={[0, ROAD_HEIGHT + 0.01, 0]} receiveShadow>
          <boxGeometry args={[length * 0.7, 0.02, MARKING_WIDTH]} />
          <meshStandardMaterial color={MARKING_COLOR} />
        </mesh>
      )}
    </group>
  );
}
