import {
  useConstruction,
  type ConstructionTool,
} from "@/game/state/slices/construction";
import { useClock } from "@/game/state/slices/clock";
import { useDebug } from "@/game/state/slices/debug";
import { useUIStore } from "@/game/state/slices/ui";
import "./TopMenuBar.css";

interface ToolButton {
  id: ConstructionTool;
  label: string;
  icon: string;
  hotkey?: string;
}

const CONSTRUCTION_TOOLS: ToolButton[] = [
  { id: "rail", label: "Build Rails", icon: "🛤️", hotkey: "R" },
  { id: "road", label: "Build Roads", icon: "🛣️", hotkey: "O" },
  { id: "station", label: "Build Station", icon: "🚉", hotkey: "S" },
  { id: "depot", label: "Build Depot", icon: "🏭", hotkey: "D" },
  { id: "demolish", label: "Demolish", icon: "💣", hotkey: "X" },
  { id: "query", label: "Query Tool", icon: "❓", hotkey: "Q" },
];

const SPEED_MULTIPLIERS = [1, 2, 4, 8] as const;

export function TopMenuBar() {
  const { tool, setTool, showGrid, toggleGrid } = useConstruction();
  const { speed, paused, setSpeed, togglePause } = useClock();
  const formattedDate = useClock((state) => state.formattedDate);
  const formattedTime = useClock((state) => state.formattedTime);
  const panelVisible = useDebug((state) => state.panelVisible);
  const togglePanel = useDebug((state) => state.togglePanel);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <header className="top-menu-bar">
      <div className="menu-section brand">
        <button
          className={`brand-btn ${sidebarOpen ? "active" : ""}`}
          onClick={toggleSidebar}
          title="Toggle management sidebar"
          aria-pressed={sidebarOpen}
        >
          <span className="icon">🏢</span>
          <span className="label">Company</span>
        </button>
        <div className="brand-title">
          <span className="name">TransportWeb Co.</span>
          <span className="motto">Connecting cities since 1950</span>
        </div>
      </div>

      {/* Left section - Construction tools */}
      <div className="menu-section tools">
        <h3>Construction</h3>
        <div className="tool-buttons">
          {CONSTRUCTION_TOOLS.map((btn) => (
            <button
              key={btn.id}
              className={`tool-btn ${tool === btn.id ? "active" : ""}`}
              onClick={() => setTool(tool === btn.id ? "none" : btn.id)}
              title={`${btn.label} (${btn.hotkey})`}
            >
              <span className="icon">{btn.icon}</span>
              <span className="label">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center section - Time & Date */}
      <div className="menu-section time-display">
        <div className="game-date">
          <span className="date" data-testid="hud-date">
            {formattedDate}
          </span>
          <span className="time" data-testid="hud-time">
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Right section - Speed controls */}
      <div className="menu-section controls">
        <button
          className={`control-btn ${paused ? "active" : ""}`}
          onClick={togglePause}
          title="Pause (Space)"
          aria-label={paused ? "Play" : "Pause"}
          data-testid="pause-button"
        >
          <span className="icon">{paused ? "▶️" : "⏸️"}</span>
          <span className="label-text">{paused ? "Play" : "Pause"}</span>
        </button>

        {SPEED_MULTIPLIERS.map((multiplier) => (
          <button
            key={multiplier}
            className={`control-btn ${!paused && speed === multiplier ? "active" : ""}`}
            onClick={() => {
              setSpeed(multiplier);
              if (paused) togglePause();
            }}
            title={`Speed ${multiplier}x`}
            aria-label={`×${multiplier} Speed ${multiplier}x`}
          >
            <span className="label-text">×{multiplier}</span>
          </button>
        ))}

        <button
          className={`control-btn ${showGrid ? "active" : ""}`}
          onClick={toggleGrid}
          title="Toggle Grid (G)"
        >
          🔲
        </button>

        <button
          className={`control-btn ${panelVisible ? "active" : ""}`}
          onClick={togglePanel}
          title="Toggle Debug Panel"
          aria-pressed={panelVisible}
          aria-label="Toggle debug panel"
        >
          🛠️
        </button>
      </div>
    </header>
  );
}
