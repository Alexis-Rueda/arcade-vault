'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { SkinId } from '@/lib/games/skins';
import { GLOBAL_SKIN_CONFIG, type SkinConfig } from '@/lib/games/skins';

const DEFAULT_SKIN: SkinId = 'clasico';

type Store = {
  skin: string;
  listeners: Set<() => void>;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => string;
  set: (id: string) => void;
};

const stores = new Map<string, Store>();

function getStore(key: string): Store {
  let store = stores.get(key);
  if (store) return store;

  const listeners = new Set<() => void>();
  let value =
    typeof window === 'undefined'
      ? DEFAULT_SKIN
      : readStorage(key, DEFAULT_SKIN);

  store = {
    skin: value,
    listeners,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => value,
    set(id) {
      value = id;
      try {
        localStorage.setItem(key, id);
      } catch {
        /* noop */
      }
      listeners.forEach((l) => l());
    },
  };
  stores.set(key, store);
  return store;
}

function readStorage(key: string, fallback: string): string {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return raw;
  } catch {
    /* noop */
  }
  return fallback;
}

function useSkinStore(config: SkinConfig) {
  const store = getStore(config.storageKey);
  const skin = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => config.defaultSkin,
  );
  const ref = useRef(skin);

  useEffect(() => {
    ref.current = skin;
  }, [skin]);

  const setSkin = useCallback(
    (id: string) => {
      store.set(id);
      ref.current = id;
    },
    [store],
  );

  return { skin, setSkin, ref };
}

/**
 * Global skin state — persisted in localStorage and shared across
 * every useSkin instance via a module-level store.
 */
export function useSkin() {
  return useSkinStore(GLOBAL_SKIN_CONFIG) as {
    skin: SkinId;
    setSkin: (id: SkinId) => void;
    ref: { current: SkinId };
  };
}

/** Skin state for a custom skin set (e.g. Tetris with its own palettes). */
export function useSkinWith(config: SkinConfig) {
  return useSkinStore(config);
}
