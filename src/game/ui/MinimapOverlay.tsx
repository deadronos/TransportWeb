import { useCallback, useEffect, useRef } from "react";
import { useUIStore } from "@/game/state/slices/ui";

const MAP_SIZE = 220;
const WORLD_RANGE = 220;

export function MinimapOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const azimuth = useUIStore((state) => state.cameraAzimuth);
  const target = useUIStore((state) => state.cameraTarget);
  const recenterCamera = useUIStore((state) => state.recenterCamera);

  const drawMinimap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#0f171f");
    gradient.addColorStop(1, "#1d2d1f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    const spacing = 22;
    ctx.beginPath();
    for (let x = spacing; x < canvas.width; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = spacing; y < canvas.height; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Orientation wedge
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-azimuth);
    ctx.fillStyle = "rgba(147, 211, 164, 0.85)";
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(14, 12);
    ctx.lineTo(-14, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Crosshair & border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, canvas.height - 20);
    ctx.moveTo(20, centerY);
    ctx.lineTo(canvas.width - 20, centerY);
    ctx.stroke();

    // Target indicator
    ctx.fillStyle = "#ffe066";
    const normalizedX = (target[0] / WORLD_RANGE) * (canvas.width / 2 - 12);
    const normalizedZ = (target[2] / WORLD_RANGE) * (canvas.height / 2 - 12);
    ctx.beginPath();
    ctx.arc(centerX + normalizedX, centerY - normalizedZ, 6, 0, Math.PI * 2);
    ctx.fill();
  }, [azimuth, target]);

  useEffect(() => {
    drawMinimap();
  }, [drawMinimap]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const normalizedX = (x / rect.width) * 2 - 1;
      const normalizedY = 1 - (y / rect.height) * 2;

      const newTarget: [number, number, number] = [
        target[0] + normalizedX * WORLD_RANGE,
        target[1],
        target[2] + normalizedY * WORLD_RANGE,
      ];

      recenterCamera(newTarget);
    },
    [recenterCamera, target],
  );

  return (
    <div className="minimap-overlay">
      <canvas
        ref={canvasRef}
        width={MAP_SIZE}
        height={MAP_SIZE}
        onClick={handleClick}
        role="img"
        aria-label="Network minimap"
      />
      <div className="minimap-overlay__legend">
        <span>Camera</span>
        <span>Azimuth {Math.round((azimuth * 180) / Math.PI)}°</span>
      </div>
    </div>
  );
}
