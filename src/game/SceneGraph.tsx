import { useWorld } from './ecs/world';

export function SceneGraph() {
  const world = useWorld();
  const entities = world.with('Transform', 'Renderable');

  return (
    <>
      {[...entities].map((entity) => {
        const transform = entity.Transform!;
        const renderable = entity.Renderable!;

        return (
          <mesh key={entity.id} position={transform.position}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={renderable.kind === 'vehicle' ? 'red' : 'gray'} />
          </mesh>
        );
      })}
    </>
  );
}
