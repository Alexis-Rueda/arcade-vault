import type { ReactNode } from "react";

export function CrtFrame({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="crt">
      <div className="crt-screen">
        {children}
      </div>
      <div className="crt-bottom">
        <span className="led">SEÑAL OK</span>
        <span>{title} · CRT-83 · 60 HZ</span>
        <span>CARGA · 1MB</span>
      </div>
    </div>
  );
}
