import { describe, it, expect } from "vitest";
import { isGridNeighbor, computeSignalPlacement, calculateYaw } from "../utils";

describe("network utils", () => {
  describe("isGridNeighbor", () => {
    it("detects cardinal neighbors", () => {
      const result = isGridNeighbor([0, 0, 0], [10, 0, 0], 10);
      expect(result).toBe(true);
    });

    it("detects diagonal neighbors when allowed", () => {
      const result = isGridNeighbor([0, 0, 0], [10, 0, 10], 10);
      expect(result).toBe(true);
    });

    it("rejects non-neighbors beyond tolerance", () => {
      const result = isGridNeighbor([0, 0, 0], [20, 0, 10], 10);
      expect(result).toBe(false);
    });
  });

  describe("computeSignalPlacement", () => {
    it("offsets signal along and lateral to the edge", () => {
      const { position, rotationY } = computeSignalPlacement(
        [0, 0, 0],
        [10, 0, 0],
        4,
        2,
        1.5,
      );

      expect(position[0]).toBeCloseTo(4);
      expect(position[2]).toBeCloseTo(2);
      expect(position[1]).toBeCloseTo(1.5);
      expect(rotationY).toBeCloseTo(calculateYaw([0, 0, 0], [10, 0, 0]));
    });

    it("mirrors lateral placement when side multiplier is negative", () => {
      const base = computeSignalPlacement([0, 0, 0], [10, 0, 0], 4, 2, 1.5);
      const mirrored = computeSignalPlacement(
        [0, 0, 0],
        [10, 0, 0],
        4,
        2,
        1.5,
        -1,
      );

      expect(mirrored.position[0]).toBeCloseTo(base.position[0]);
      expect(mirrored.position[1]).toBeCloseTo(base.position[1]);
      expect(mirrored.position[2]).toBeCloseTo(-base.position[2]);
      expect(mirrored.rotationY).toBeCloseTo(base.rotationY);
    });
  });
});
