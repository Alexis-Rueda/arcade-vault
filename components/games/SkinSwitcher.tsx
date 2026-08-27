'use client';

import { GLOBAL_SKIN_CONFIG, type SkinOption } from '@/lib/games/skins';

type Props = {
  current: string;
  onChange: (id: string) => void;
  options?: SkinOption[];
};

export function SkinSwitcher({
  current,
  onChange,
  options = GLOBAL_SKIN_CONFIG.options,
}: Props) {
  return (
    <select
      className="skin-select"
      value={current}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Seleccionar skin"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
