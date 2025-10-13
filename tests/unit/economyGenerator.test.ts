import { describe, it, expect } from "vitest";
import { generateEconomyEntities } from "@/game/state/generation/economyGenerator";

function distance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

describe("economy generator", () => {
  it("produces deterministic results for a given seed", () => {
    const first = generateEconomyEntities({ seed: "spec-seed" });
    const second = generateEconomyEntities({ seed: "spec-seed" });

    expect(second.seed).toBe(first.seed);
    expect(second.towns.map((town) => town.name)).toEqual(
      first.towns.map((town) => town.name),
    );
    expect(second.industries.map((industry) => industry.name)).toEqual(
      first.industries.map((industry) => industry.name),
    );
    expect(second.farms.map((farm) => farm.name)).toEqual(
      first.farms.map((farm) => farm.name),
    );
  });

  it("keeps settlements sensibly spaced across the map", () => {
    const generated = generateEconomyEntities({ seed: "spacing-check" });

    for (let i = 0; i < generated.towns.length; i += 1) {
      for (let j = i + 1; j < generated.towns.length; j += 1) {
        expect(
          distance(generated.towns[i]!.position, generated.towns[j]!.position),
        ).toBeGreaterThan(100);
      }
    }

    for (let i = 0; i < generated.industries.length; i += 1) {
      for (let j = i + 1; j < generated.industries.length; j += 1) {
        expect(
          distance(
            generated.industries[i]!.position,
            generated.industries[j]!.position,
          ),
        ).toBeGreaterThan(90);
      }
    }
  });

  it("places farms and mines near towns while staying within the map bounds", () => {
    const generated = generateEconomyEntities({ seed: "proximity-check" });

    expect(generated.towns.length).toBeGreaterThanOrEqual(4);
    expect(generated.farms.length).toBeGreaterThan(0);
    expect(generated.mines.length).toBeGreaterThan(0);

    const halfSize = 320;

    for (const farm of generated.farms) {
      const closestTownDistance = Math.min(
        ...generated.towns.map((town) =>
          distance(town.position, farm.position),
        ),
      );
      expect(closestTownDistance).toBeLessThan(200);
      expect(Math.abs(farm.position[0])).toBeLessThanOrEqual(halfSize);
      expect(Math.abs(farm.position[2])).toBeLessThanOrEqual(halfSize);
    }

    for (const mine of generated.mines) {
      const closestTownDistance = Math.min(
        ...generated.towns.map((town) =>
          distance(town.position, mine.position),
        ),
      );
      expect(closestTownDistance).toBeLessThan(320);
      expect(Math.abs(mine.position[0])).toBeLessThanOrEqual(halfSize);
      expect(Math.abs(mine.position[2])).toBeLessThanOrEqual(halfSize);
    }
  });
});
