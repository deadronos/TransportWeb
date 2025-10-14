import { create } from "zustand";
import type {
  DemandEntry,
  EconomyEntities,
  Farm,
  GoodType,
  Industry,
  Mine,
  OpportunityStatus,
  ProductionOpportunity,
  TerritoryCategory,
  Town,
  Trend,
} from "@/game/simulation/types";
import {
  ECONOMY_DEFAULT_SEED,
  generateEconomyEntities,
  type EconomyGenerationOptions,
} from "@/game/state/generation/economyGenerator";

export interface EconomyState extends EconomyEntities {
  lastTickMinutes: number;
  seed: string;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

type CreateEconomyStateOptions = EconomyGenerationOptions & {
  overrides?: Partial<EconomyState>;
};

function createInitialEconomyState(
  options?: CreateEconomyStateOptions,
): EconomyState {
  const generation = generateEconomyEntities({
    seed: options?.seed ?? ECONOMY_DEFAULT_SEED,
    configOverrides: options?.configOverrides,
  });

  return {
    towns: generation.towns,
    farms: generation.farms,
    industries: generation.industries,
    mines: generation.mines,
    lastTickMinutes: 0,
    seed: generation.seed,
    ...(options?.overrides ?? {}),
  };
}

export const STATUS_MESSAGES: Record<OpportunityStatus, string> = {
  expanding: "Expanding capacity",
  idle: "Idle - awaiting cargo",
  "needs-link": "Needs rail link",
};

export const useEconomyStore = create<EconomyState>()(() =>
  createInitialEconomyState(),
);

export function resetEconomyState(options?: CreateEconomyStateOptions) {
  useEconomyStore.setState(() => createInitialEconomyState(options));
}

export function computeTerritorySummary(
  state: EconomyState,
): TerritoryCategory[] {
  const townAvgSatisfaction = average(
    state.towns.map((town) => town.satisfaction),
  );
  const townAvgTrend = average(state.towns.map((town) => town.rollingDelta));

  const farmUtilization = average(state.farms.map((farm) => farm.utilization));
  const industryUtilization = average(
    state.industries.map((industry) => industry.utilization),
  );
  const industryNeedsLink = state.industries.filter(
    (industry) => industry.status === "needs-link",
  ).length;

  const mineExhaustion = average(state.mines.map((mine) => mine.exhaustion));

  const townStatus = (() => {
    if (townAvgTrend > 0.01 && townAvgSatisfaction > 0.6) {
      return "Growing ridership";
    }
    if (townAvgTrend < -0.005) {
      return "Declining demand";
    }
    if (townAvgSatisfaction < 0.45) {
      return "Stagnant";
    }
    return "Stable travel";
  })();

  const farmStatus = (() => {
    if (farmUtilization > 0.7) return "Harvest season peak";
    if (farmUtilization > 0.55) return "Output steady";
    return "Under capacity";
  })();

  const industryStatus = (() => {
    if (industryNeedsLink > 0) {
      return `${industryNeedsLink} site(s) need links`;
    }
    if (industryUtilization > 0.75) return "Output surging";
    if (industryUtilization < 0.5) return "Utilization soft";
    return "Production stable";
  })();

  const mineStatus = (() => {
    if (mineExhaustion > 0.7) return "Depleting reserves";
    if (mineExhaustion > 0.45) return "Reserve pressure";
    return "Output steady";
  })();

  return [
    {
      id: "towns",
      label: "Towns",
      count: state.towns.length,
      status: townStatus,
    },
    {
      id: "farms",
      label: "Farms",
      count: state.farms.length,
      status: farmStatus,
    },
    {
      id: "industries",
      label: "Industries",
      count: state.industries.length,
      status: industryStatus,
    },
    {
      id: "mines",
      label: "Mines",
      count: state.mines.length,
      status: mineStatus,
    },
  ];
}

function formatUpdatedAgo(minutesAgo: number): string {
  if (minutesAgo <= 1) {
    return "Updated <1m ago";
  }
  if (minutesAgo < 60) {
    return `Updated ${Math.floor(minutesAgo)}m ago`;
  }
  const hours = minutesAgo / 60;
  if (hours < 24) {
    return `Updated ${Math.floor(hours)}h ago`;
  }
  const days = minutesAgo / 1440;
  return `Updated ${Math.floor(days)}d ago`;
}

function deriveOpportunity(
  industry: Industry,
  currentMinutes: number,
): ProductionOpportunity {
  const deltaMinutes = Math.max(
    0,
    currentMinutes - industry.lastStatusChangeMinutes,
  );

  const primaryOutput = industry.outputs[0];
  const priceSuffix = primaryOutput
    ? ` • $${Math.round(primaryOutput.price)}/${primaryOutput.good}`
    : "";

  return {
    id: industry.id,
    location: industry.name,
    industry: industry.industryType,
    status: industry.status,
    message: `${STATUS_MESSAGES[industry.status]}${priceSuffix}`,
    updatedAgo: formatUpdatedAgo(deltaMinutes),
  };
}

export function computeProductionOpportunities(
  state: EconomyState,
  currentMinutes: number,
): ProductionOpportunity[] {
  const opportunities = state.industries.map((industry) =>
    deriveOpportunity(industry, currentMinutes),
  );

  const severityOrder: Record<OpportunityStatus, number> = {
    "needs-link": 0,
    idle: 1,
    expanding: 2,
  };

  return opportunities
    .sort((a, b) => severityOrder[a.status] - severityOrder[b.status])
    .slice(0, 4);
}

export function computeAverageCoverage(state: EconomyState): number {
  const allSites: Array<Town | Farm | Industry | Mine> = [
    ...state.towns,
    ...state.farms,
    ...state.industries,
    ...state.mines,
  ];

  return clamp01(
    average(
      allSites.map((site) => Math.max(site.coverage, site.serviceCoverage)),
    ),
  );
}

function shortageOf(entry: DemandEntry): number {
  return Math.max(0, entry.demand - entry.fulfilled);
}

function combineTrends(trends: Trend[]): Trend {
  if (trends.length === 0) {
    return "stable";
  }

  const counts: Record<Trend, number> = {
    rising: 0,
    stable: 0,
    falling: 0,
  };

  for (const trend of trends) {
    counts[trend] += 1;
  }

  if (counts.rising >= counts.falling && counts.rising > counts.stable) {
    return "rising";
  }
  if (counts.falling > counts.rising && counts.falling > counts.stable) {
    return "falling";
  }
  return "stable";
}

export interface DemandInsight {
  id: string;
  location: string;
  good: DemandEntry["good"];
  shortage: number;
  shortageRatio: number;
  price: number;
  trend: Trend;
}

export interface CommodityPriceSnapshot {
  good: GoodType;
  averagePrice: number;
  producers: number;
  trend: Trend;
}

export function computeDemandInsights(
  state: EconomyState,
  limit = 5,
): DemandInsight[] {
  const insights: DemandInsight[] = [];

  for (const town of state.towns) {
    const passengerShortage = shortageOf(town.demand.passengers);
    if (passengerShortage > 0.5) {
      const ratio =
        town.demand.passengers.demand > 0
          ? passengerShortage / town.demand.passengers.demand
          : 0;
      insights.push({
        id: `${town.id}-passengers`,
        location: town.name,
        good: town.demand.passengers.good,
        shortage: passengerShortage,
        shortageRatio: ratio,
        price: town.demand.passengers.price,
        trend: town.demand.passengers.trend,
      });
    }

    for (const entry of town.demand.goods) {
      const shortage = shortageOf(entry);
      if (shortage <= 0.25) {
        continue;
      }
      const ratio = entry.demand > 0 ? shortage / entry.demand : 0;
      insights.push({
        id: `${town.id}-${entry.good}`,
        location: town.name,
        good: entry.good,
        shortage,
        shortageRatio: ratio,
        price: entry.price,
        trend: entry.trend,
      });
    }
  }

  for (const industry of state.industries) {
    for (const input of industry.inputs) {
      const shortage = shortageOf(input);
      if (shortage <= 0.25) {
        continue;
      }
      const ratio = input.demand > 0 ? shortage / input.demand : 0;
      insights.push({
        id: `${industry.id}-${input.good}`,
        location: industry.name,
        good: input.good,
        shortage,
        shortageRatio: ratio,
        price: input.price,
        trend: input.trend,
      });
    }
  }

  return insights
    .sort(
      (a, b) => b.shortageRatio - a.shortageRatio || b.shortage - a.shortage,
    )
    .slice(0, limit);
}

export function computeCommodityPrices(
  state: EconomyState,
): CommodityPriceSnapshot[] {
  const accumulator = new Map<
    GoodType,
    { priceSum: number; producers: number; trends: Trend[] }
  >();

  const addSupply = (good: GoodType, price: number, trend: Trend) => {
    const bucket = accumulator.get(good) ?? {
      priceSum: 0,
      producers: 0,
      trends: [],
    };
    bucket.priceSum += price;
    bucket.producers += 1;
    bucket.trends.push(trend);
    accumulator.set(good, bucket);
  };

  for (const farm of state.farms) {
    for (const output of farm.outputs) {
      addSupply(output.good, output.price, output.trend);
    }
  }

  for (const industry of state.industries) {
    for (const output of industry.outputs) {
      addSupply(output.good, output.price, output.trend);
    }
  }

  for (const mine of state.mines) {
    for (const output of mine.outputs) {
      addSupply(output.good, output.price, output.trend);
    }
  }

  return Array.from(accumulator.entries())
    .map(([good, value]) => ({
      good,
      averagePrice: value.producers > 0 ? value.priceSum / value.producers : 0,
      producers: value.producers,
      trend: combineTrends(value.trends),
    }))
    .sort((a, b) => a.good.localeCompare(b.good));
}

export type EconomyResetOptions = CreateEconomyStateOptions;
