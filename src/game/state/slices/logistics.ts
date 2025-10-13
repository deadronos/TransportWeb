import { create } from "zustand";
import { nanoid } from "nanoid";
import type { SettlementKind } from "@/game/simulation/types";

export interface LineStop {
  nodeId: string;
  label: string;
  dwellSeconds: number;
}

export interface TransportLine {
  id: string;
  name: string;
  mode: "train" | "truck";
  color: string;
  stops: LineStop[];
  createdAt: number;
}

export interface FleetVehicleRecord {
  entityId: string;
  type: "train" | "truck";
  name: string;
  lineId: string | null;
  status: "idle" | "enroute" | "waiting";
  maxSpeed: number;
  capacity: number;
  purchaseCost: number;
}

export interface LogisticsState {
  lines: TransportLine[];
  vehicles: FleetVehicleRecord[];
  createLine: (input: {
    name: string;
    mode: TransportLine["mode"];
    stops: LineStop[];
    color?: string;
  }) => TransportLine;
  deleteLine: (id: string) => void;
  assignVehicleToLine: (entityId: string, lineId: string | null) => void;
  registerVehicle: (record: FleetVehicleRecord) => void;
  removeVehicle: (entityId: string) => void;
  updateVehicleStatus: (
    entityId: string,
    status: FleetVehicleRecord["status"],
  ) => void;
  updateVehicleAttributes: (
    entityId: string,
    updates: Partial<Omit<FleetVehicleRecord, "entityId" | "status">>,
  ) => void;
  getLine: (id: string) => TransportLine | undefined;
  getFacilityBoost: (nodeId: string, kind: SettlementKind) => number;
}

const LINE_COLORS = [
  "#4aa3ff",
  "#ff7b4a",
  "#7c5cff",
  "#4affb4",
  "#ffc44a",
  "#ff6fb7",
  "#4ad6ff",
];

function pickLineColor(index: number): string {
  return LINE_COLORS[index % LINE_COLORS.length] ?? "#4aa3ff";
}

function sanitizeStops(stops: LineStop[]): LineStop[] {
  const seen = new Set<string>();
  const deduped: LineStop[] = [];
  for (const stop of stops) {
    if (!stop.nodeId || seen.has(stop.nodeId)) {
      continue;
    }
    seen.add(stop.nodeId);
    deduped.push({ ...stop });
  }
  return deduped.slice(0, 8);
}

export const useLogisticsStore = create<LogisticsState>()((set, get) => ({
  lines: [],
  vehicles: [],
  createLine: ({ name, mode, stops, color }) => {
    const cleanedStops = sanitizeStops(stops);
    if (cleanedStops.length < 2) {
      throw new Error("A transport line requires at least two unique stops.");
    }
    const line: TransportLine = {
      id: nanoid(),
      name,
      mode,
      color: color ?? pickLineColor(get().lines.length),
      stops: cleanedStops,
      createdAt: Date.now(),
    };
    set((state) => ({ lines: [...state.lines, line] }));
    return line;
  },
  deleteLine: (id) => {
    set((state) => ({
      lines: state.lines.filter((line) => line.id !== id),
      vehicles: state.vehicles.map((vehicle) =>
        vehicle.lineId === id
          ? { ...vehicle, lineId: null, status: "idle" }
          : vehicle,
      ),
    }));
  },
  assignVehicleToLine: (entityId, lineId) => {
    const current = get().vehicles.find(
      (vehicle) => vehicle.entityId === entityId,
    );
    if (!current) {
      return;
    }

    if (current.lineId === lineId) {
      return;
    }

    set((state) => ({
      vehicles: state.vehicles.map((vehicle) =>
        vehicle.entityId === entityId
          ? { ...vehicle, lineId, status: lineId ? vehicle.status : "idle" }
          : vehicle,
      ),
    }));
  },
  registerVehicle: (record) => {
    set((state) => {
      if (
        state.vehicles.some((vehicle) => vehicle.entityId === record.entityId)
      ) {
        return {};
      }
      return { vehicles: [...state.vehicles, record] };
    });
  },
  removeVehicle: (entityId) => {
    set((state) => ({
      vehicles: state.vehicles.filter(
        (vehicle) => vehicle.entityId !== entityId,
      ),
    }));
  },
  updateVehicleStatus: (entityId, status) => {
    const current = get().vehicles.find(
      (vehicle) => vehicle.entityId === entityId,
    );
    if (!current || current.status === status) {
      return;
    }

    set((state) => ({
      vehicles: state.vehicles.map((vehicle) =>
        vehicle.entityId === entityId ? { ...vehicle, status } : vehicle,
      ),
    }));
  },
  updateVehicleAttributes: (entityId, updates) => {
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) =>
        vehicle.entityId === entityId ? { ...vehicle, ...updates } : vehicle,
      ),
    }));
  },
  getLine: (id) => get().lines.find((line) => line.id === id),
  getFacilityBoost: (nodeId, kind) => {
    const state = get();
    let boost = 0;
    for (const line of state.lines) {
      if (!line.stops.some((stop) => stop.nodeId === nodeId)) {
        continue;
      }
      const vehiclesOnLine = state.vehicles.filter(
        (vehicle) => vehicle.lineId === line.id,
      );
      if (vehiclesOnLine.length === 0) {
        continue;
      }
      const modeWeight =
        line.mode === "train"
          ? kind === "town"
            ? 0.35
            : 0.25
          : kind === "town"
            ? 0.25
            : 0.32;
      const fleetBoost = vehiclesOnLine.length * 0.06 * modeWeight;
      boost += fleetBoost;
    }
    return Math.min(0.45, boost);
  },
}));
