import { beforeEach, describe, expect, it } from "vitest";
import { sampleServiceCoverage } from "@/game/simulation/coverage";
import { useNetworkStore } from "@/game/state/slices/network";
import { useLogisticsStore } from "@/game/state/slices/logistics";

const STATION_ID = "station-test";
const SECOND_STATION_ID = "station-secondary";

function resetStores() {
  const networkState = useNetworkStore.getState();
  networkState.graph.clear();
  useNetworkStore.setState({ version: 0, visualEntities: {} });

  useLogisticsStore.setState({ lines: [], vehicles: [] });
}

describe("service coverage sampling", () => {
  beforeEach(() => {
    resetStores();
  });

  it("returns zero coverage when no facilities are present", () => {
    const sample = sampleServiceCoverage([0, 0, 0], "town");
    expect(sample.coverage).toBe(0);
    expect(sample.facilityId).toBeNull();
  });

  it("samples the nearest facility within range", () => {
    const { graph } = useNetworkStore.getState();
    graph.addNode({
      id: STATION_ID,
      position: [0, 0, 0],
      type: "station",
      connections: [],
      metadata: { name: "Central", serviceRadius: 140 },
    });

    const sample = sampleServiceCoverage([10, 0, 0], "town");

    expect(sample.coverage).toBeGreaterThan(0.8);
    expect(sample.facilityId).toBe(STATION_ID);
  });

  it("incorporates logistics boosts from assigned vehicles", () => {
    const { graph } = useNetworkStore.getState();
    graph.addNode({
      id: STATION_ID,
      position: [0, 0, 0],
      type: "station",
      connections: [],
      metadata: { name: "Central", serviceRadius: 140 },
    });
    graph.addNode({
      id: SECOND_STATION_ID,
      position: [140, 0, 0],
      type: "station",
      connections: [],
      metadata: { name: "East", serviceRadius: 140 },
    });

    const logistics = useLogisticsStore.getState();
    const line = logistics.createLine({
      name: "Central Shuttle",
      mode: "train",
      stops: [
        { nodeId: STATION_ID, label: "Central", dwellSeconds: 60 },
        { nodeId: SECOND_STATION_ID, label: "East", dwellSeconds: 60 },
      ],
    });

    const base = sampleServiceCoverage([70, 0, 0], "town");
    expect(base.coverage).toBeGreaterThan(0.45);
    expect(base.coverage).toBeLessThan(0.55);

    logistics.registerVehicle({
      entityId: "veh-1",
      type: "train",
      name: "Train 1",
      lineId: line.id,
      status: "waiting",
      maxSpeed: 4,
      capacity: 96,
      purchaseCost: 1000,
    });

    const boosted = sampleServiceCoverage([70, 0, 0], "town");
    expect(boosted.coverage).toBeGreaterThan(base.coverage);
    expect(boosted.coverage).toBeLessThanOrEqual(1);
  });

  it("drops coverage to zero when outside the service radius", () => {
    const { graph } = useNetworkStore.getState();
    graph.addNode({
      id: STATION_ID,
      position: [0, 0, 0],
      type: "station",
      connections: [],
      metadata: { name: "Central", serviceRadius: 120 },
    });

    const sample = sampleServiceCoverage([240, 0, 0], "town");
    expect(sample.coverage).toBe(0);
    expect(sample.facilityId).toBeNull();
  });
});
