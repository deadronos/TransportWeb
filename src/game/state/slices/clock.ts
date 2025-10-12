import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

const START_DATE = Date.UTC(1950, 0, 1, 0, 0, 0);
const MINUTES_PER_SECOND = 6; // 10 seconds of real time ≈ 1 in-game hour

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function minutesToDate(minutes: number): Date {
  return new Date(START_DATE + minutes * 60 * 1000);
}

function formatDate(minutes: number): {
  formattedDate: string;
  formattedTime: string;
} {
  const date = minutesToDate(minutes);
  return {
    formattedDate: dateFormatter.format(date),
    formattedTime: timeFormatter.format(date),
  };
}

export type ClockState = {
  speed: number;
  paused: boolean;
  gameMinutes: number;
  formattedDate: string;
  formattedTime: string;
  setSpeed: (speed: number) => void;
  togglePause: () => void;
  advanceTime: (deltaSeconds: number) => void;
  resetTime: (minutes?: number) => void;
};

export const useClock = create<ClockState>()(
  devtools(
    persist(
      (set, get) => ({
        speed: 1,
        paused: false,
        gameMinutes: 0,
        ...formatDate(0),
        setSpeed: (speed) => set({ speed }),
        togglePause: () => set({ paused: !get().paused }),
        advanceTime: (deltaSeconds) => {
          set((state) => {
            const minutes =
              state.gameMinutes + deltaSeconds * MINUTES_PER_SECOND;
            const { formattedDate, formattedTime } = formatDate(minutes);
            return {
              gameMinutes: minutes,
              formattedDate,
              formattedTime,
            };
          });
        },
        resetTime: (minutes = 0) => {
          const { formattedDate, formattedTime } = formatDate(minutes);
          set({
            gameMinutes: minutes,
            formattedDate,
            formattedTime,
          });
        },
      }),
      {
        name: "clock-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          speed: state.speed,
          gameMinutes: state.gameMinutes,
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) {
            return;
          }

          const { formattedDate, formattedTime } = formatDate(
            state.gameMinutes,
          );
          state.formattedDate = formattedDate;
          state.formattedTime = formattedTime;
        },
      },
    ),
  ),
);
