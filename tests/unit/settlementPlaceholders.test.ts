import { describe, expect, it } from "vitest";
import { SETTLEMENT_PLACEHOLDER_DESCRIPTORS } from "@/game/scene/settlementPlaceholders";

describe("settlement placeholder descriptors", () => {
  it("defines clustered town buildings with varied heights", () => {
    const pieces = SETTLEMENT_PLACEHOLDER_DESCRIPTORS.town;
    const boxCount = pieces.filter((piece) => piece.geometry === "box").length;
    expect(boxCount).toBeGreaterThanOrEqual(5);
    const tallest = Math.max(...pieces.map((piece) => piece.position[1]));
    expect(tallest).toBeGreaterThan(3);
  });

  it("provides barn and silo silhouettes for farms", () => {
    const pieces = SETTLEMENT_PLACEHOLDER_DESCRIPTORS.farm;
    const hasCylinder = pieces.some((piece) => piece.geometry === "cylinder");
    const hasCone = pieces.some((piece) => piece.geometry === "cone");
    expect(hasCylinder).toBe(true);
    expect(hasCone).toBe(true);
  });

  it("includes smokestack geometry for industries", () => {
    const pieces = SETTLEMENT_PLACEHOLDER_DESCRIPTORS.industry;
    const cylinderCount = pieces.filter(
      (piece) => piece.geometry === "cylinder",
    ).length;
    expect(cylinderCount).toBeGreaterThanOrEqual(1);
  });

  it("captures ramp and headframe features for mines", () => {
    const pieces = SETTLEMENT_PLACEHOLDER_DESCRIPTORS.mine;
    const hasRamp = pieces.some(
      (piece) => piece.geometry === "box" && Boolean(piece.rotation),
    );
    const hasHoist = pieces.some((piece) => piece.geometry === "cylinder");
    expect(hasRamp).toBe(true);
    expect(hasHoist).toBe(true);
  });
});
