import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type DebugState = {
  panelVisible: boolean;
  showStats: boolean;
  togglePanel: () => void;
  closePanel: () => void;
  setPanelVisible: (visible: boolean) => void;
  setShowStats: (visible: boolean) => void;
};

export const useDebug = create<DebugState>()(
  devtools((set) => ({
    panelVisible: false,
    showStats: true,
    togglePanel: () =>
      set((state) => ({
        panelVisible: !state.panelVisible,
      })),
    closePanel: () => set({ panelVisible: false }),
    setPanelVisible: (visible) => set({ panelVisible: visible }),
    setShowStats: (visible) => set({ showStats: visible }),
  })),
);
