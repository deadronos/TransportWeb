import { create } from "zustand";

import type { TrackType } from "@/game/network/types";
import type { Farm, Industry, Mine, Town } from "@/game/simulation/types";

export interface PreviewSegment {
  id: string;
  midpoint: [number, number, number];
  rotationY: number;
  length: number;
  thickness: number;
  width: number;
  trackType: TrackType;
}

export interface FacilityPreview {
  position: [number, number, number];
  radius: number;
  color: string;
}

export type SettlementPreview = Town | Farm | Industry | Mine;

export interface QueryPreview {
  settlement: SettlementPreview;
}

interface ToolPreviewState {
  segments: PreviewSegment[];
  facility: FacilityPreview | null;
  query: QueryPreview | null;
  setSegments: (segments: PreviewSegment[]) => void;
  setFacility: (facility: FacilityPreview | null) => void;
  setQuery: (preview: QueryPreview | null) => void;
  reset: () => void;
}

export const useToolPreviewStore = create<ToolPreviewState>()((set) => ({
  segments: [],
  facility: null,
  query: null,
  setSegments: (segments) => set({ segments }),
  setFacility: (facility) => set({ facility }),
  setQuery: (preview) => set({ query: preview }),
  reset: () => set({ segments: [], facility: null, query: null }),
}));
