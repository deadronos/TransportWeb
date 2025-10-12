import { create } from "zustand";

export type CameraRecenter = (position: [number, number, number]) => void;

interface UIState {
  sidebarOpen: boolean;
  minimapVisible: boolean;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  cameraAzimuth: number;
  cameraRecenterHandler: CameraRecenter;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setMinimapVisible: (visible: boolean) => void;
  setCameraInfo: (info: {
    position: [number, number, number];
    target: [number, number, number];
    azimuth: number;
  }) => void;
  registerCameraRecenter: (handler: CameraRecenter) => void;
  recenterCamera: CameraRecenter;
}

export const useUIStore = create<UIState>()((set, get) => ({
  sidebarOpen: false,
  minimapVisible: true,
  cameraPosition: [0, 0, 0],
  cameraTarget: [0, 0, 0],
  cameraAzimuth: 0,
  cameraRecenterHandler: () => undefined,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  setMinimapVisible: (visible) => set({ minimapVisible: visible }),
  setCameraInfo: ({ position, target, azimuth }) =>
    set({
      cameraPosition: [...position] as [number, number, number],
      cameraTarget: [...target] as [number, number, number],
      cameraAzimuth: azimuth,
    }),
  registerCameraRecenter: (handler) => set({ cameraRecenterHandler: handler }),
  recenterCamera: (position) => {
    const handler = get().cameraRecenterHandler;
    handler(position);
  },
}));
