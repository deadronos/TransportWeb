import {
  type DemandEntry,
  type Farm,
  type GrowthTrend,
  type Industry,
  type Mine,
  type OpportunityStatus,
  type SupplyEntry,
  type Town,
  type Trend,
} from "./types";
import { useEconomyStore } from "@/game/state/slices/economy";
import { MINUTES_PER_SECOND, useClock } from "@/game/state/slices/clock";
import { sampleServiceCoverage } from "./coverage";

const TAU = Math.PI * 2;
const MINUTES_PER_DAY = 1440;
const MINUTES_PER_MONTH = 43200;
const ROLLING_WINDOW_MINUTES = 43200;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function seasonalStep<
  T extends {
    seasonalPhase: number;
    seasonalPeriodMinutes: number;
    seasonalAmplitude: number;
    baselineCoverage: number;
    coverage: number;
  },
>(
  site: T,
  deltaMinutes: number,
  baseTarget?: number,
): { coverage: number; phase: number; baseline: number } {
  const period = Math.max(site.seasonalPeriodMinutes, MINUTES_PER_DAY);
  const phaseDelta = (deltaMinutes / period) * TAU;
  const nextPhase = (site.seasonalPhase + phaseDelta) % TAU;

  const desiredBase = baseTarget ?? site.baselineCoverage;
  const baselineSmoothing = Math.min(1, deltaMinutes / (MINUTES_PER_DAY * 2));
  const baseline = clamp01(
    site.baselineCoverage +
      (desiredBase - site.baselineCoverage) * baselineSmoothing,
  );

  const targetCoverage = clamp01(
    baseline + Math.sin(nextPhase) * site.seasonalAmplitude,
  );
  const coverageSmoothing = Math.min(1, deltaMinutes / (MINUTES_PER_DAY / 2));
  const coverage = clamp01(
    site.coverage + (targetCoverage - site.coverage) * coverageSmoothing,
  );

  return { coverage, phase: nextPhase, baseline };
}

function shortageRatio(entry: DemandEntry, fulfilled: number): number {
  if (entry.demand <= 0) {
    return 0;
  }
  return clamp((entry.demand - fulfilled) / entry.demand, -1, 1);
}

function updateDemandEntry(
  entry: DemandEntry,
  coverage: number,
  deltaMinutes: number,
): DemandEntry {
  const smoothing = Math.min(1, deltaMinutes / (MINUTES_PER_DAY / 3));
  const targetFulfilled = clamp01(coverage) * entry.demand;
  const fulfilled =
    entry.fulfilled + (targetFulfilled - entry.fulfilled) * smoothing;

  const elasticity = entry.good === "passengers" ? 0.5 : 0.6;
  const shortage = shortageRatio(entry, fulfilled);
  const priceTarget = clamp(
    entry.basePrice * (1 + shortage * elasticity),
    entry.basePrice * 0.7,
    entry.basePrice * 1.6,
  );
  const priceSmoothing = Math.min(1, deltaMinutes / MINUTES_PER_DAY);
  const price = entry.price + (priceTarget - entry.price) * priceSmoothing;

  let trend: Trend = "stable";
  if (price > entry.price + 0.25) {
    trend = "rising";
  } else if (price < entry.price - 0.25) {
    trend = "falling";
  }

  return {
    ...entry,
    fulfilled,
    price,
    trend,
  };
}

function updateSupplyEntry(
  entry: SupplyEntry,
  stockTarget: number,
  deltaMinutes: number,
): SupplyEntry {
  const smoothing = Math.min(1, deltaMinutes / (MINUTES_PER_DAY / 2));
  const stock = clamp(
    entry.stock + (stockTarget - entry.stock) * smoothing,
    0,
    entry.capacity,
  );
  const ratio = entry.capacity > 0 ? clamp01(stock / entry.capacity) : 0;
  const shortage = clamp(0.5 - ratio, -1, 1);
  const priceTarget = clamp(
    entry.basePrice * (1 + shortage * 0.9),
    entry.basePrice * 0.6,
    entry.basePrice * 1.7,
  );
  const priceSmoothing = Math.min(1, deltaMinutes / MINUTES_PER_DAY);
  const price = entry.price + (priceTarget - entry.price) * priceSmoothing;

  let trend: Trend = "stable";
  if (price > entry.price + 0.25) {
    trend = "rising";
  } else if (price < entry.price - 0.25) {
    trend = "falling";
  }

  return {
    ...entry,
    stock,
    price,
    trend,
  };
}

function determineIndustryStatus(
  fulfillment: number,
  utilization: number,
): OpportunityStatus {
  if (fulfillment < 0.45) {
    return "needs-link";
  }
  if (utilization < 0.6) {
    return "idle";
  }
  return "expanding";
}

function updateTown(town: Town, deltaMinutes: number): Town {
  const serviceSample = sampleServiceCoverage(town.position, "town");
  const logisticTarget = clamp01(
    serviceSample.coverage * 0.85 + town.baselineCoverage * 0.25,
  );
  const { coverage, phase, baseline } = seasonalStep(
    town,
    deltaMinutes,
    logisticTarget,
  );

  const satisfactionTarget = clamp01((coverage + serviceSample.coverage) / 2);
  const satisfactionLerp = Math.min(1, deltaMinutes / (MINUTES_PER_DAY / 2));
  const satisfaction = clamp01(
    town.satisfaction +
      (satisfactionTarget - town.satisfaction) * satisfactionLerp,
  );

  const deltaMonths = deltaMinutes / MINUTES_PER_MONTH;
  const baseGrowth = 0.006;
  const satisfactionModifier = 0.012;
  const growthRate = baseGrowth + (satisfaction - 0.5) * satisfactionModifier;
  const population = Math.max(
    5,
    town.population + town.population * growthRate * deltaMonths,
  );

  const deltaPercent =
    town.population > 0 ? (population - town.population) / town.population : 0;
  const smoothing = Math.min(1, deltaMinutes / ROLLING_WINDOW_MINUTES);
  const rollingDelta =
    town.rollingDelta * (1 - smoothing) + deltaPercent * smoothing;

  const growthTrend: GrowthTrend =
    rollingDelta > 0.01
      ? "growing"
      : rollingDelta < -0.005
        ? "declining"
        : "stable";

  const passengers = updateDemandEntry(
    town.demand.passengers,
    satisfactionTarget,
    deltaMinutes,
  );
  const goods = town.demand.goods.map((entry) =>
    updateDemandEntry(entry, coverage, deltaMinutes),
  );

  return {
    ...town,
    population,
    satisfaction,
    rollingDelta,
    growthTrend,
    coverage,
    baselineCoverage: baseline,
    seasonalPhase: phase,
    lastCoverageSample: coverage,
    serviceCoverage: serviceSample.coverage,
    demand: {
      passengers,
      goods,
    },
  };
}

function updateFarm(farm: Farm, deltaMinutes: number): Farm {
  const serviceSample = sampleServiceCoverage(farm.position, "farm");
  const logisticTarget = clamp01(
    serviceSample.coverage * 0.8 + farm.baselineCoverage * 0.3,
  );
  const { coverage, phase, baseline } = seasonalStep(
    farm,
    deltaMinutes,
    logisticTarget,
  );

  const deltaMonths = deltaMinutes / MINUTES_PER_MONTH;
  const productionTarget = farm.baseOutput * (0.6 + coverage * 0.8);
  const smoothing = Math.min(1, deltaMonths * 3);
  const outputTonsPerMonth =
    farm.outputTonsPerMonth +
    (productionTarget - farm.outputTonsPerMonth) * smoothing;
  const utilization = clamp01(outputTonsPerMonth / (farm.baseOutput * 1.4));

  const outputs = farm.outputs.map((entry) =>
    updateSupplyEntry(entry, outputTonsPerMonth, deltaMinutes),
  );

  return {
    ...farm,
    coverage,
    baselineCoverage: baseline,
    seasonalPhase: phase,
    lastCoverageSample: coverage,
    serviceCoverage: serviceSample.coverage,
    outputTonsPerMonth,
    utilization,
    outputs,
  };
}

function updateIndustry(
  industry: Industry,
  deltaMinutes: number,
  currentMinutes: number,
): Industry {
  const serviceSample = sampleServiceCoverage(industry.position, "industry");
  const logisticTarget = clamp01(
    serviceSample.coverage * 0.9 + industry.baselineCoverage * 0.2,
  );
  const { coverage, phase, baseline } = seasonalStep(
    industry,
    deltaMinutes,
    logisticTarget,
  );

  const deltaMonths = deltaMinutes / MINUTES_PER_MONTH;
  const fulfillmentTarget = clamp01(0.15 + serviceSample.coverage * 0.75);
  const smoothing = Math.min(1, deltaMonths * 2.5);
  const inputFulfillment = clamp01(
    industry.inputFulfillment +
      (fulfillmentTarget - industry.inputFulfillment) * smoothing,
  );

  const stockDelta = (inputFulfillment - 0.5) * industry.capacity * deltaMonths;
  const rawStock = clamp(
    industry.outputStock + stockDelta,
    0,
    industry.capacity,
  );

  const outputsCount = Math.max(1, industry.outputs.length);
  const stockPerOutput = rawStock / outputsCount;
  const outputs = industry.outputs.map((entry) =>
    updateSupplyEntry(entry, stockPerOutput, deltaMinutes),
  );
  const outputStock = outputs.reduce((sum, entry) => sum + entry.stock, 0);

  const utilization = clamp01(
    (inputFulfillment + outputStock / industry.capacity) / 2,
  );
  const status = determineIndustryStatus(inputFulfillment, utilization);
  const lastStatusChangeMinutes =
    status !== industry.status
      ? currentMinutes
      : industry.lastStatusChangeMinutes;

  const inputs = industry.inputs.map((input) =>
    updateDemandEntry(
      input,
      Math.max(serviceSample.coverage, coverage),
      deltaMinutes,
    ),
  );

  return {
    ...industry,
    coverage,
    baselineCoverage: baseline,
    seasonalPhase: phase,
    lastCoverageSample: coverage,
    serviceCoverage: serviceSample.coverage,
    inputFulfillment,
    outputStock,
    utilization,
    status,
    lastStatusChangeMinutes,
    outputs,
    inputs,
  };
}

function updateMine(mine: Mine, deltaMinutes: number): Mine {
  const serviceSample = sampleServiceCoverage(mine.position, "mine");
  const logisticTarget = clamp01(
    serviceSample.coverage * 0.75 + mine.baselineCoverage * 0.35,
  );
  const { coverage, phase, baseline } = seasonalStep(
    mine,
    deltaMinutes,
    logisticTarget,
  );

  const deltaMonths = deltaMinutes / MINUTES_PER_MONTH;
  const outputTarget = mine.baseOutput * (0.55 + coverage * 0.75);
  const smoothing = Math.min(1, deltaMonths * 2);
  const outputRate =
    mine.outputRate + (outputTarget - mine.outputRate) * smoothing;
  const exhaustionDelta =
    (outputRate / (mine.baseOutput * 1.5)) * 0.02 * deltaMonths -
    0.01 * (1 - serviceSample.coverage) * deltaMonths;
  const exhaustion = clamp01(mine.exhaustion + exhaustionDelta);

  const outputs = mine.outputs.map((entry) =>
    updateSupplyEntry(entry, outputRate, deltaMinutes),
  );

  return {
    ...mine,
    coverage,
    baselineCoverage: baseline,
    seasonalPhase: phase,
    lastCoverageSample: coverage,
    serviceCoverage: serviceSample.coverage,
    outputRate,
    exhaustion,
    outputs,
  };
}

export function advanceEconomySimulation(deltaSeconds: number) {
  if (deltaSeconds <= 0) {
    return;
  }

  const deltaMinutes = deltaSeconds * MINUTES_PER_SECOND;
  if (deltaMinutes <= 0) {
    return;
  }

  const { gameMinutes } = useClock.getState();

  useEconomyStore.setState((state) => ({
    ...state,
    towns: state.towns.map((town) => updateTown(town, deltaMinutes)),
    farms: state.farms.map((farm) => updateFarm(farm, deltaMinutes)),
    industries: state.industries.map((industry) =>
      updateIndustry(industry, deltaMinutes, gameMinutes),
    ),
    mines: state.mines.map((mine) => updateMine(mine, deltaMinutes)),
    lastTickMinutes: gameMinutes,
  }));
}

export function fastForwardEconomy(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return;
  }
  const seconds = totalMinutes / MINUTES_PER_SECOND;
  advanceEconomySimulation(seconds);
}
