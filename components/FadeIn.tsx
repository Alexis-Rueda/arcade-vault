import type { ReactNode } from "react";

export function FadeIn({ children }: { children: ReactNode }) {
  return <div className="fade-in">{children}</div>;
}
