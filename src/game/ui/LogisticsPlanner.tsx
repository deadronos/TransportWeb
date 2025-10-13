import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { nanoid } from "nanoid";
import {
  useConstruction,
  type ConstructionTool,
} from "@/game/state/slices/construction";
import {
  useLogisticsStore,
  type LineStop,
  type TransportLine,
} from "@/game/state/slices/logistics";
import { useNetworkStore } from "@/game/state/slices/network";
import { useWorld } from "@/game/ecs/world";

interface FacilityOption {
  id: string;
  label: string;
  type: "station" | "depot";
}

function toLineStop(option: FacilityOption): LineStop {
  return {
    nodeId: option.id,
    label: option.label,
    dwellSeconds: 60,
  };
}

function facilityDisplayName(option: FacilityOption): string {
  return `${option.label} (${option.type === "station" ? "Rail" : "Road"})`;
}

function defaultVehicleName(type: "train" | "truck", existing: number): string {
  const index = existing + 1;
  return type === "train" ? `Train ${index}` : `Truck ${index}`;
}

export function LogisticsPlanner() {
  const world = useWorld();
  const setTool = useConstruction((state) => state.setTool);
  const lines = useLogisticsStore((state) => state.lines);
  const vehicles = useLogisticsStore((state) => state.vehicles);
  const createLine = useLogisticsStore((state) => state.createLine);
  const assignVehicleToLine = useLogisticsStore(
    (state) => state.assignVehicleToLine,
  );
  const registerVehicle = useLogisticsStore((state) => state.registerVehicle);
  const updateVehicleStatus = useLogisticsStore(
    (state) => state.updateVehicleStatus,
  );
  const getLine = useLogisticsStore((state) => state.getLine);

  const graph = useNetworkStore((state) => state.graph);
  const networkVersion = useNetworkStore((state) => state.version);
  const facilities = useMemo<FacilityOption[]>(() => {
    const nodes = graph.getAllNodes();
    if (networkVersion > 0 && nodes.length === 0) {
      return [];
    }

    return nodes
      .filter((node) => node.type === "station" || node.type === "depot")
      .map((node) => {
        const metadataName = node.metadata?.name;
        return {
          id: node.id,
          type: node.type as "station" | "depot",
          label:
            typeof metadataName === "string"
              ? metadataName
              : `${node.type === "station" ? "Station" : "Depot"} ${node.id.slice(-4)}`,
        } satisfies FacilityOption;
      });
  }, [graph, networkVersion]);

  const [lineName, setLineName] = useState("New Line");
  const [lineMode, setLineMode] = useState<TransportLine["mode"]>("train");
  const [startStopId, setStartStopId] = useState("");
  const [midStopId, setMidStopId] = useState("");
  const [endStopId, setEndStopId] = useState("");
  const [vehicleType, setVehicleType] = useState<"train" | "truck">("train");
  const [vehicleName, setVehicleName] = useState(
    defaultVehicleName("train", vehicles.length),
  );
  const [vehicleLineId, setVehicleLineId] = useState<string>("");

  const startStopOptions = facilities;
  const midStopOptions = facilities.filter(
    (facility) => facility.id !== startStopId && facility.id !== endStopId,
  );
  const endStopOptions = facilities.filter(
    (facility) => facility.id !== startStopId,
  );

  const handleSelectTool = (tool: ConstructionTool) => {
    setTool(tool);
  };

  const handleCreateLine = (event: FormEvent) => {
    event.preventDefault();
    const start = facilities.find((facility) => facility.id === startStopId);
    const end = facilities.find((facility) => facility.id === endStopId);
    if (!start || !end) {
      return;
    }

    const stops: LineStop[] = [toLineStop(start)];
    if (midStopId) {
      const mid = facilities.find((facility) => facility.id === midStopId);
      if (mid && mid.id !== start.id && mid.id !== end.id) {
        stops.push(toLineStop(mid));
      }
    }
    stops.push(toLineStop(end));

    const created = createLine({
      name: lineName.trim() || "New Line",
      mode: lineMode,
      stops,
    });

    setLineName("New Line");
    setStartStopId("");
    setMidStopId("");
    setEndStopId("");
    if (vehicleLineId === "" && created) {
      setVehicleLineId(created.id);
    }
  };

  const handlePurchaseVehicle = (event: FormEvent) => {
    event.preventDefault();
    const targetLine = vehicleLineId ? getLine(vehicleLineId) : undefined;
    const preferredStops = targetLine?.stops ?? [];
    const preferredNodeId = preferredStops[0]?.nodeId;
    const fallbackFacility = facilities.find((facility) =>
      vehicleType === "train" ? facility.type === "station" : true,
    );
    const nodeForSpawn = preferredNodeId
      ? graph.getNode(preferredNodeId)
      : fallbackFacility
        ? graph.getNode(fallbackFacility.id)
        : undefined;

    const position: [number, number, number] = nodeForSpawn
      ? [
          nodeForSpawn.position[0],
          nodeForSpawn.position[1] + 0.5,
          nodeForSpawn.position[2],
        ]
      : [0, 0.5, 0];
    const currentNodeId = nodeForSpawn ? nodeForSpawn.id : null;
    const name =
      vehicleName.trim() || defaultVehicleName(vehicleType, vehicles.length);

    const entityId = nanoid();
    world.add({
      id: entityId,
      Transform: { position },
      Renderable: { kind: "vehicle" },
      Vehicle: {
        speed: 0,
        accel: vehicleType === "train" ? 0.6 : 0.45,
        maxSpeed: vehicleType === "train" ? 4.2 : 2.6,
        capacity: vehicleType === "train" ? 96 : 48,
        type: vehicleType,
        assignment: {
          lineId: targetLine?.id ?? null,
          nextStopIndex: 0,
          direction: 1,
        },
        route: {
          state: targetLine ? "waiting" : "idle",
          currentNodeId,
          targetNodeId: null,
          path: null,
          currentEdgeIndex: 0,
          distanceAlongEdge: 0,
          dwellTimeRemaining: targetLine ? 1 : 0,
        },
      },
    });

    registerVehicle({
      entityId,
      type: vehicleType,
      name,
      lineId: targetLine?.id ?? null,
      status: targetLine ? "waiting" : "idle",
      maxSpeed: vehicleType === "train" ? 4.2 : 2.6,
      capacity: vehicleType === "train" ? 96 : 48,
      purchaseCost: vehicleType === "train" ? 120_000 : 48_000,
    });

    if (targetLine) {
      assignVehicleToLine(entityId, targetLine.id);
      updateVehicleStatus(entityId, "waiting");
    }

    setVehicleName(defaultVehicleName(vehicleType, vehicles.length + 1));
  };

  const handleAssignVehicle = (entityId: string, lineId: string | null) => {
    assignVehicleToLine(entityId, lineId);
    updateVehicleStatus(entityId, lineId ? "waiting" : "idle");
    const entity = Array.from(world.entities).find(
      (candidate) => candidate.id === entityId,
    );
    if (entity?.Vehicle) {
      entity.Vehicle.assignment = {
        lineId,
        nextStopIndex: 0,
        direction: 1,
      };
      if (entity.Vehicle.route) {
        entity.Vehicle.route.state = lineId ? "waiting" : "idle";
        entity.Vehicle.route.targetNodeId = null;
        entity.Vehicle.route.path = null;
        entity.Vehicle.route.currentEdgeIndex = 0;
        entity.Vehicle.route.distanceAlongEdge = 0;
        entity.Vehicle.route.dwellTimeRemaining = lineId ? 1 : 0;
      }
    }
  };

  return (
    <div className="logistics-planner">
      <div className="logistics-planner__section">
        <h4>Construction Shortcuts</h4>
        <div className="logistics-planner__buttons">
          <button type="button" onClick={() => handleSelectTool("station")}>
            Build Station
          </button>
          <button type="button" onClick={() => handleSelectTool("depot")}>
            Build Depot
          </button>
        </div>
      </div>

      <div className="logistics-planner__section">
        <h4>Create Line</h4>
        <form className="logistics-planner__form" onSubmit={handleCreateLine}>
          <label>
            Line name
            <input
              type="text"
              value={lineName}
              onChange={(event) => setLineName(event.target.value)}
            />
          </label>
          <label>
            Mode
            <select
              value={lineMode}
              onChange={(event) =>
                setLineMode(event.target.value as TransportLine["mode"])
              }
            >
              <option value="train">Rail</option>
              <option value="truck">Road</option>
            </select>
          </label>
          <label>
            Start stop
            <select
              value={startStopId}
              onChange={(event) => setStartStopId(event.target.value)}
            >
              <option value="">Select facility</option>
              {startStopOptions.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facilityDisplayName(facility)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Intermediate stop (optional)
            <select
              value={midStopId}
              onChange={(event) => setMidStopId(event.target.value)}
            >
              <option value="">Skip</option>
              {midStopOptions.map((facility) => (
                <option key={`${facility.id}-mid`} value={facility.id}>
                  {facilityDisplayName(facility)}
                </option>
              ))}
            </select>
          </label>
          <label>
            End stop
            <select
              value={endStopId}
              onChange={(event) => setEndStopId(event.target.value)}
            >
              <option value="">Select facility</option>
              {endStopOptions.map((facility) => (
                <option key={`${facility.id}-end`} value={facility.id}>
                  {facilityDisplayName(facility)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={!startStopId || !endStopId}>
            Add Line
          </button>
        </form>
      </div>

      <div className="logistics-planner__section">
        <h4>Fleet</h4>
        <form
          className="logistics-planner__form"
          onSubmit={handlePurchaseVehicle}
        >
          <label>
            Vehicle type
            <select
              value={vehicleType}
              onChange={(event) => {
                const nextType = event.target.value as "train" | "truck";
                setVehicleType(nextType);
                setVehicleName(defaultVehicleName(nextType, vehicles.length));
              }}
            >
              <option value="train">Train</option>
              <option value="truck">Truck</option>
            </select>
          </label>
          <label>
            Vehicle name
            <input
              type="text"
              value={vehicleName}
              onChange={(event) => setVehicleName(event.target.value)}
            />
          </label>
          <label>
            Assign to line
            <select
              value={vehicleLineId}
              onChange={(event) => setVehicleLineId(event.target.value)}
            >
              <option value="">Unassigned</option>
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={facilities.length === 0}>
            Purchase Vehicle
          </button>
        </form>

        <ul className="logistics-planner__vehicle-list">
          {vehicles.length === 0 ? (
            <li className="logistics-planner__vehicle-empty">
              No active vehicles
            </li>
          ) : (
            vehicles.map((vehicle) => (
              <li
                key={vehicle.entityId}
                className="logistics-planner__vehicle-item"
              >
                <div>
                  <strong>{vehicle.name}</strong>
                  <span className={`status-tag status-tag--${vehicle.status}`}>
                    {vehicle.status}
                  </span>
                </div>
                <div className="logistics-planner__vehicle-meta">
                  <span>{vehicle.type === "train" ? "Rail" : "Road"}</span>
                  <span>{vehicle.capacity} capacity</span>
                </div>
                <label>
                  Assigned line
                  <select
                    value={vehicle.lineId ?? ""}
                    onChange={(event) =>
                      handleAssignVehicle(
                        vehicle.entityId,
                        event.target.value ? event.target.value : null,
                      )
                    }
                  >
                    <option value="">Unassigned</option>
                    {lines.map((line) => (
                      <option
                        key={`${vehicle.entityId}-${line.id}`}
                        value={line.id}
                      >
                        {line.name}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
