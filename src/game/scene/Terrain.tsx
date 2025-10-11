import { useMemo } from 'react';
import { DoubleSide } from 'three';

export function Terrain() {
  // Create a simple grass-colored plane
  const grassMaterial = useMemo(() => {
    return {
      color: '#2d5016', // Grass green from research
      roughness: 0.8,
      metalness: 0.0,
    };
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[500, 500, 50, 50]} />
      <meshStandardMaterial {...grassMaterial} side={DoubleSide} />
    </mesh>
  );
}
