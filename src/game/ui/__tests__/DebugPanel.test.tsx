import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from "@testing-library/react";
import { useEffect } from "react";
import { WorldProvider, useWorld } from "@/game/ecs/world";
import { DebugPanel } from "@/game/ui/DebugPanel";
import { useDebug } from "@/game/state/slices/debug";

function DebugPanelHarness() {
  const world = useWorld();

  useEffect(() => {
    world.add({
      id: "entity-1",
      Transform: { position: [1, 0.5, 2] },
      Renderable: { kind: "vehicle" },
      Vehicle: {
        speed: 1,
        accel: 0,
        maxSpeed: 5,
        type: "train",
        route: {
          state: "idle",
          currentNodeId: "node-a",
          targetNodeId: "node-b",
          path: null,
          currentEdgeIndex: 0,
          distanceAlongEdge: 0,
          dwellTimeRemaining: 0,
        },
      },
    });
  }, [world]);

  return <DebugPanel />;
}

beforeEach(() => {
  const raf = (callback: FrameRequestCallback) =>
    setTimeout(() => {
      act(() => {
        callback(0);
      });
    }, 0) as unknown as number;
  const caf = (handle: number) => clearTimeout(handle);
  global.requestAnimationFrame = raf;
  global.cancelAnimationFrame = caf;
  globalThis.requestAnimationFrame = raf;
  globalThis.cancelAnimationFrame = caf;
  if (typeof window !== "undefined") {
    window.requestAnimationFrame = raf;
    window.cancelAnimationFrame = caf;
  }

  useDebug.setState({
    panelVisible: true,
    showStats: false,
    showEntityInspector: false,
  });
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).requestAnimationFrame;
  delete (globalThis as Record<string, unknown>).cancelAnimationFrame;
  if (typeof window !== "undefined") {
    delete (window as Record<string, unknown>).requestAnimationFrame;
    delete (window as Record<string, unknown>).cancelAnimationFrame;
  }
  useDebug.setState({
    panelVisible: false,
    showStats: true,
    showEntityInspector: false,
  });
  cleanup();
});

describe("DebugPanel", () => {
  it("toggles the entity inspector list", async () => {
    render(
      <WorldProvider>
        <DebugPanelHarness />
      </WorldProvider>,
    );

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    expect(screen.queryByText("entity-1")).not.toBeInTheDocument();

    const toggleButton = screen.getByRole("button", { name: /show/i });

    await act(async () => {
      fireEvent.click(toggleButton);
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    expect(await screen.findByText("entity-1")).toBeInTheDocument();
    expect(screen.getByText(/Speed 1\.00\/5\.00/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(toggleButton);
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("entity-1")).not.toBeInTheDocument();
    });
  });
});
