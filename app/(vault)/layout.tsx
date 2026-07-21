import type { ReactNode } from "react";

export default function VaultLayout({ children }: { children: ReactNode }) {
  return <main className="av-main">{children}</main>;
}
