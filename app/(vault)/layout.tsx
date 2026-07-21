import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default function VaultLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main className="av-main">{children}</main>
      <Footer />
    </>
  );
}
