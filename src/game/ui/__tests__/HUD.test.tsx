import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
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

  it("renders expansion progress panel with accessible progress bars", () => {
    act(() => {
      useUIStore.setState({ sidebarOpen: true });
    });

    render(<ManagementSidebar />);

    const progressHeading = screen.getByRole("heading", {
      level: 2,
      name: /expansion progress/i,
    });
    expect(progressHeading).toBeInTheDocument();

    const coverageBar = screen.getByRole("progressbar", {
      name: /network coverage/i,
    });
    expect(coverageBar).toHaveAttribute("aria-valuenow", "72");
    expect(screen.getByText("72%")).toBeInTheDocument();

    const allBars = screen.getAllByRole("progressbar");
    expect(allBars).toHaveLength(3);
  });

  it("lists territory categories with counts and statuses", () => {
    act(() => {
      useUIStore.setState({ sidebarOpen: true });
    });

    render(<ManagementSidebar />);

    const territorySection = screen
      .getByRole("heading", { level: 2, name: /territory summary/i })
      .closest("section");
    expect(territorySection).not.toBeNull();

    const territoryWithin = within(territorySection!);
    ["Towns", "Farms", "Industries", "Mines"].forEach((label) => {
      expect(territoryWithin.getByText(label)).toBeInTheDocument();
    });
    expect(territoryWithin.getByText("12")).toBeInTheDocument();
    expect(territoryWithin.getByText(/Growing ridership/i)).toBeInTheDocument();
  });

  it("shows production opportunities with status chips", () => {
    act(() => {
      useUIStore.setState({ sidebarOpen: true });
    });

    render(<ManagementSidebar />);

    const opportunitiesSection = screen
      .getByRole("heading", { level: 2, name: /production opportunities/i })
      .closest("section");
    expect(opportunitiesSection).not.toBeNull();

    const scoped = within(opportunitiesSection!);
    expect(scoped.getByText(/Ironcrest Steelworks/i)).toBeInTheDocument();
    expect(scoped.getByText(/Needs rail link/i)).toHaveClass("status-chip");
    expect(scoped.getAllByText(/Updated/i)).toHaveLength(3);
  });
});
