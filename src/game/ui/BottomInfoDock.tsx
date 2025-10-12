import { useMemo } from "react";
import { useUIStore } from "@/game/state/slices/ui";
import { MinimapOverlay } from "./MinimapOverlay";
import "./BottomInfoDock.css";

const SELECTION_PLACEHOLDER = {
  name: "Northport Junction",
  type: "Station",
  throughput: "1200 pax / month",
  status: "Loading",
};

export function BottomInfoDock() {
  const minimapVisible = useUIStore((state) => state.minimapVisible);

  const stats = useMemo(
    () => [
      { label: "Balance", value: "$1.2M" },
      { label: "Reputation", value: "A" },
      { label: "Network", value: "42 stations" },
    ],
    [],
  );

  return (
    <div className="bottom-info-dock" aria-hidden={!minimapVisible}>
      <div className="selection-card">
        <h3>{SELECTION_PLACEHOLDER.name}</h3>
        <p className="selection-type">{SELECTION_PLACEHOLDER.type}</p>
        <p className="selection-detail">{SELECTION_PLACEHOLDER.throughput}</p>
        <p className="selection-status">{SELECTION_PLACEHOLDER.status}</p>
      </div>
      <div className="hud-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="hud-stats__item">
            <span className="label">{stat.label}</span>
            <span className="value">{stat.value}</span>
          </div>
        ))}
      </div>
      <MinimapOverlay />
    </div>
  );
}
