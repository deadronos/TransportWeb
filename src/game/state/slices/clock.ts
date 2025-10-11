import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

export type ClockState = {
  speed: number;
  paused: boolean;
  setSpeed: (speed: number) => void;
  togglePause: () => void;
};

export const useClock = create<ClockState>()(
  devtools(
    persist(
      (set, get) => ({
        speed: 1,
        paused: false,
        setSpeed: (speed) => set({ speed }),
        togglePause: () => set({ paused: !get().paused }),
      }),
      {
        name: "clock-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ speed: state.speed }),
      },
    ),
  ),
);
