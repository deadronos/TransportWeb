import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, Grid } from '@react-three/drei';
import { useEffect } from 'react';
import { nanoid } from 'nanoid';
import { WorldProvider, useWorld } from './ecs/world';
import { useTimeSystem } from './ecs/systems/time';
import { SceneGraph } from './SceneGraph';
import { useConstruction } from './state/slices/construction';
import { Terrain } from './scene/Terrain';
import { GhostPreview } from './scene/GhostPreview';
import { useConstructionMode } from './hooks/useConstructionMode';

function Simulation() {
  const world = useWorld();
  const showGrid = useConstruction((state) => state.showGrid);
  useTimeSystem(world);

  // Enable construction mode interactions
  useConstructionMode();

  useEffect(() => {
    world.add({
      id: nanoid(),
      Transform: { position: [0, 0.5, 0] },
      Renderable: { kind: 'vehicle' },
      Vehicle: { speed: 0, accel: 0.5, maxSpeed: 2, type: 'train' },
    });
  }, [world]);

  return (
    <>
      <Terrain />
      <SceneGraph />
      <GhostPreview />
      {/* Construction grid - toggleable */}
      <Grid
        visible={showGrid}
        args={[1000, 1000]}
        cellSize={10}
        cellThickness={0.5}
        cellColor="#888888"
        sectionSize={50}
        sectionThickness={1}
        sectionColor="#666666"
        fadeDistance={500}
        fadeStrength={1}
      />
      {/* Base terrain grid - always visible */}
      <Grid infiniteGrid cellSize={1} cellThickness={0.5} sectionSize={5} fadeDistance={50} />
    </>
  );
}

export function GameCanvas() {
  return (
    <WorldProvider>
      <Canvas
        shadows
        camera={{ position: [12, 12, 12], fov: 50 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <color attach="background" args={['#1a1a1a']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.1} castShadow />
        <Simulation />
        <OrbitControls
          makeDefault
          enableDamping
          minPolarAngle={Math.PI / 6} // ~30° from horizontal (isometric style)
          maxPolarAngle={Math.PI / 3} // ~60° max
          minDistance={10}
          maxDistance={200}
        />
        <Stats />
      </Canvas>
    </WorldProvider>
  );
}
