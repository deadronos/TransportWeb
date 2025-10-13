import { useNetworkStore } from "@/game/state/slices/network";
import { useLogisticsStore } from "@/game/state/slices/logistics";
import type { SettlementKind } from "./types";
import { calculateDistance } from "@/game/network/utils";

const DEFAULT_STATION_RADIUS = 140;
const DEFAULT_DEPOT_RADIUS = 90;

function facilityRadius(
  type: "station" | "depot",
  metadata?: Record<string, unknown>,
) {
  const raw = metadata?.serviceRadius;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  return type === "station" ? DEFAULT_STATION_RADIUS : DEFAULT_DEPOT_RADIUS;
}

function facilityWeight(
  type: "station" | "depot",
  kind: SettlementKind,
): number {
  if (type === "station") {
    return kind === "town" ? 1 : 0.8;
  }
  // depot
  if (kind === "town") {
    return 0.75;
  }
  if (kind === "industry") {
    return 1;
  }
  return 0.9;
}

export interface CoverageSample {
  coverage: number;
  facilityId: string | null;
}

export function sampleServiceCoverage(
  position: [number, number, number],
  kind: SettlementKind,
): CoverageSample {
  const { graph } = useNetworkStore.getState();
  const logistics = useLogisticsStore.getState();
  const nodes = graph
    .getAllNodes()
    .filter((node) => node.type === "station" || node.type === "depot");

  let bestCoverage = 0;
  let bestFacility: string | null = null;

  for (const node of nodes) {
    const radius = facilityRadius(
      node.type as "station" | "depot",
      node.metadata,
    );
    if (radius <= 0) {
      continue;
    }
    const distance = calculateDistance(node.position, position);
    if (distance > radius) {
      continue;
    }
    const baseContribution = 1 - distance / radius;
    const weighted =
      baseContribution * facilityWeight(node.type as "station" | "depot", kind);
    const boost = logistics.getFacilityBoost(node.id, kind);
    const coverage = clamp01(weighted + boost);

    if (coverage > bestCoverage) {
      bestCoverage = coverage;
      bestFacility = node.id;
    }
  }

  return { coverage: bestCoverage, facilityId: bestFacility };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
