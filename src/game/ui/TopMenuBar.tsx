import { useConstruction, type ConstructionTool } from '@/game/state/slices/construction';
import { useClock } from '@/game/state/slices/clock';
import './TopMenuBar.css';

interface ToolButton {
  id: ConstructionTool;
  label: string;
  icon: string;
  hotkey?: string;
}

const CONSTRUCTION_TOOLS: ToolButton[] = [
  { id: 'rail', label: 'Build Rails', icon: '🛤️', hotkey: 'R' },
  { id: 'road', label: 'Build Roads', icon: '🛣️', hotkey: 'O' },
  { id: 'station', label: 'Build Station', icon: '🚉', hotkey: 'S' },
  { id: 'depot', label: 'Build Depot', icon: '🏭', hotkey: 'D' },
  { id: 'demolish', label: 'Demolish', icon: '💣', hotkey: 'X' },
  { id: 'query', label: 'Query Tool', icon: '❓', hotkey: 'Q' },
];

const SPEED_MULTIPLIERS = [1, 2, 4, 8] as const;

export function TopMenuBar() {
  const { tool, setTool, showGrid, toggleGrid } = useConstruction();
  const { speed, paused, setSpeed, togglePause } = useClock();

  return (
    <header className="top-menu-bar">
      {/* Left section - Construction tools */}
      <div className="menu-section tools">
        <h3>Construction</h3>
        <div className="tool-buttons">
          {CONSTRUCTION_TOOLS.map((btn) => (
            <button
              key={btn.id}
              className={`tool-btn ${tool === btn.id ? 'active' : ''}`}
              onClick={() => setTool(tool === btn.id ? 'none' : btn.id)}
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
          <span className="date">Jan 1950</span>
          <span className="day">Mon</span>
        </div>
      </div>

      {/* Right section - Speed controls */}
      <div className="menu-section controls">
        <button
          className={`control-btn ${paused ? 'active' : ''}`}
          onClick={togglePause}
          title="Pause (Space)"
        >
          {paused ? '▶️' : '⏸️'}
        </button>

        {SPEED_MULTIPLIERS.map((multiplier) => (
          <button
            key={multiplier}
            className={`control-btn ${!paused && speed === multiplier ? 'active' : ''}`}
            onClick={() => {
              setSpeed(multiplier);
              if (paused) togglePause();
            }}
            title={`Speed ${multiplier}x`}
          >
            {multiplier}×
          </button>
        ))}

        <button
          className={`control-btn ${showGrid ? 'active' : ''}`}
          onClick={toggleGrid}
          title="Toggle Grid (G)"
        >
          🔲
        </button>
      </div>
    </header>
  );
}
