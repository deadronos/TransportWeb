import { beforeEach, describe, expect, it } from "vitest";
import { advanceEconomySimulation } from "@/game/simulation/economy";
import {
  resetEconomyState,
  useEconomyStore,
  computeTerritorySummary,
  computeProductionOpportunities,
} from "@/game/state/slices/economy";
import { MINUTES_PER_SECOND, useClock } from "@/game/state/slices/clock";
import type { Town, Industry } from "@/game/simulation/types";

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
    const town: Town = {
      id: "town-test",
      kind: "town",
      name: "Testville",
      position: [0, 0, 0],
      population: 12,
      satisfaction: 0.35,
      growthTrend: "stable",
      rollingDelta: 0,
      coverage: 0.2,
      baselineCoverage: 0.85,
      seasonalAmplitude: 0,
      seasonalPeriodMinutes: 43200,
      seasonalPhase: 0,
      lastCoverageSample: 0.2,
    };

    resetEconomyState({
      towns: [town],
      farms: [],
      industries: [],
      mines: [],
    });

    const stepSeconds = 600; // 10 minutes of real time ~= 1 in-game day
    advanceSimulation(stepSeconds, 12);

    const updatedTown = useEconomyStore.getState().towns[0];
    expect(updatedTown).toBeDefined();
    if (!updatedTown) {
      throw new Error("town missing after simulation");
    }
    expect(updatedTown.population).toBeGreaterThan(town.population);
    expect(updatedTown.satisfaction).toBeGreaterThan(town.satisfaction);
    expect(updatedTown.growthTrend).not.toBe("declining");
    expect(updatedTown.rollingDelta).toBeGreaterThan(0);
  });

  it("adjusts industry stock and status based on fulfillment", () => {
    const industry: Industry = {
      id: "industry-test",
      kind: "industry",
      name: "Test Factory",
      industryType: "Manufacturing",
      position: [0, 0, 0],
      capacity: 100,
      inputFulfillment: 0.35,
      outputStock: 40,
      utilization: 0.35,
      status: "needs-link",
      lastStatusChangeMinutes: 0,
      coverage: 0.3,
      baselineCoverage: 0.3,
      seasonalAmplitude: 0,
      seasonalPeriodMinutes: 43200,
      seasonalPhase: 0,
      lastCoverageSample: 0.3,
    };

    resetEconomyState({
      towns: [],
      farms: [],
      industries: [industry],
      mines: [],
    });

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
    useEconomyStore.setState((state) => ({
      industries: state.industries.map((value) =>
        value.id === industry.id
          ? {
              ...value,
              baselineCoverage: 0.95,
              coverage: 0.95,
              inputFulfillment: 0.35,
            }
          : value,
      ),
    }));

    advanceSimulation(600, 15);
    const improved = useEconomyStore.getState().industries[0];
    expect(improved).toBeDefined();
    if (!improved) {
      throw new Error("industry missing after recovery simulation");
    }
    expect(improved.inputFulfillment).toBeGreaterThan(
      firstPass.inputFulfillment,
    );
    expect(improved.outputStock).toBeGreaterThan(firstPass.outputStock);
    expect(improved.status).not.toBe("needs-link");
    expect(improved.lastStatusChangeMinutes).toBeGreaterThan(
      firstPass.lastStatusChangeMinutes,
    );
  });

  it("surfaces production opportunities with freshness text", () => {
    const industry: Industry = {
      id: "industry-freshness",
      kind: "industry",
      name: "Freshness Works",
      industryType: "Steel Mill",
      position: [0, 0, 0],
      capacity: 80,
      inputFulfillment: 0.4,
      outputStock: 20,
      utilization: 0.4,
      status: "needs-link",
      lastStatusChangeMinutes: 0,
      coverage: 0.35,
      baselineCoverage: 0.35,
      seasonalAmplitude: 0,
      seasonalPeriodMinutes: 43200,
      seasonalPhase: 0,
      lastCoverageSample: 0.35,
    };

    resetEconomyState({
      towns: [],
      farms: [],
      industries: [industry],
      mines: [],
    });

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
    useEconomyStore.setState((state) => ({
      industries: state.industries.map((value) =>
        value.id === industry.id
          ? {
              ...value,
              baselineCoverage: 0.9,
              coverage: 0.8,
              inputFulfillment: 0.4,
            }
          : value,
      ),
    }));

    advanceSimulation(300, 8);
    const statusChangeMinutes =
      useEconomyStore.getState().industries[0]?.lastStatusChangeMinutes ?? 0;
    expect(statusChangeMinutes).toBeGreaterThan(0);
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
  });

  it("aggregates territory counts from simulation state", () => {
    const [firstTown] = useEconomyStore.getState().towns;
    expect(firstTown).toBeDefined();
    if (!firstTown) {
      throw new Error("expected seed town to exist");
    }
    resetEconomyState({
      towns: [{ ...firstTown }],
      farms: [],
      industries: [],
      mines: [],
    });

    const summary = computeTerritorySummary(useEconomyStore.getState());
    expect(summary).toHaveLength(4);
    const towns = summary.find((item) => item.id === "towns");
    expect(towns?.count).toBe(1);
  });
});
