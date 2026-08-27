'use client';

import type { SkinId } from '@/lib/games/skins';
import { SKIN_SET, SKIN_LABELS } from '@/lib/games/skins';

type Props = {
  current: SkinId;
  onChange: (id: SkinId) => void;
};

export function SkinSwitcher({ current, onChange }: Props) {
  return (
    <div className="game-skins">
      {SKIN_SET.map((id) => (
        <button
          key={id}
          className={`game-skin-chip${current === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
        >
          {SKIN_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
