import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { World } from "miniplex";
import type { Entity } from "../world";
import { useClock } from "@/game/state/slices/clock";
import { advanceVehicleSimulation } from "./vehicleRoutes";
import { advanceEconomySimulation } from "@/game/simulation/economy";

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
  const { advanceTime } = useClock.getState();
  advanceTime(dt);
  advanceVehicleSimulation(world, dt);
  advanceEconomySimulation(dt);
}
