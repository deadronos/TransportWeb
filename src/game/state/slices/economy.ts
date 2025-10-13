import { create } from "zustand";
import type {
  EconomyEntities,
  Farm,
  Industry,
  Mine,
  ProductionOpportunity,
  TerritoryCategory,
  Town,
  OpportunityStatus,
} from "@/game/simulation/types";

export interface EconomyState extends EconomyEntities {
  lastTickMinutes: number;
}

const ECONOMY_SEED: EconomyEntities = {
  towns: [
    {
      id: "town-northport",
      kind: "town",
      name: "Northport",
      position: [120, 0, -80],
      population: 34.5,
      satisfaction: 0.62,
      growthTrend: "growing",
      rollingDelta: 0.012,
      coverage: 0.58,
      baselineCoverage: 0.6,
      seasonalAmplitude: 0.12,
      seasonalPeriodMinutes: 43200,
      seasonalPhase: 1.1,
      lastCoverageSample: 0.58,
    },
    {
      id: "town-lakeside",
      kind: "town",
      name: "Lakeside",
      position: [-60, 0, 140],
      population: 27.8,
      satisfaction: 0.54,
      growthTrend: "stable",
      rollingDelta: 0.002,
      coverage: 0.47,
      baselineCoverage: 0.5,
      seasonalAmplitude: 0.08,
      seasonalPeriodMinutes: 50400,
      seasonalPhase: 2.7,
      lastCoverageSample: 0.47,
    },
    {
      id: "town-westvale",
      kind: "town",
      name: "Westvale",
      position: [-180, 0, -30],
      population: 19.6,
      satisfaction: 0.42,
      growthTrend: "declining",
      rollingDelta: -0.009,
      coverage: 0.33,
      baselineCoverage: 0.38,
      seasonalAmplitude: 0.15,
      seasonalPeriodMinutes: 57600,
      seasonalPhase: 5.9,
      lastCoverageSample: 0.33,
    },
  ],
  farms: [
    {
      id: "farm-northfield",
      kind: "farm",
      name: "Northfield Farms",
      position: [60, 0, 220],
      baseOutput: 42,
      outputTonsPerMonth: 44,
      utilization: 0.71,
      coverage: 0.52,
      baselineCoverage: 0.55,
      seasonalAmplitude: 0.18,
      seasonalPeriodMinutes: 28800,
      seasonalPhase: 0.4,
      lastCoverageSample: 0.52,
    },
    {
      id: "farm-greenvalley",
      kind: "farm",
      name: "Green Valley Co-op",
      position: [-150, 0, 200],
      baseOutput: 37,
      outputTonsPerMonth: 32,
      utilization: 0.48,
      coverage: 0.41,
      baselineCoverage: 0.45,
      seasonalAmplitude: 0.14,
      seasonalPeriodMinutes: 36000,
      seasonalPhase: 3.8,
      lastCoverageSample: 0.41,
    },
  ],
  industries: [
    {
      id: "industry-ironcrest",
      kind: "industry",
      name: "Ironcrest Steelworks",
      industryType: "Steel Mill",
      position: [-220, 0, 40],
      capacity: 120,
      inputFulfillment: 0.38,
      outputStock: 22,
      utilization: 0.41,
      status: "needs-link",
      lastStatusChangeMinutes: 0,
      coverage: 0.36,
      baselineCoverage: 0.4,
      seasonalAmplitude: 0.1,
      seasonalPeriodMinutes: 43200,
      seasonalPhase: 4.2,
      lastCoverageSample: 0.36,
    },
    {
      id: "industry-seaside-refinery",
      kind: "industry",
      name: "Seaside Refinery",
      industryType: "Oil Refinery",
      position: [200, 0, -160],
      capacity: 140,
      inputFulfillment: 0.58,
      outputStock: 64,
      utilization: 0.63,
      status: "idle",
      lastStatusChangeMinutes: 0,
      coverage: 0.52,
      baselineCoverage: 0.55,
      seasonalAmplitude: 0.09,
      seasonalPeriodMinutes: 39600,
      seasonalPhase: 1.6,
      lastCoverageSample: 0.52,
    },
    {
      id: "industry-hilltop-factory",
      kind: "industry",
      name: "Hilltop Goods Factory",
      industryType: "Manufacturing",
      position: [40, 0, 40],
      capacity: 90,
      inputFulfillment: 0.74,
      outputStock: 68,
      utilization: 0.78,
      status: "expanding",
      lastStatusChangeMinutes: 0,
      coverage: 0.66,
      baselineCoverage: 0.68,
      seasonalAmplitude: 0.07,
      seasonalPeriodMinutes: 32400,
      seasonalPhase: 5.1,
      lastCoverageSample: 0.66,
    },
  ],
  mines: [
    {
      id: "mine-ember",
      kind: "mine",
      name: "Ember Ridge Mine",
      position: [-260, 0, -140],
      baseOutput: 58,
      outputRate: 62,
      exhaustion: 0.32,
      coverage: 0.49,
      baselineCoverage: 0.5,
      seasonalAmplitude: 0.08,
      seasonalPeriodMinutes: 50400,
      seasonalPhase: 2.3,
      lastCoverageSample: 0.49,
    },
    {
      id: "mine-silverfall",
      kind: "mine",
      name: "Silverfall Quarry",
      position: [150, 0, -260],
      baseOutput: 46,
      outputRate: 39,
      exhaustion: 0.57,
      coverage: 0.37,
      baselineCoverage: 0.42,
      seasonalAmplitude: 0.13,
      seasonalPeriodMinutes: 57600,
      seasonalPhase: 0.9,
      lastCoverageSample: 0.37,
    },
  ],
};

function cloneSeed(): EconomyEntities {
  return JSON.parse(JSON.stringify(ECONOMY_SEED)) as EconomyEntities;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

const STATUS_MESSAGES: Record<OpportunityStatus, string> = {
  expanding: "Expanding capacity",
  idle: "Idle - awaiting cargo",
  "needs-link": "Needs rail link",
};

export const useEconomyStore = create<EconomyState>()(() => ({
  ...cloneSeed(),
  lastTickMinutes: 0,
}));

export function resetEconomyState(overrides?: Partial<EconomyState>) {
  useEconomyStore.setState(() => ({
    ...cloneSeed(),
    lastTickMinutes: 0,
    ...overrides,
  }));
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

  return {
    id: industry.id,
    location: industry.name,
    industry: industry.industryType,
    status: industry.status,
    message: STATUS_MESSAGES[industry.status],
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

  return clamp01(average(allSites.map((site) => site.coverage)));
}
