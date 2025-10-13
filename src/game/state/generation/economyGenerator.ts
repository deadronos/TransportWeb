import seedrandom from "seedrandom";
import type {
  DemandEntry,
  EconomyEntities,
  Farm,
  Industry,
  Mine,
  SupplyEntry,
  Town,
} from "@/game/simulation/types";
import type { GrowthTrend, OpportunityStatus } from "@/game/simulation/types";

const DEFAULT_SEED = "transportweb";
const DEFAULT_MAP_HALF_SIZE = 320;
const TAU = Math.PI * 2;

interface RangeConfig {
  min: number;
  max: number;
}

interface IndustryConfig {
  type: Industry["industryType"];
  count: RangeConfig;
}

interface GenerationConfig {
  mapHalfSize: number;
  townCount: RangeConfig;
  farmCount: RangeConfig;
  mineCount: RangeConfig;
  industries: IndustryConfig[];
}

const DEFAULT_CONFIG: GenerationConfig = {
  mapHalfSize: DEFAULT_MAP_HALF_SIZE,
  townCount: { min: 4, max: 6 },
  farmCount: { min: 3, max: 5 },
  mineCount: { min: 2, max: 3 },
  industries: [
    { type: "Lumber Mill", count: { min: 1, max: 2 } },
    { type: "Goods Factory", count: { min: 1, max: 2 } },
    { type: "Steel Mill", count: { min: 1, max: 1 } },
  ],
};

const TOWN_PREFIXES = [
  "North",
  "Lake",
  "West",
  "Green",
  "Silver",
  "River",
  "Oak",
  "Pine",
  "Stone",
  "Cedar",
];

const TOWN_SUFFIXES = [
  "port",
  "dale",
  "view",
  "crest",
  "ford",
  "side",
  "field",
  "vale",
  "ridge",
  "harbor",
];

const INDUSTRY_NAMES: Record<Industry["industryType"], string[]> = {
  "Lumber Mill": ["Timberworks", "Pioneer Timber", "Evergreen Mill"],
  "Goods Factory": ["Union Goods", "Hilltop Works", "Skyline Manufactury"],
  "Steel Mill": ["Ironcrest", "Foundry East", "Rivermelt Steel"],
};

function isKnownIndustryType(
  value: Industry["industryType"],
): value is keyof typeof INDUSTRY_NAMES {
  return value in INDUSTRY_NAMES;
}

const FARM_NAMES = [
  "Valley Farms",
  "Harvest Co-op",
  "Prairie Supply",
  "Golden Acre",
  "Windmill Estate",
];

const MINE_NAMES = [
  "Silver Ridge Mine",
  "Granite Quarry",
  "Redrock Mine",
  "Ember Hollow",
  "Northstar Pit",
];

function randomInRange(
  rng: seedrandom.PRNG,
  { min, max }: RangeConfig,
): number {
  return min + (max - min) * rng.quick();
}

function randomIntInRange(rng: seedrandom.PRNG, range: RangeConfig): number {
  return Math.floor(randomInRange(rng, range) + 0.5);
}

function pickUnique<T>(array: T[], index: number): T {
  return array[index % array.length] ?? array[array.length - 1]!;
}

function sampleTownName(rng: seedrandom.PRNG, used: Set<string>): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const prefix = pickUnique(
      TOWN_PREFIXES,
      Math.floor(rng.quick() * TOWN_PREFIXES.length),
    );
    const suffix = pickUnique(
      TOWN_SUFFIXES,
      Math.floor(rng.quick() * TOWN_SUFFIXES.length),
    );
    const name = `${prefix}${suffix}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  const fallback = `Town ${used.size + 1}`;
  used.add(fallback);
  return fallback;
}

function distanceSquared(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy + dz * dz;
}

function samplePosition(
  rng: seedrandom.PRNG,
  existing: Array<{ position: [number, number, number] }> | undefined,
  mapHalfSize: number,
  minDistance: number,
  bias?: { center: [number, number, number]; radiusRange: RangeConfig } | null,
): [number, number, number] {
  const minDistanceSq = minDistance * minDistance;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    let x: number;
    let z: number;
    if (bias) {
      const radius = randomInRange(rng, bias.radiusRange);
      const angle = rng.quick() * TAU;
      x = bias.center[0] + Math.cos(angle) * radius;
      z = bias.center[2] + Math.sin(angle) * radius;
    } else {
      x = (rng.quick() * 2 - 1) * mapHalfSize;
      z = (rng.quick() * 2 - 1) * mapHalfSize;
    }
    x = Math.max(-mapHalfSize, Math.min(mapHalfSize, x));
    z = Math.max(-mapHalfSize, Math.min(mapHalfSize, z));
    const position: [number, number, number] = [x, 0, z];
    if (!existing || existing.length === 0) {
      return position;
    }
    const valid = existing.every(
      (item) => distanceSquared(item.position, position) >= minDistanceSq,
    );
    if (valid) {
      return position;
    }
  }
  throw new Error("Failed to place settlement within map bounds");
}

function createDemand(
  good: DemandEntry["good"],
  demandAmount: number,
  basePrice: number,
  coverage: number,
): DemandEntry {
  const fulfilled = demandAmount * coverage;
  return {
    good,
    demand: demandAmount,
    fulfilled,
    price: basePrice,
    basePrice,
    trend: "stable",
  };
}

function createSupply(
  good: SupplyEntry["good"],
  capacity: number,
  basePrice: number,
  stockRatio: number,
): SupplyEntry {
  const stock = capacity * stockRatio;
  return {
    good,
    stock,
    capacity,
    price: basePrice,
    basePrice,
    trend: "stable",
  };
}

function determineIndustryStatus(
  fulfillment: number,
  utilization: number,
): OpportunityStatus {
  if (fulfillment < 0.45) return "needs-link";
  if (utilization < 0.6) return "idle";
  return "expanding";
}

function createTown(
  rng: seedrandom.PRNG,
  usedNames: Set<string>,
  mapHalfSize: number,
  existing: Town[],
): Town {
  const position = samplePosition(rng, existing, mapHalfSize, 120);
  const population = randomInRange(rng, { min: 18, max: 48 });
  const baselineCoverage = randomInRange(rng, { min: 0.35, max: 0.65 });
  const name = sampleTownName(rng, usedNames);
  return {
    id: `town-${name.toLowerCase().replace(/\s+/g, "-")}`,
    kind: "town",
    name,
    position,
    population,
    satisfaction: baselineCoverage,
    growthTrend: "stable",
    rollingDelta: 0,
    coverage: baselineCoverage,
    baselineCoverage,
    serviceCoverage: baselineCoverage,
    seasonalAmplitude: randomInRange(rng, { min: 0.05, max: 0.12 }),
    seasonalPeriodMinutes: randomInRange(rng, { min: 36000, max: 57600 }),
    seasonalPhase: rng.quick() * TAU,
    lastCoverageSample: baselineCoverage,
    demand: {
      passengers: createDemand(
        "passengers",
        randomInRange(rng, { min: 22, max: 55 }),
        baselineCoverage * 5 + 3,
        baselineCoverage,
      ),
      goods: [
        createDemand(
          "grain",
          randomInRange(rng, { min: 18, max: 32 }),
          90,
          baselineCoverage,
        ),
        createDemand(
          "goods",
          randomInRange(rng, { min: 14, max: 28 }),
          140,
          baselineCoverage,
        ),
      ],
    },
  };
}

function createFarm(
  rng: seedrandom.PRNG,
  mapHalfSize: number,
  towns: Town[],
  existing: Farm[],
): Farm {
  const anchor =
    towns.length > 0
      ? (towns[Math.floor(rng.quick() * towns.length)] ?? towns[0])
      : null;
  const bias = anchor
    ? {
        center: anchor.position,
        radiusRange: { min: 70, max: 140 },
      }
    : null;
  const position = samplePosition(
    rng,
    [...towns, ...existing],
    mapHalfSize,
    80,
    bias,
  );
  const baseOutput = randomInRange(rng, { min: 35, max: 55 });
  const baselineCoverage = randomInRange(rng, { min: 0.4, max: 0.6 });
  const name = pickUnique(
    FARM_NAMES,
    Math.floor(rng.quick() * FARM_NAMES.length),
  );
  return {
    id: `farm-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${existing.length + 1}`,
    kind: "farm",
    name,
    position,
    baseOutput,
    outputTonsPerMonth: baseOutput * randomInRange(rng, { min: 0.7, max: 1.1 }),
    utilization: randomInRange(rng, { min: 0.5, max: 0.8 }),
    coverage: baselineCoverage,
    baselineCoverage,
    serviceCoverage: baselineCoverage,
    seasonalAmplitude: randomInRange(rng, { min: 0.1, max: 0.18 }),
    seasonalPeriodMinutes: randomInRange(rng, { min: 28800, max: 43200 }),
    seasonalPhase: rng.quick() * TAU,
    lastCoverageSample: baselineCoverage,
    outputs: [createSupply("grain", baseOutput * 1.4, 90, 0.6)],
  };
}

function createIndustry(
  rng: seedrandom.PRNG,
  type: Industry["industryType"],
  mapHalfSize: number,
  towns: Town[],
  existing: Array<Town | Industry | Farm>,
  index: number,
): Industry {
  const position = samplePosition(rng, existing, mapHalfSize, 140);
  const capacity = randomInRange(rng, { min: 90, max: 140 });
  const baselineCoverage = randomInRange(rng, { min: 0.35, max: 0.7 });
  const nameList = isKnownIndustryType(type)
    ? INDUSTRY_NAMES[type]!
    : [String(type)];
  const name = `${pickUnique(
    nameList,
    Math.floor(rng.quick() * nameList.length),
  )} ${index + 1}`;
  const inputFulfillment = randomInRange(rng, { min: 0.35, max: 0.75 });
  const outputs: SupplyEntry[] = (() => {
    switch (type) {
      case "Lumber Mill":
        return [
          createSupply(
            "lumber",
            capacity,
            160,
            randomInRange(rng, { min: 0.4, max: 0.8 }),
          ),
        ];
      case "Goods Factory":
        return [
          createSupply(
            "goods",
            capacity,
            200,
            randomInRange(rng, { min: 0.35, max: 0.7 }),
          ),
        ];
      case "Steel Mill":
      default:
        return [
          createSupply(
            "steel",
            capacity,
            220,
            randomInRange(rng, { min: 0.3, max: 0.65 }),
          ),
        ];
    }
  })();
  const inputs: DemandEntry[] = (() => {
    switch (type) {
      case "Lumber Mill":
        return [
          createDemand(
            "grain",
            randomInRange(rng, { min: 16, max: 26 }),
            85,
            baselineCoverage,
          ),
        ];
      case "Goods Factory":
        return [
          createDemand(
            "lumber",
            randomInRange(rng, { min: 14, max: 24 }),
            150,
            baselineCoverage,
          ),
          createDemand(
            "grain",
            randomInRange(rng, { min: 12, max: 20 }),
            90,
            baselineCoverage,
          ),
        ];
      case "Steel Mill":
      default:
        return [
          createDemand(
            "ore",
            randomInRange(rng, { min: 20, max: 34 }),
            130,
            baselineCoverage,
          ),
        ];
    }
  })();
  const utilization = (inputFulfillment + outputs[0]!.stock / capacity) / 2;
  const status = determineIndustryStatus(inputFulfillment, utilization);
  return {
    id: `industry-${type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
    kind: "industry",
    name,
    industryType: type,
    position,
    capacity,
    inputFulfillment,
    outputStock: outputs.reduce((sum, item) => sum + item.stock, 0),
    utilization,
    status,
    lastStatusChangeMinutes: 0,
    coverage: baselineCoverage,
    baselineCoverage,
    serviceCoverage: baselineCoverage,
    seasonalAmplitude: randomInRange(rng, { min: 0.07, max: 0.14 }),
    seasonalPeriodMinutes: randomInRange(rng, { min: 32400, max: 50400 }),
    seasonalPhase: rng.quick() * TAU,
    lastCoverageSample: baselineCoverage,
    outputs,
    inputs,
  };
}

function createMine(
  rng: seedrandom.PRNG,
  mapHalfSize: number,
  towns: Town[],
  existing: Mine[],
): Mine {
  const anchor =
    towns.length > 0
      ? (towns[Math.floor(rng.quick() * towns.length)] ?? towns[0])
      : null;
  const bias = anchor
    ? {
        center: anchor.position,
        radiusRange: { min: 140, max: 260 },
      }
    : null;
  const population = [...towns, ...existing];
  const preferredMinDistance = 170;
  let position: [number, number, number];
  try {
    position = samplePosition(
      rng,
      population,
      mapHalfSize,
      preferredMinDistance,
      bias,
    );
  } catch {
    position = samplePosition(rng, population, mapHalfSize, 150);
  }
  const baseOutput = randomInRange(rng, { min: 40, max: 65 });
  const baselineCoverage = randomInRange(rng, { min: 0.3, max: 0.55 });
  const name = pickUnique(
    MINE_NAMES,
    Math.floor(rng.quick() * MINE_NAMES.length),
  );
  return {
    id: `mine-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${existing.length + 1}`,
    kind: "mine",
    name,
    position,
    baseOutput,
    outputRate: baseOutput * randomInRange(rng, { min: 0.6, max: 0.95 }),
    exhaustion: randomInRange(rng, { min: 0.25, max: 0.6 }),
    coverage: baselineCoverage,
    baselineCoverage,
    serviceCoverage: baselineCoverage,
    seasonalAmplitude: randomInRange(rng, { min: 0.05, max: 0.12 }),
    seasonalPeriodMinutes: randomInRange(rng, { min: 36000, max: 57600 }),
    seasonalPhase: rng.quick() * TAU,
    lastCoverageSample: baselineCoverage,
    outputs: [
      createSupply(
        "ore",
        baseOutput * 1.5,
        120,
        randomInRange(rng, { min: 0.5, max: 0.85 }),
      ),
    ],
  };
}

export interface EconomyGenerationOptions {
  seed?: string;
  configOverrides?: Partial<GenerationConfig>;
}

function mergeConfig(
  defaults: GenerationConfig,
  overrides?: Partial<GenerationConfig>,
): GenerationConfig {
  if (!overrides) {
    return defaults;
  }
  return {
    ...defaults,
    ...overrides,
    townCount: overrides.townCount ?? defaults.townCount,
    farmCount: overrides.farmCount ?? defaults.farmCount,
    mineCount: overrides.mineCount ?? defaults.mineCount,
    industries: overrides.industries ?? defaults.industries,
  };
}

function computeTrendDelta(base: number, current: number): GrowthTrend {
  const delta = current - base;
  if (delta > 0.02) return "growing";
  if (delta < -0.01) return "declining";
  return "stable";
}

export function generateEconomyEntities(
  options: EconomyGenerationOptions = {},
): EconomyEntities & { seed: string } {
  const seed = options.seed ?? DEFAULT_SEED;
  const config = mergeConfig(DEFAULT_CONFIG, options.configOverrides);
  const rng = seedrandom(seed);

  const towns: Town[] = [];
  const usedTownNames = new Set<string>();
  const townTarget = Math.max(
    config.townCount.min,
    Math.min(config.townCount.max, randomIntInRange(rng, config.townCount)),
  );
  for (let index = 0; index < townTarget; index += 1) {
    towns.push(createTown(rng, usedTownNames, config.mapHalfSize, towns));
  }

  const farms: Farm[] = [];
  const farmTarget = Math.max(
    config.farmCount.min,
    Math.min(config.farmCount.max, randomIntInRange(rng, config.farmCount)),
  );
  for (let index = 0; index < farmTarget; index += 1) {
    farms.push(createFarm(rng, config.mapHalfSize, towns, farms));
  }

  const industries: Industry[] = [];
  for (const industryConfig of config.industries) {
    const count = Math.max(
      industryConfig.count.min,
      Math.min(
        industryConfig.count.max,
        randomIntInRange(rng, industryConfig.count),
      ),
    );
    for (let index = 0; index < count; index += 1) {
      industries.push(
        createIndustry(
          rng,
          industryConfig.type,
          config.mapHalfSize,
          towns,
          [...towns, ...industries, ...farms],
          industries.length,
        ),
      );
    }
  }

  const mines: Mine[] = [];
  const mineTarget = Math.max(
    config.mineCount.min,
    Math.min(config.mineCount.max, randomIntInRange(rng, config.mineCount)),
  );
  for (let index = 0; index < mineTarget; index += 1) {
    mines.push(createMine(rng, config.mapHalfSize, towns, mines));
  }

  for (const town of towns) {
    town.growthTrend = computeTrendDelta(
      town.baselineCoverage,
      town.satisfaction,
    );
  }

  return {
    seed,
    towns,
    farms,
    industries,
    mines,
  };
}

export { DEFAULT_SEED as ECONOMY_DEFAULT_SEED };
