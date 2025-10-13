import { describe, expect, it, beforeEach } from "vitest";
import { World } from "miniplex";
import { syncEconomySites } from "@/game/scene/useEconomySiteRenderables";
import type { EconomyState } from "@/game/state/slices/economy";
import type {
  DemandEntry,
  Farm,
  Industry,
  Mine,
  SupplyEntry,
  Town,
} from "@/game/simulation/types";
import type { EconomySiteRegistry } from "@/game/scene/useEconomySiteRenderables";
import type { Entity } from "@/game/ecs/world";

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

function createDemand(overrides: Partial<DemandEntry> = {}): DemandEntry {
  return {
    good: "goods",
    demand: 10,
    fulfilled: 0,
    price: 20,
    basePrice: 20,
    trend: "stable",
    ...overrides,
  };
}

function createSupply(overrides: Partial<SupplyEntry> = {}): SupplyEntry {
  return {
    good: "grain",
    stock: 10,
    capacity: 20,
    price: 12,
    basePrice: 12,
    trend: "stable",
    ...overrides,
  };
}

const baseSite = {
  coverage: 0.2,
  baselineCoverage: 0.2,
  seasonalAmplitude: 0,
  seasonalPeriodMinutes: 60,
  seasonalPhase: 0,
  lastCoverageSample: 0,
  serviceCoverage: 0.2,
} as const;

function createTown(overrides: Partial<Town> = {}): Town {
  return {
    id: "town-1",
    name: "Alpha",
    kind: "town",
    position: [0, 0, 0],
    population: 1200,
    satisfaction: 0.5,
    growthTrend: "stable",
    rollingDelta: 0,
    demand: {
      passengers: createDemand({ good: "passengers", demand: 120 }),
      goods: [createDemand()],
    },
    ...baseSite,
    ...overrides,
  } satisfies Mutable<Town>;
}

function createFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: "farm-1",
    name: "Harvest",
    kind: "farm",
    position: [15, 0, -5],
    baseOutput: 12,
    outputTonsPerMonth: 14,
    utilization: 0.6,
    outputs: [createSupply()],
    ...baseSite,
    ...overrides,
  } satisfies Mutable<Farm>;
}

function createIndustry(overrides: Partial<Industry> = {}): Industry {
  return {
    id: "industry-1",
    name: "Factory",
    kind: "industry",
    position: [-12, 0, 18],
    capacity: 20,
    inputFulfillment: 0.5,
    outputStock: 6,
    utilization: 0.55,
    status: "idle",
    lastStatusChangeMinutes: 0,
    industryType: "Goods Factory",
    outputs: [createSupply({ good: "goods" })],
    inputs: [createDemand({ good: "grain" })],
    ...baseSite,
    ...overrides,
  } satisfies Mutable<Industry>;
}

function createMine(overrides: Partial<Mine> = {}): Mine {
  return {
    id: "mine-1",
    name: "Quarry",
    kind: "mine",
    position: [22, 0, -18],
    baseOutput: 15,
    outputRate: 10,
    exhaustion: 0.2,
    outputs: [createSupply({ good: "ore" })],
    ...baseSite,
    ...overrides,
  } satisfies Mutable<Mine>;
}

function createState(overrides: Partial<EconomyState> = {}): EconomyState {
  return {
    towns: [createTown()],
    farms: [createFarm()],
    industries: [createIndustry()],
    mines: [createMine()],
    lastTickMinutes: 0,
    seed: "test-seed",
    ...overrides,
  } satisfies EconomyState;
}

function createRegistry(): EconomySiteRegistry {
  const map = new Map<string, Entity>();
  return {
    get: (id) => map.get(id),
    set: (id, entity) => {
      map.set(id, entity);
    },
    delete: (id) => {
      map.delete(id);
    },
    entries: () => map.entries(),
    values: () => map.values(),
    clear: () => map.clear(),
  };
}

describe("syncEconomySites", () => {
  let world: World<Entity>;
  let registry: EconomySiteRegistry;

  beforeEach(() => {
    world = new World<Entity>();
    registry = createRegistry();
  });

  it("creates renderables for every settlement on first sync", () => {
    const state = createState();

    syncEconomySites(world, registry, state);

    const renderables = [...world.with("Renderable", "Transform")];
    expect(renderables).toHaveLength(4);
    const kinds = renderables.map((entity) => entity.Renderable?.kind).sort();
    expect(kinds).toEqual(["farm", "industry", "mine", "town"]);

    const positions = renderables.map((entity) => entity.Transform?.position);
    expect(positions).toContainEqual([0, 0, 0]);
    expect(positions).toContainEqual([15, 0, -5]);
  });

  it("adds new settlements and removes missing ones on subsequent syncs", () => {
    const initial = createState();
    syncEconomySites(world, registry, initial);

    const updated = createState({
      towns: [createTown({ id: "town-2", position: [5, 0, 5] })],
      farms: [],
      industries: [
        createIndustry({
          id: "industry-1",
          position: [-10, 0, 12],
          utilization: 0.65,
        }),
      ],
      mines: [createMine()],
    });

    syncEconomySites(world, registry, updated);

    const renderables = [...world.with("Renderable", "Transform")];
    expect(renderables).toHaveLength(3);
    const ids = renderables.map((entity) => entity.Renderable?.kind).sort();
    expect(ids).toEqual(["industry", "mine", "town"]);
    const hasFarm = renderables.some(
      (entity) => entity.Renderable?.kind === "farm",
    );
    expect(hasFarm).toBe(false);

    const townEntity = renderables.find(
      (entity) => entity.Renderable?.kind === "town",
    );
    expect(townEntity?.Transform?.position).toEqual([5, 0, 5]);
  });

  it("does not duplicate entities when syncing identical state twice", () => {
    const state = createState();

    syncEconomySites(world, registry, state);
    syncEconomySites(world, registry, state);

    const renderables = [...world.with("Renderable", "Transform")];
    expect(renderables).toHaveLength(4);
  });
});
