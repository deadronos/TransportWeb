import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type ConstructionTool =
  | "none"
  | "rail"
  | "road"
  | "station"
  | "depot"
  | "signal"
  | "demolish"
  | "query";

export interface ConstructionState {
  /** Currently selected construction tool */
  tool: ConstructionTool;
  /** Whether grid is visible */
  showGrid: boolean;
  /** Construction mode active */
  isConstructing: boolean;
  /** Ghost preview position (if any) */
  ghostPosition: [number, number, number] | null;
  /** Whether ghost preview is valid placement */
  isValidPlacement: boolean;

  /** Actions */
  setTool: (tool: ConstructionTool) => void;
  toggleGrid: () => void;
  setGhostPosition: (pos: [number, number, number] | null) => void;
  setValidPlacement: (valid: boolean) => void;
  startConstruction: () => void;
  endConstruction: () => void;
}

export const useConstruction = create<ConstructionState>()(
  devtools(
    persist(
      (set) => ({
        tool: "none",
        showGrid: false,
        isConstructing: false,
        ghostPosition: null,
        isValidPlacement: false,

        setTool: (tool) => {
          set({ tool });
          // Auto-enable grid when construction tool selected
          if (tool !== "none" && tool !== "query") {
            set({ showGrid: true, isConstructing: true });
          } else {
            set({ isConstructing: false, ghostPosition: null });
          }
        },

        toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

        setGhostPosition: (pos) => set({ ghostPosition: pos }),

        setValidPlacement: (valid) => set({ isValidPlacement: valid }),

        startConstruction: () => set({ isConstructing: true }),

        endConstruction: () =>
          set({
            isConstructing: false,
            ghostPosition: null,
            tool: "none",
          }),
      }),
      {
        name: "construction-store",
        partialize: (state) => ({
          showGrid: state.showGrid,
        }),
      },
    ),
    { name: "ConstructionStore" },
  ),
);
