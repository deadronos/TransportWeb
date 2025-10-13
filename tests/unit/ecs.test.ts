import { describe, it, expect } from "vitest";
import { World } from "miniplex";
import type { Entity } from "@/game/ecs/world";

describe("ECS World", () => {
  it("should create entities with components", () => {
    const world = new World<Entity>();

    const entity = world.add({
      id: "test-1",
      Transform: { position: [0, 0, 0] },
      Renderable: { kind: "vehicle" },
    });

    expect(entity.id).toBe("test-1");
    expect(entity.Transform?.position).toEqual([0, 0, 0]);
    expect(entity.Renderable?.kind).toBe("vehicle");
  });

  it("should query entities by components", () => {
    const world = new World<Entity>();

    world.add({ id: "1", Transform: { position: [0, 0, 0] } });
    world.add({
      id: "2",
      Transform: { position: [1, 1, 1] },
      Vehicle: {
        speed: 0,
        accel: 1,
        maxSpeed: 5,
        capacity: 80,
        type: "train",
      },
    });
    world.add({ id: "3", Renderable: { kind: "tree" } });

    const withTransform = [...world.with("Transform")];
    const withVehicle = [...world.with("Vehicle", "Transform")];

    expect(withTransform).toHaveLength(2);
    expect(withVehicle).toHaveLength(1);
    expect(withVehicle[0]?.id).toBe("2");
  });
});
