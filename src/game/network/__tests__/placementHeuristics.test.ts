import { describe, expect, it } from "vitest";

import { chooseNeighborsForConnection } from "../placementHeuristics";
import type { NetworkNode } from "../types";

const createNode = (id: string, x: number, z: number): NetworkNode => ({
  id,
  position: [x, 0, z],
  type: "junction",
  connections: [],
});

describe("chooseNeighborsForConnection", () => {
  it("prefers continuing forward from the previous placement", () => {
    const nodePosition: [number, number, number] = [0, 0, 0];
    const neighbors = [
      createNode("west", -10, 0),
      createNode("east", 10, 0),
      createNode("northEast", 10, 10),
    ];

    const result = chooseNeighborsForConnection(nodePosition, neighbors, {
      previousPlacement: {
        nodeId: "west",
        position: [-10, 0, 0],
        direction: [10, 0, 0],
      },
      directionHint: [10, 0, 0],
      fanOut: false,
    });

    expect(result.map((node) => node.id)).toEqual(["west", "east"]);
  });

  it("limits automatic fan-out when no modifiers are held", () => {
    const nodePosition: [number, number, number] = [0, 0, 0];
    const neighbors = [
      createNode("west", -10, 0),
      createNode("east", 10, 0),
      createNode("south", 0, -10),
      createNode("north", 0, 10),
    ];

    const result = chooseNeighborsForConnection(nodePosition, neighbors, {
      previousPlacement: null,
      directionHint: null,
      fanOut: false,
    });

    expect(result).toHaveLength(2);
    expect(result.every((node) => neighbors.includes(node))).toBe(true);
  });

  it("connects to all neighbors when fanOut is true", () => {
    const nodePosition: [number, number, number] = [0, 0, 0];
    const neighbors = [
      createNode("west", -10, 0),
      createNode("east", 10, 0),
      createNode("south", 0, -10),
    ];

    const result = chooseNeighborsForConnection(nodePosition, neighbors, {
      previousPlacement: null,
      directionHint: null,
      fanOut: true,
    });

    expect(result.map((node) => node.id)).toEqual(["west", "east", "south"]);
  });

  it("uses the direction hint to choose the best forward candidate", () => {
    const nodePosition: [number, number, number] = [0, 0, 0];
    const neighbors = [
      createNode("west", -10, 0),
      createNode("east", 10, 0),
      createNode("north", 0, 10),
    ];

    const result = chooseNeighborsForConnection(nodePosition, neighbors, {
      previousPlacement: null,
      directionHint: [10, 0, 0],
      fanOut: false,
    });

    expect(result.map((node) => node.id)).toEqual(["east", "west"]);
  });
});
