import {
  type Farm,
  type Industry,
  type Mine,
  type Town,
  type GrowthTrend,
  type OpportunityStatus,
} from "./types";
import { useEconomyStore } from "@/game/state/slices/economy";
import { MINUTES_PER_SECOND, useClock } from "@/game/state/slices/clock";

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
    baselineCoverage: number;
    seasonalAmplitude: number;
    coverage: number;
    lastCoverageSample: number;
  },
>(site: T, deltaMinutes: number): { coverage: number; phase: number } {
  const period = Math.max(site.seasonalPeriodMinutes, MINUTES_PER_DAY);
  const phaseDelta = (deltaMinutes / period) * TAU;
  const nextPhase = (site.seasonalPhase + phaseDelta) % TAU;
  const targetCoverage = clamp01(
    site.baselineCoverage + Math.sin(nextPhase) * site.seasonalAmplitude,
  );
  const smoothing = Math.min(1, deltaMinutes / (MINUTES_PER_DAY / 2));
  const coverage = clamp01(
    site.coverage + (targetCoverage - site.coverage) * smoothing,
  );
  return { coverage, phase: nextPhase };
}

function updateTown(town: Town, deltaMinutes: number): Town {
  const { coverage, phase } = seasonalStep(town, deltaMinutes);
  const satisfactionLerp = Math.min(1, deltaMinutes / (MINUTES_PER_DAY / 2));
  const satisfaction = clamp01(
    town.satisfaction + (coverage - town.satisfaction) * satisfactionLerp,
  );

  const deltaMonths = deltaMinutes / MINUTES_PER_MONTH;
  const baseGrowth = 0.006; // ~0.6% per month baseline
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

  return {
    ...town,
    population,
    satisfaction,
    rollingDelta,
    growthTrend,
    coverage,
    seasonalPhase: phase,
    lastCoverageSample: coverage,
  };
}

function updateFarm(farm: Farm, deltaMinutes: number): Farm {
  const { coverage, phase } = seasonalStep(farm, deltaMinutes);
  const deltaMonths = deltaMinutes / MINUTES_PER_MONTH;
  const productionTarget = farm.baseOutput * (0.6 + coverage * 0.8);
  const smoothing = Math.min(1, deltaMonths * 3);
  const outputTonsPerMonth =
    farm.outputTonsPerMonth +
    (productionTarget - farm.outputTonsPerMonth) * smoothing;
  const utilization = clamp01(outputTonsPerMonth / (farm.baseOutput * 1.4));

  return {
    ...farm,
    coverage,
    seasonalPhase: phase,
    lastCoverageSample: coverage,
    outputTonsPerMonth,
    utilization,
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

function updateIndustry(
  industry: Industry,
  deltaMinutes: number,
  currentMinutes: number,
): Industry {
  const { coverage, phase } = seasonalStep(industry, deltaMinutes);
  const deltaMonths = deltaMinutes / MINUTES_PER_MONTH;
  const fulfillmentTarget = clamp01(0.15 + coverage * 0.7);
  const smoothing = Math.min(1, deltaMonths * 2.5);
  const inputFulfillment = clamp01(
    industry.inputFulfillment +
      (fulfillmentTarget - industry.inputFulfillment) * smoothing,
  );
  const stockDelta = (inputFulfillment - 0.5) * industry.capacity * deltaMonths;
  const outputStock = clamp(
    industry.outputStock + stockDelta,
    0,
    industry.capacity,
  );
  const utilization = clamp01(
    (inputFulfillment + outputStock / industry.capacity) / 2,
  );
  const status = determineIndustryStatus(inputFulfillment, utilization);
  const lastStatusChangeMinutes =
    status !== industry.status
      ? currentMinutes
      : industry.lastStatusChangeMinutes;

  return {
    ...industry,
    coverage,
    seasonalPhase: phase,
    lastCoverageSample: coverage,
    inputFulfillment,
    outputStock,
    utilization,
    status,
    lastStatusChangeMinutes,
  };
}

function updateMine(mine: Mine, deltaMinutes: number): Mine {
  const { coverage, phase } = seasonalStep(mine, deltaMinutes);
  const deltaMonths = deltaMinutes / MINUTES_PER_MONTH;
  const outputTarget = mine.baseOutput * (0.55 + coverage * 0.75);
  const smoothing = Math.min(1, deltaMonths * 2);
  const outputRate =
    mine.outputRate + (outputTarget - mine.outputRate) * smoothing;
  const exhaustionDelta =
    (outputRate / (mine.baseOutput * 1.5)) * 0.02 * deltaMonths -
    0.01 * (1 - coverage) * deltaMonths;
  const exhaustion = clamp01(mine.exhaustion + exhaustionDelta);

  return {
    ...mine,
    coverage,
    seasonalPhase: phase,
    lastCoverageSample: coverage,
    outputRate,
    exhaustion,
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
