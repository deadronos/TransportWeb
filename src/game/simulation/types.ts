export type SettlementKind = "town" | "farm" | "industry" | "mine";

export type GoodType = "grain" | "lumber" | "ore" | "steel" | "goods";

export type Trend = "rising" | "stable" | "falling";

export interface DemandEntry {
  good: GoodType | "passengers";
  demand: number;
  fulfilled: number;
  price: number;
  basePrice: number;
  trend: Trend;
}

export interface SupplyEntry {
  good: GoodType;
  stock: number;
  capacity: number;
  price: number;
  basePrice: number;
  trend: Trend;
}

export type GrowthTrend = "growing" | "stable" | "declining";

export type OpportunityStatus = "expanding" | "idle" | "needs-link";

export interface BaseSite {
  id: string;
  name: string;
  position: [number, number, number];
  coverage: number;
  baselineCoverage: number;
  seasonalAmplitude: number;
  seasonalPeriodMinutes: number;
  seasonalPhase: number;
  lastCoverageSample: number;
  serviceCoverage: number;
}

export interface Town extends BaseSite {
  kind: "town";
  population: number;
  satisfaction: number;
  growthTrend: GrowthTrend;
  rollingDelta: number;
  demand: {
    passengers: DemandEntry;
    goods: DemandEntry[];
  };
}

export interface Farm extends BaseSite {
  kind: "farm";
  baseOutput: number;
  outputTonsPerMonth: number;
  utilization: number;
  outputs: SupplyEntry[];
}

export interface Industry extends BaseSite {
  kind: "industry";
  capacity: number;
  inputFulfillment: number;
  outputStock: number;
  utilization: number;
  status: OpportunityStatus;
  lastStatusChangeMinutes: number;
  industryType: string;
  outputs: SupplyEntry[];
  inputs: DemandEntry[];
}

export interface Mine extends BaseSite {
  kind: "mine";
  baseOutput: number;
  outputRate: number;
  exhaustion: number;
  outputs: SupplyEntry[];
}

export interface TerritoryCategory {
  id: string;
  label: string;
  count: number;
  status: string;
}

export interface ProductionOpportunity {
  id: string;
  location: string;
  industry: string;
  status: OpportunityStatus;
  message: string;
  updatedAgo: string;
}

export interface EconomyEntities {
  towns: Town[];
  farms: Farm[];
  industries: Industry[];
  mines: Mine[];
}
