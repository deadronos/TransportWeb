import { useConstruction } from "../state/slices/construction";

/**
 * Renders a semi-transparent preview of the building/track being placed.
 * Color changes based on placement validity (green=valid, red=invalid).
 */
export function GhostPreview() {
  const tool = useConstruction((state) => state.tool);
  const ghostPosition = useConstruction((state) => state.ghostPosition);
  const isValidPlacement = useConstruction((state) => state.isValidPlacement);

  // Don't render if no tool selected or no ghost position
  if (tool === "none" || tool === "query" || !ghostPosition) {
    return null;
  }

  const [x, y, z] = ghostPosition;
  const color = isValidPlacement ? "#4a7c59" : "#c24747";

  // Different preview shapes for different tools
  const renderPreview = () => {
    switch (tool) {
      case "rail":
        // Preview: Long thin box for track segment
        return (
          <mesh position={[x, y + 0.1, z]}>
            <boxGeometry args={[10, 0.2, 2]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.6}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
        );

      case "road":
        // Preview: Wide flat box for road segment
        return (
          <mesh position={[x, y + 0.05, z]}>
            <boxGeometry args={[10, 0.1, 4]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.6}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
        );

      case "station":
        // Preview: Building footprint (20x10 for train station)
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
        // Preview: Depot building (15x15 square)
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

      case "demolish":
        // Preview: Red X indicator
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

  return <>{renderPreview()}</>;
}
