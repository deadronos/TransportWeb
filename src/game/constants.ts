export const FIXED_TIMESTEP = 1 / 60; // 60fps

export const GRID_SIZE = 1; // 1 unit per grid cell

export const CAMERA_DEFAULT = {
  position: [12, 12, 12] as [number, number, number],
  fov: 50,
};

export const LIGHTS = {
  ambient: { intensity: 0.5 },
  directional: { position: [10, 20, 10] as [number, number, number], intensity: 1.1 },
};
