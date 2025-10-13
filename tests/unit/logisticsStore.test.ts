import { beforeEach, describe, expect, it } from "vitest";
import { useLogisticsStore } from "@/game/state/slices/logistics";

describe("logistics store", () => {
  beforeEach(() => {
    useLogisticsStore.setState({ lines: [], vehicles: [] });
  });

  it("creates lines with unique stops and enforces minimum length", () => {
    const store = useLogisticsStore.getState();
    const line = store.createLine({
      name: "Loop",
      mode: "train",
      stops: [
        { nodeId: "a", label: "A", dwellSeconds: 45 },
        { nodeId: "a", label: "A duplicate", dwellSeconds: 45 },
        { nodeId: "b", label: "B", dwellSeconds: 45 },
      ],
    });

    expect(line.stops).toHaveLength(2);
    expect(line.stops.map((stop) => stop.nodeId)).toEqual(["a", "b"]);
    expect(useLogisticsStore.getState().lines).toContain(line);
  });

  it("assigns vehicles to lines and updates status", () => {
    const store = useLogisticsStore.getState();

    const line = store.createLine({
      name: "Mainline",
      mode: "truck",
      stops: [
        { nodeId: "hub", label: "Hub", dwellSeconds: 30 },
        { nodeId: "town", label: "Town", dwellSeconds: 30 },
      ],
    });

    store.registerVehicle({
      entityId: "veh-1",
      type: "truck",
      name: "Truck 1",
      lineId: null,
      status: "idle",
      maxSpeed: 3,
      capacity: 40,
      purchaseCost: 48000,
    });

    store.assignVehicleToLine("veh-1", line.id);
    expect(
      useLogisticsStore
        .getState()
        .vehicles.find((vehicle) => vehicle.entityId === "veh-1")?.lineId,
    ).toBe(line.id);

    store.updateVehicleStatus("veh-1", "enroute");
    expect(
      useLogisticsStore
        .getState()
        .vehicles.find((vehicle) => vehicle.entityId === "veh-1")?.status,
    ).toBe("enroute");
  });

  it("caps facility boosts to the configured maximum", () => {
    const store = useLogisticsStore.getState();
    const line = store.createLine({
      name: "Express",
      mode: "train",
      stops: [
        { nodeId: "station-a", label: "Station A", dwellSeconds: 60 },
        { nodeId: "station-b", label: "Station B", dwellSeconds: 60 },
      ],
    });

    for (let index = 0; index < 20; index += 1) {
      store.registerVehicle({
        entityId: `train-${index}`,
        type: "train",
        name: `Train ${index}`,
        lineId: line.id,
        status: "waiting",
        maxSpeed: 4,
        capacity: 100,
        purchaseCost: 100000,
      });
    }

    const boost = store.getFacilityBoost("station-a", "town");
    expect(boost).toBeLessThanOrEqual(0.45);
  });
});
