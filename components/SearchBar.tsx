"use client";

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="av-search">
      <span className="ico">⌕</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Buscar un juego por nombre…" />
    </div>
  );
}
