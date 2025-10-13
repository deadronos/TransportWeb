import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stats, Grid } from "@react-three/drei";
import { useEffect, useRef, type RefObject } from "react";
import { nanoid } from "nanoid";
import { useWorld } from "./ecs/world";
import { useTimeSystem } from "./ecs/systems/time";
import { SceneGraph } from "./SceneGraph";
import { useConstruction } from "./state/slices/construction";
import { Terrain } from "./scene/Terrain";
import { GhostPreview } from "./scene/GhostPreview";
import { useConstructionMode } from "./hooks/useConstructionMode";
import { useDebug } from "./state/slices/debug";
import { DebugPanel } from "./ui/DebugPanel";
import { useUIStore } from "./state/slices/ui";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

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
      Renderable: { kind: "vehicle" },
      Vehicle: {
        speed: 0,
        accel: 0.5,
        maxSpeed: 2,
        capacity: 80,
        type: "train",
        route: {
          state: "idle",
          currentNodeId: null,
          targetNodeId: null,
          path: null,
          currentEdgeIndex: 0,
          distanceAlongEdge: 0,
          dwellTimeRemaining: 0,
        },
      },
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
      <Grid
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        sectionSize={5}
        fadeDistance={50}
      />
    </>
  );
}

export function GameCanvas() {
  const showStats = useDebug((state) => state.showStats);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [12, 12, 12], fov: 50 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#1a1a1a"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.1} castShadow />
        <Simulation />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          minPolarAngle={Math.PI / 6} // ~30° from horizontal (isometric style)
          maxPolarAngle={Math.PI / 3} // ~60° max
          minDistance={10}
          maxDistance={200}
        />
        <CameraTracker controlsRef={controlsRef} />
        {showStats && <Stats />}
      </Canvas>
      <DebugPanel />
    </>
  );
}

const EPSILON = 1e-4;

function CameraTracker({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const setCameraInfo = useUIStore((state) => state.setCameraInfo);
  const registerCameraRecenter = useUIStore(
    (state) => state.registerCameraRecenter,
  );
  const { camera } = useThree();
  const tempTarget = useRef(new Vector3());
  const offset = useRef(new Vector3());

  useEffect(() => {
    let rafHandle: number | null = null;

    const register = () => {
      const controls = controlsRef.current;
      if (!controls) {
        rafHandle = requestAnimationFrame(register);
        return;
      }

      registerCameraRecenter(([x, y, z]) => {
        const currentTarget = controls.target.clone();
        offset.current.copy(camera.position).sub(currentTarget);
        controls.target.set(x, y, z);
        camera.position.set(
          x + offset.current.x,
          y + offset.current.y,
          z + offset.current.z,
        );
        controls.update();
      });
    };

    register();

    return () => {
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
      }
    };
  }, [camera, controlsRef, registerCameraRecenter]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (controls) {
      tempTarget.current.copy(controls.target);
    } else {
      tempTarget.current.set(0, 0, 0);
    }

    const target = tempTarget.current;
    const position = camera.position;
    const azimuth = Math.atan2(position.x - target.x, position.z - target.z);

    const state = useUIStore.getState();
    const positionChanged =
      Math.abs(state.cameraPosition[0] - position.x) > EPSILON ||
      Math.abs(state.cameraPosition[1] - position.y) > EPSILON ||
      Math.abs(state.cameraPosition[2] - position.z) > EPSILON;

    const targetChanged =
      Math.abs(state.cameraTarget[0] - target.x) > EPSILON ||
      Math.abs(state.cameraTarget[1] - target.y) > EPSILON ||
      Math.abs(state.cameraTarget[2] - target.z) > EPSILON;

    const azimuthChanged = Math.abs(state.cameraAzimuth - azimuth) > EPSILON;

    if (positionChanged || targetChanged || azimuthChanged) {
      setCameraInfo({
        position: [position.x, position.y, position.z],
        target: [target.x, target.y, target.z],
        azimuth,
      });
    }
  });

  return null;
}
