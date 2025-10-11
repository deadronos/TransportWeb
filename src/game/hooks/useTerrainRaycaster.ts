import { useThree } from '@react-three/fiber';
import { useRef, useCallback } from 'react';
import { Raycaster, Vector2, Vector3, Plane } from 'three';

/**
 * Hook for raycasting mouse position onto the terrain plane.
 * Converts normalized device coordinates to world space position.
 */
export function useTerrainRaycaster() {
  const { camera } = useThree();
  const raycaster = useRef(new Raycaster());
  const terrainPlane = useRef(new Plane(new Vector3(0, 1, 0), 0)); // XZ plane at y=0

  const raycast = useCallback(
    (mouseNDC: Vector2): Vector3 | null => {
      // Cast ray from camera through mouse position
      raycaster.current.setFromCamera(mouseNDC, camera);

      // Find intersection with terrain plane
      const intersectionPoint = new Vector3();
      const didIntersect = raycaster.current.ray.intersectPlane(
        terrainPlane.current,
        intersectionPoint
      );

      return didIntersect ? intersectionPoint : null;
    },
    [camera]
  );

  return raycast;
}
