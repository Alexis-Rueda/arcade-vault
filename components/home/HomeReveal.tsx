"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/lib/hooks/useReveal";

export function HomeReveal({ children, delayMs = 0, className = "" }: { children: ReactNode; delayMs?: number; className?: string }) {
  const ref = useReveal(delayMs);

  return (
    <section ref={ref} className={"home-section reveal" + (className ? " " + className : "")}>
      {children}
    </section>
  );
}
