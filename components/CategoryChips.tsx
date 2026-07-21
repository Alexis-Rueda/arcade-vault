"use client";

import type { GameCategory } from "@/app/data/types";

export function CategoryChips({
  cats, active, onChange,
}: {
  cats: ReadonlyArray<"TODOS" | GameCategory>;
  active: string;
  onChange: (c: "TODOS" | GameCategory) => void;
}) {
  return (
    <div className="av-chips">
      {cats.map((c) => (
        <button key={c} className={"chip" + (active === c ? " active" : "")} onClick={() => onChange(c)}>
          {c}
        </button>
      ))}
    </div>
  );
}
