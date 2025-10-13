import { beforeEach, describe, expect, it, vi } from "vitest";
import { advanceEconomySimulation } from "@/game/simulation/economy";
import {
  resetEconomyState,
  useEconomyStore,
  computeTerritorySummary,
  computeProductionOpportunities,
} from "@/game/state/slices/economy";
import { MINUTES_PER_SECOND, useClock } from "@/game/state/slices/clock";
import type { Town, Industry } from "@/game/simulation/types";
import * as coverage from "@/game/simulation/coverage";

function formatUpdatedAgoForTest(minutesAgo: number): string {
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

function advanceSimulation(seconds: number, iterations = 1) {
  const { advanceTime } = useClock.getState();
  for (let i = 0; i < iterations; i += 1) {
    advanceTime(seconds);
    advanceEconomySimulation(seconds);
  }
}

describe("advanceEconomySimulation", () => {
  beforeEach(() => {
    resetEconomyState();
    useClock.getState().resetTime(0);
    useClock.setState({ paused: false, speed: 1 });
  });

  it("grows town population and satisfaction toward coverage", () => {
    const templateTown = useEconomyStore.getState().towns[0];
    expect(templateTown).toBeDefined();
    if (!templateTown) {
      throw new Error("expected seed town to exist");
    }

    const passengers = {
      ...templateTown.demand.passengers,
      demand: templateTown.demand.passengers.demand,
      fulfilled: templateTown.demand.passengers.demand * 0.2,
      price: templateTown.demand.passengers.basePrice,
      trend: "stable" as const,
    };
    const goods = templateTown.demand.goods.map((entry) => ({
      ...entry,
      fulfilled: entry.demand * 0.2,
      price: entry.basePrice,
      trend: "stable" as const,
    }));

    const town: Town = {
      ...templateTown,
      id: "town-test",
      name: "Testville",
      position: [0, 0, 0],
      population: 12,
      satisfaction: 0.35,
      growthTrend: "stable",
      rollingDelta: 0,
      coverage: 0.2,
      baselineCoverage: 0.85,
      serviceCoverage: 0.2,
      seasonalAmplitude: templateTown.seasonalAmplitude,
      seasonalPeriodMinutes: templateTown.seasonalPeriodMinutes,
      seasonalPhase: templateTown.seasonalPhase,
      lastCoverageSample: 0.2,
      demand: { passengers, goods },
    };

    resetEconomyState({
      overrides: {
        towns: [town],
        farms: [],
        industries: [],
        mines: [],
      },
    });

    const coverageMock = vi
      .spyOn(coverage, "sampleServiceCoverage")
      .mockImplementation((_, kind) =>
        kind === "town"
          ? { coverage: 0.75, facilityId: "station-town" }
          : { coverage: 0.3, facilityId: null },
      );

    const stepSeconds = 600; // 10 minutes of real time ~= 1 in-game day
    advanceSimulation(stepSeconds, 12);

    const updatedTown = useEconomyStore.getState().towns[0];
    expect(updatedTown).toBeDefined();
    if (!updatedTown) {
      throw new Error("town missing after simulation");
    }
    expect(updatedTown.population).toBeGreaterThan(town.population);
    expect(updatedTown.serviceCoverage).toBeCloseTo(0.75, 2);
    expect(updatedTown.coverage).toBeGreaterThanOrEqual(0);

    coverageMock.mockRestore();
  });

  it("adjusts industry stock and status based on fulfillment", () => {
    const templateIndustry = useEconomyStore.getState().industries[0];
    expect(templateIndustry).toBeDefined();
    if (!templateIndustry) {
      throw new Error("expected seed industry to exist");
    }

    const outputs = templateIndustry.outputs.map((output) => ({
      ...output,
      stock: Math.min(output.capacity, 40 / templateIndustry.outputs.length),
      price: output.basePrice,
      trend: "stable" as const,
    }));
    const outputStock = outputs.reduce((sum, output) => sum + output.stock, 0);
    const inputs = templateIndustry.inputs.map((input) => ({
      ...input,
      fulfilled: input.demand * 0.35,
      price: input.basePrice,
      trend: "stable" as const,
    }));

    const industry: Industry = {
      ...templateIndustry,
      id: "industry-test",
      name: "Test Factory",
      industryType: "Manufacturing",
      position: [0, 0, 0],
      capacity: 100,
      inputFulfillment: 0.35,
      outputStock,
      outputs,
      inputs,
      utilization: 0.35,
      status: "needs-link",
      lastStatusChangeMinutes: 0,
      coverage: 0.3,
      baselineCoverage: 0.3,
      serviceCoverage: 0.3,
      seasonalAmplitude: templateIndustry.seasonalAmplitude,
      seasonalPeriodMinutes: templateIndustry.seasonalPeriodMinutes,
      seasonalPhase: templateIndustry.seasonalPhase,
      lastCoverageSample: 0.3,
    };

    resetEconomyState({
      overrides: {
        towns: [],
        farms: [],
        industries: [industry],
        mines: [],
      },
    });

    const coverageState = { town: 0.15, industry: 0.2 };
    const coverageMock = vi
      .spyOn(coverage, "sampleServiceCoverage")
      .mockImplementation((_, kind) =>
        kind === "industry"
          ? {
              coverage: coverageState.industry,
              facilityId: "station-industrial",
            }
          : { coverage: coverageState.town, facilityId: "station-town" },
      );

    // Low coverage should drain stock and keep status at needs-link
    advanceSimulation(600, 8);
    const firstPass = useEconomyStore.getState().industries[0];
    expect(firstPass).toBeDefined();
    if (!firstPass) {
      throw new Error("industry missing after low coverage simulation");
    }
    expect(firstPass.outputStock).toBeLessThan(industry.outputStock);
    expect(firstPass.status).toBe("needs-link");

    // Improve coverage to drive fulfillment upwards
    coverageState.industry = 0.85;
    coverageState.town = 0.6;
    advanceSimulation(600, 15);
    const improved = useEconomyStore.getState().industries[0];
    expect(improved).toBeDefined();
    if (!improved) {
      throw new Error("industry missing after recovery simulation");
    }
    expect(improved.serviceCoverage).toBeCloseTo(0.85, 2);
    expect(improved.outputStock).toBeGreaterThan(firstPass.outputStock);
    expect(["idle", "expanding"]).toContain(improved.status);
    expect(improved.lastStatusChangeMinutes).toBeGreaterThan(
      firstPass.lastStatusChangeMinutes,
    );

    coverageMock.mockRestore();
  });

  it("surfaces production opportunities with freshness text", () => {
    const templateFreshIndustry = useEconomyStore.getState().industries[0];
    expect(templateFreshIndustry).toBeDefined();
    if (!templateFreshIndustry) {
      throw new Error("expected seed industry to exist");
    }

    const freshOutputs = templateFreshIndustry.outputs.map((output) => ({
      ...output,
      stock: Math.min(
        output.capacity,
        20 / templateFreshIndustry.outputs.length,
      ),
      price: output.basePrice,
      trend: "stable" as const,
    }));
    const freshOutputStock = freshOutputs.reduce(
      (sum, entry) => sum + entry.stock,
      0,
    );
    const freshInputs = templateFreshIndustry.inputs.map((input) => ({
      ...input,
      fulfilled: input.demand * 0.4,
      price: input.basePrice,
      trend: "stable" as const,
    }));

    const industry: Industry = {
      ...templateFreshIndustry,
      id: "industry-freshness",
      name: "Freshness Works",
      industryType: "Steel Mill",
      position: [0, 0, 0],
      capacity: 80,
      inputFulfillment: 0.4,
      outputStock: freshOutputStock,
      outputs: freshOutputs,
      inputs: freshInputs,
      utilization: 0.4,
      status: "needs-link",
      lastStatusChangeMinutes: 0,
      coverage: 0.35,
      baselineCoverage: 0.35,
      serviceCoverage: 0.35,
      seasonalAmplitude: templateFreshIndustry.seasonalAmplitude,
      seasonalPeriodMinutes: templateFreshIndustry.seasonalPeriodMinutes,
      seasonalPhase: templateFreshIndustry.seasonalPhase,
      lastCoverageSample: 0.35,
    };

    resetEconomyState({
      overrides: {
        towns: [],
        farms: [],
        industries: [industry],
        mines: [],
      },
    });

    const coverageState = { industry: 0.2 };
    const coverageMock = vi
      .spyOn(coverage, "sampleServiceCoverage")
      .mockImplementation((_, kind) =>
        kind === "industry"
          ? {
              coverage: coverageState.industry,
              facilityId: "station-industrial",
            }
          : { coverage: 0.4, facilityId: "station-town" },
      );

    // First tick keeps the shortage state
    const minuteStep = 1 / MINUTES_PER_SECOND;
    advanceSimulation(minuteStep, 1);
    let opportunities = computeProductionOpportunities(
      useEconomyStore.getState(),
      useClock.getState().gameMinutes,
    );
    expect(opportunities.length).toBeGreaterThan(0);
    const firstOpportunity = opportunities[0];
    if (!firstOpportunity) {
      throw new Error("expected production opportunity");
    }
    expect(firstOpportunity.status).toBe("needs-link");
    const initialUpdated = firstOpportunity.updatedAgo;
    expect(initialUpdated).toMatch(/Updated/);

    // Increase coverage and run enough to flip the status
    coverageState.industry = 0.8;
    advanceSimulation(300, 8);
    const statusChangeMinutes =
      useEconomyStore.getState().industries[0]?.lastStatusChangeMinutes ?? 0;
    const minutesSinceChangeBefore =
      useClock.getState().gameMinutes - statusChangeMinutes;

    // Advance clock without running simulation to age the opportunity
    const additionalMinutes = 3 * 60; // 3 hours
    const secondsForAdditional = additionalMinutes / MINUTES_PER_SECOND;
    useClock.getState().advanceTime(secondsForAdditional);
    const minutesSinceChangeAfter =
      useClock.getState().gameMinutes - statusChangeMinutes;
    expect(minutesSinceChangeAfter).toBeCloseTo(
      minutesSinceChangeBefore + additionalMinutes,
      5,
    );

    opportunities = computeProductionOpportunities(
      useEconomyStore.getState(),
      useClock.getState().gameMinutes,
    );
    expect(opportunities.length).toBeGreaterThan(0);
    const finalOpportunity = opportunities[0];
    if (!finalOpportunity) {
      throw new Error("expected final opportunity");
    }
    expect(["idle", "expanding"]).toContain(finalOpportunity.status);
    expect(finalOpportunity.status).not.toBe(firstOpportunity.status);
    expect(finalOpportunity.updatedAgo).not.toBe(initialUpdated);
    expect(finalOpportunity.updatedAgo).toBe(
      formatUpdatedAgoForTest(minutesSinceChangeAfter),
    );
    const finalIndustry = useEconomyStore.getState().industries[0];
    expect(finalIndustry).toBeDefined();
    if (!finalIndustry) {
      throw new Error("expected industry after refresh");
    }
    expect(finalIndustry.lastStatusChangeMinutes).toBe(statusChangeMinutes);

    coverageMock.mockRestore();
  });

  it("aggregates territory counts from simulation state", () => {
    const [firstTown] = useEconomyStore.getState().towns;
    expect(firstTown).toBeDefined();
    if (!firstTown) {
      throw new Error("expected seed town to exist");
    }
    resetEconomyState({
      overrides: {
        towns: [{ ...firstTown }],
        farms: [],
        industries: [],
        mines: [],
      },
    });

    const summary = computeTerritorySummary(useEconomyStore.getState());
    expect(summary).toHaveLength(4);
    const towns = summary.find((item) => item.id === "towns");
    expect(towns?.count).toBe(1);
  });
});
