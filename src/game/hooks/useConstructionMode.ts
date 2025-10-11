import { useThree } from '@react-three/fiber';
import { useState, useCallback, useEffect } from 'react';
import { Vector2, Vector3 } from 'three';
import { useTerrainRaycaster } from './useTerrainRaycaster';
import { snapToGrid } from '../utils/grid';
import { useConstruction } from '../state/slices/construction';

export interface ConstructionModeState {
  hoverPosition: Vector3 | null;
  isValid: boolean;
  isActive: boolean;
}

/**
 * Hook for managing construction mode interactions.
 * Handles mouse movement, raycasting, grid snapping, and placement logic.
 */
export function useConstructionMode() {
  const { tool, setGhostPosition, setValidPlacement } = useConstruction();
  const { gl } = useThree();
  const raycast = useTerrainRaycaster();

  const [hoverPosition, setHoverPosition] = useState<Vector3 | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Construction mode is active when a tool is selected (but not Query)
  const isActive = tool !== 'none' && tool !== 'query';

  // Handle mouse move - update hover position
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isActive) {
        setHoverPosition(null);
        return;
      }

      // Convert to normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const mouseNDC = new Vector2(x, y);
      const worldPos = raycast(mouseNDC);

      if (worldPos) {
        // Snap to grid
        const snappedPos = snapToGrid(worldPos, 10);
        setHoverPosition(snappedPos);

        // Update Zustand state for ghost preview
        setGhostPosition([snappedPos.x, snappedPos.y, snappedPos.z]);

        // TODO: Add actual validity checking (terrain, collisions, budget, etc.)
        // For now, always valid
        setIsValid(true);
        setValidPlacement(true);
      } else {
        setHoverPosition(null);
        setGhostPosition(null);
      }
    },
    [isActive, gl.domElement, raycast, setGhostPosition, setValidPlacement]
  );

  // Handle click - place building/track
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isActive || !hoverPosition || !isValid) {
        return;
      }

      // Prevent click from triggering OrbitControls
      event.stopPropagation();

      // TODO: Add actual placement logic
      // - Create entity in ECS
      // - Deduct cost from budget
      // - Update network graph
      console.log(`Placing ${tool} at`, hoverPosition);

      // For now, just log the placement
      // In Phase 3, this will create actual track/road/building entities
    },
    [isActive, hoverPosition, isValid, tool]
  );

  // Set up event listeners
  useEffect(() => {
    const canvas = gl.domElement;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gl.domElement, handleMouseMove, handleClick]);

  return {
    hoverPosition,
    isValid,
    isActive,
  };
}
