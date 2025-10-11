import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, Grid } from '@react-three/drei';
import { useEffect } from 'react';
import { nanoid } from 'nanoid';
import { WorldProvider, useWorld } from './ecs/world';
import { useTimeSystem } from './ecs/systems/time';
import { SceneGraph } from './SceneGraph';

function Simulation() {
  const world = useWorld();
  useTimeSystem(world);

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
      <SceneGraph />
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
        <OrbitControls makeDefault enableDamping />
        <Stats />
      </Canvas>
    </WorldProvider>
  );
}
