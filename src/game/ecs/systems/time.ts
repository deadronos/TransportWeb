import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { World } from "miniplex";
import type { Entity } from "../world";
import { useClock } from "../state/slices/clock";

const FIXED_DT = 1 / 60; // 60fps fixed timestep

export function useTimeSystem(world: World<Entity>) {
  const accumulator = useRef(0);
  const lastTime = useRef<number | null>(null);

  // Read clock state inside the render loop so we always use the
  // latest speed/paused values.
  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    const prev = lastTime.current ?? now;
    const rawDt = now - prev;
    lastTime.current = now;

    // multiply by game speed from clock slice
    const { speed, paused } = useClock.getState();
    if (paused) return;

    const scaledDt = rawDt * speed;
    accumulator.current += scaledDt;

    while (accumulator.current >= FIXED_DT) {
      tick(world, FIXED_DT);
      accumulator.current -= FIXED_DT;
    }
  });
}

function tick(world: World<Entity>, dt: number) {
  for (const entity of world.with("Vehicle", "Transform")) {
    const vehicle = entity.Vehicle;
    const transform = entity.Transform;

    if (!vehicle || !transform) continue;

    vehicle.speed = Math.min(
      vehicle.maxSpeed,
      vehicle.speed + vehicle.accel * dt,
    );
    transform.position[0] += vehicle.speed * dt;
  }
}
