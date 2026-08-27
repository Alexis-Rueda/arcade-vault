'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SkinId } from '@/lib/games/skins';
import { SKIN_SET } from '@/lib/games/skins';

const STORAGE_KEY = 'av-skin';
const DEFAULT_SKIN: SkinId = 'clasico';

function loadSkin(): SkinId {
  if (typeof window === 'undefined') return DEFAULT_SKIN;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && SKIN_SET.includes(raw as SkinId)) return raw as SkinId;
  } catch {
    /* noop */
  }
  return DEFAULT_SKIN;
}

function saveSkin(id: SkinId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* noop */
  }
}

/**
 * Global skin state — persisted in localStorage.
 * Every game wrapper subscribes to this; changing the skin updates all consumers.
 */
export function useSkin() {
  const [skin, setSkinRaw] = useState<SkinId>(loadSkin);
  const ref = useRef<SkinId>(skin);

  useEffect(() => {
    ref.current = skin;
  }, [skin]);

  const setSkin = useCallback((id: SkinId) => {
    setSkinRaw(id);
    ref.current = id;
    saveSkin(id);
  }, []);

  return { skin, setSkin, ref };
}
