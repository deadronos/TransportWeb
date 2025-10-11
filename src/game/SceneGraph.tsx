import { useWorld } from './ecs/world';

export function SceneGraph() {
  const world = useWorld();
  const entities = world.with('Transform', 'Renderable');

  const colorByKind: Record<string, string> = {
    track: '#6f7a8a',
    road: '#505050',
    station: '#d1a054',
    depot: '#8c6239',
    vehicle: '#c0392b',
    tree: '#2d8659',
  };

  return (
    <>
      {[...entities].map((entity) => {
        const transform = entity.Transform!;
        const renderable = entity.Renderable!;

        const dimensions = renderable.dimensions ?? [1, 1, 1];
        const color = renderable.color ?? colorByKind[renderable.kind] ?? '#888888';

        return (
          <mesh
            key={entity.id}
            position={transform.position}
            rotation={transform.rotation}
            scale={transform.scale}
            castShadow
            receiveShadow
          >
            <boxGeometry args={dimensions} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      })}
    </>
  );
}
