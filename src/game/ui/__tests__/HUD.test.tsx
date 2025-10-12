import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { TopMenuBar } from "@/game/ui/TopMenuBar";
import { ManagementSidebar } from "@/game/ui/ManagementSidebar";
import { MinimapOverlay } from "@/game/ui/MinimapOverlay";
import { useClock } from "@/game/state/slices/clock";
import { useUIStore } from "@/game/state/slices/ui";

beforeEach(() => {
  act(() => {
    useClock.getState().resetTime(0);
    useClock.setState({ paused: false, speed: 1 });
    useUIStore.setState({
      sidebarOpen: false,
      minimapVisible: true,
      cameraPosition: [0, 12, 0],
      cameraTarget: [0, 0, 0],
      cameraAzimuth: 0,
      cameraRecenterHandler: () => undefined,
    });
  });
});

afterEach(() => {
  cleanup();
});

describe("HUD integrations", () => {
  it("renders formatted clock values and toggles the sidebar", () => {
    render(<TopMenuBar />);

    expect(screen.getByTestId("hud-date")).toHaveTextContent("Jan 1950");
    expect(screen.getByTestId("hud-time")).toHaveTextContent("00:00");

    act(() => {
      useClock.getState().advanceTime(60); // 1 minute of real time ≈ 6 in-game hours
    });

    expect(screen.getByTestId("hud-time")).toHaveTextContent("06:00");

    const toggleButton = screen.getByRole("button", { name: /company/i });
    fireEvent.click(toggleButton);

    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("applies open class when management sidebar is visible", () => {
    const { container } = render(<ManagementSidebar />);

    const sidebar = container.querySelector(".management-sidebar");
    expect(sidebar).not.toHaveClass("open");

    act(() => {
      useUIStore.setState({ sidebarOpen: true });
    });

    expect(sidebar).toHaveClass("open");
  });

  it("invokes camera recenter when minimap is clicked", () => {
    const recenter = vi.fn();

    act(() => {
      useUIStore.setState({ cameraRecenterHandler: recenter });
    });

    const boundingRectMock = vi
      .spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect")
      .mockReturnValue(new DOMRect(0, 0, 200, 200));

    render(<MinimapOverlay />);

    const canvas = screen.getByRole("img", { name: /network minimap/i });
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });

    expect(recenter).toHaveBeenCalledTimes(1);

    boundingRectMock.mockRestore();
  });
});
