import { DoubleSide } from "three";

import { useConstruction } from "../state/slices/construction";
import { useToolPreviewStore } from "../state/slices/toolPreview";

/**
 * Renders a semi-transparent preview of the building/track being placed.
 * Color changes based on placement validity (green=valid, red=invalid).
 */
export function GhostPreview() {
  const tool = useConstruction((state) => state.tool);
  const ghostPosition = useConstruction((state) => state.ghostPosition);
  const isValidPlacement = useConstruction((state) => state.isValidPlacement);
  const previewSegments = useToolPreviewStore((state) => state.segments);
  const facilityPreview = useToolPreviewStore((state) => state.facility);

  const hasGhost =
    tool !== "none" && tool !== "query" && ghostPosition !== null;
  const hasSegments = previewSegments.length > 0;
  const hasFacility = Boolean(facilityPreview);

  if (!hasGhost && !hasSegments && !hasFacility) {
    return null;
  }

  const color = isValidPlacement ? "#4a7c59" : "#c24747";

  // Different preview shapes for different tools
  const renderPreview = () => {
    if (!ghostPosition || !hasGhost) {
      return null;
    }

    const [x, y, z] = ghostPosition;

    switch (tool) {
      case "rail":
        return (
          <mesh position={[x, y + 0.05, z]}>
            <cylinderGeometry args={[1.6, 1.6, 0.25, 24]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.55}
              emissive={color}
              emissiveIntensity={0.35}
            />
          </mesh>
        );

      case "road":
        return (
          <mesh position={[x, y + 0.05, z]}>
            <cylinderGeometry args={[2, 2, 0.2, 20]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.5}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
        );

      case "station":
        return (
          <mesh position={[x, y + 2, z]}>
            <boxGeometry args={[20, 4, 10]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.6}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
        );

      case "depot":
        return (
          <mesh position={[x, y + 2, z]}>
            <boxGeometry args={[15, 4, 15]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.6}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
        );

      case "signal":
        return (
          <group position={[x, y + 1.2, z]}>
            <mesh>
              <boxGeometry args={[0.4, 2, 0.4]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={0.7}
                emissive={color}
                emissiveIntensity={0.4}
              />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
              <boxGeometry args={[0.6, 0.4, 0.6]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={0.8}
                emissive={color}
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        );

      case "demolish":
        return (
          <group position={[x, y + 1, z]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[8, 0.5, 0.5]} />
              <meshStandardMaterial color="#ff0000" transparent opacity={0.8} />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[8, 0.5, 0.5]} />
              <meshStandardMaterial color="#ff0000" transparent opacity={0.8} />
            </mesh>
          </group>
        );

      default:
        return null;
    }
  };

  const segmentColor: Record<string, string> = {
    rail: "#6bd49b",
    road: "#b0b0b0",
  };

  return (
    <>
      {renderPreview()}
      {previewSegments.map((segment) => {
        const colorKey = segment.trackType;
        const segColor = segmentColor[colorKey] ?? "#6bd49b";
        return (
          <mesh
            key={`preview-segment-${segment.id}`}
            position={segment.midpoint}
            rotation={[0, segment.rotationY, 0]}
          >
            <boxGeometry
              args={[segment.length, segment.thickness, segment.width]}
            />
            <meshStandardMaterial
              color={segColor}
              transparent
              opacity={0.35}
              emissive={segColor}
              emissiveIntensity={0.25}
            />
          </mesh>
        );
      })}
      {facilityPreview ? (
        <group
          position={[
            facilityPreview.position[0],
            facilityPreview.position[1] + 0.05,
            facilityPreview.position[2],
          ]}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[facilityPreview.radius - 2, facilityPreview.radius, 64]}
            />
            <meshStandardMaterial
              color={facilityPreview.color}
              transparent
              opacity={0.35}
              side={DoubleSide}
              emissive={facilityPreview.color}
              emissiveIntensity={0.15}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <ringGeometry
              args={[
                facilityPreview.radius * 0.35,
                facilityPreview.radius * 0.5,
                48,
              ]}
            />
            <meshStandardMaterial
              color={facilityPreview.color}
              transparent
              opacity={0.15}
              side={DoubleSide}
            />
          </mesh>
        </group>
      ) : null}
    </>
  );
}
