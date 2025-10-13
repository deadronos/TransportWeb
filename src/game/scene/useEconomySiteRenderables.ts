import { useEffect, useRef } from "react";
import type { World } from "miniplex";
import { useWorld, type Entity } from "@/game/ecs/world";
import {
  useEconomyStore,
  type EconomyState,
} from "@/game/state/slices/economy";
import type { Farm, Industry, Mine, Town } from "@/game/simulation/types";

type Settlement = Town | Farm | Industry | Mine;

const SETTLEMENT_COLORS: Record<Settlement["kind"], string> = {
  town: "#f6c177",
  farm: "#d26a52",
  industry: "#7f8fa6",
  mine: "#4b4b4b",
};

export interface EconomySiteRegistry {
  get(id: string): Entity | undefined;
  set(id: string, entity: Entity): void;
  delete(id: string): void;
  values(): IterableIterator<Entity>;
  entries(): IterableIterator<[string, Entity]>;
  clear(): void;
}

function defaultRegistry(): EconomySiteRegistry {
  const map = new Map<string, Entity>();
  return {
    get: (id) => map.get(id),
    set: (id, entity) => {
      map.set(id, entity);
    },
    delete: (id) => {
      map.delete(id);
    },
    entries: () => map.entries(),
    values: () => map.values(),
    clear: () => map.clear(),
  };
}

function allSettlements(state: EconomyState): Settlement[] {
  return [...state.towns, ...state.farms, ...state.industries, ...state.mines];
}

function ensureTransform(entity: Entity, position: Settlement["position"]) {
  if (!entity.Transform) {
    entity.Transform = { position: [...position] };
    return;
  }

  const transform = entity.Transform;
  if (!transform.position) {
    transform.position = [...position];
  } else {
    transform.position[0] = position[0];
    transform.position[1] = position[1];
    transform.position[2] = position[2];
  }
}

function updateRenderable(entity: Entity, settlement: Settlement) {
  const baseColor = SETTLEMENT_COLORS[settlement.kind];
  entity.Renderable = {
    kind: settlement.kind,
    color: baseColor,
  };
}

export function syncEconomySites(
  world: World<Entity>,
  registry: EconomySiteRegistry,
  state: EconomyState,
) {
  const seen = new Set<string>();

  for (const settlement of allSettlements(state)) {
    const registryId = settlement.id;
    let entity = registry.get(registryId);

    if (!entity) {
      const entityId = `site-${registryId}`;
      entity = world.add({
        id: entityId,
        Transform: { position: [...settlement.position] },
        Renderable: {
          kind: settlement.kind,
          color: SETTLEMENT_COLORS[settlement.kind],
        },
      });
      registry.set(registryId, entity);
    } else {
      ensureTransform(entity, settlement.position);
      updateRenderable(entity, settlement);
    }

    seen.add(registryId);
  }

  for (const [registryId, entity] of Array.from(registry.entries())) {
    if (!seen.has(registryId)) {
      world.remove(entity);
      registry.delete(registryId);
    }
  }
}

export function useEconomySiteRenderables() {
  const world = useWorld();
  const registryRef = useRef<EconomySiteRegistry>(defaultRegistry());

  useEffect(() => {
    const registry = registryRef.current;

    const apply = (state: EconomyState) => {
      syncEconomySites(world, registry, state);
    };

    apply(useEconomyStore.getState());

    const unsubscribe = useEconomyStore.subscribe(apply);

    return () => {
      unsubscribe();
      for (const entity of registry.values()) {
        world.remove(entity);
      }
      registry.clear();
    };
  }, [world]);
}
