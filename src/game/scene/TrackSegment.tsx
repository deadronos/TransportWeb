import { useRef } from "react";
import type { Group } from "three";
import type { Entity } from "../ecs/world";
import { useEntityTransformSync } from "./useEntityTransformSync";

interface TrackSegmentProps {
  entity: Entity;
  dimensions: [number, number, number];
}

const RAIL_COLOR = "#4a4a4a";
const SLEEPER_COLOR = "#5c4033";
const RAIL_WIDTH = 0.15;
const RAIL_HEIGHT = 0.12;
const GAUGE = 1.4;
const SLEEPER_WIDTH = 2.2;
const SLEEPER_HEIGHT = 0.08;
const SLEEPER_DEPTH = 0.4;
const SLEEPER_SPACING = 1.2;

/**
 * Railroad track segment with two rails and sleepers (ties).
 * Creates a realistic rail appearance for transport networks.
 */
export function TrackSegment({ entity, dimensions }: TrackSegmentProps) {
  const groupRef = useRef<Group | null>(null);
  useEntityTransformSync(entity, groupRef);

  const [length] = dimensions;
  const sleeperCount = Math.max(2, Math.floor(length / SLEEPER_SPACING));
  const sleeperStep = length / (sleeperCount + 1);

  const sleepers: number[] = [];
  for (let i = 1; i <= sleeperCount; i++) {
    sleepers.push(-length / 2 + i * sleeperStep);
  }

  return (
    <group ref={groupRef}>
      {/* Ballast bed - gravel foundation */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[length, 0.1, 2.6]} />
        <meshStandardMaterial color="#6b6b6b" />
      </mesh>

      {/* Sleepers/ties */}
      {sleepers.map((xPos, index) => (
        <mesh key={`sleeper-${index}`} position={[xPos, 0.04, 0]} receiveShadow castShadow>
          <boxGeometry args={[SLEEPER_DEPTH, SLEEPER_HEIGHT, SLEEPER_WIDTH]} />
          <meshStandardMaterial color={SLEEPER_COLOR} />
        </mesh>
      ))}

      {/* Left rail */}
      <mesh position={[0, 0.1, -GAUGE / 2]} castShadow>
        <boxGeometry args={[length, RAIL_HEIGHT, RAIL_WIDTH]} />
        <meshStandardMaterial color={RAIL_COLOR} />
      </mesh>

      {/* Right rail */}
      <mesh position={[0, 0.1, GAUGE / 2]} castShadow>
        <boxGeometry args={[length, RAIL_HEIGHT, RAIL_WIDTH]} />
        <meshStandardMaterial color={RAIL_COLOR} />
      </mesh>
    </group>
  );
}
