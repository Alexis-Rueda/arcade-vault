"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClientOnly } from "./ClientOnly";
import { useUser } from "@/lib/hooks/useUser";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUser();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const isActive = (name: string) =>
    pathname === `/${name}` ||
    (name === "biblioteca" && (pathname.startsWith("/detalle/") || pathname.startsWith("/player/")));

  const authBtn = user ? (
    <button className="btn ghost auth-btn" onClick={() => setUser(null)}>{user.name} ▾</button>
  ) : (
    <button className="btn auth-btn" onClick={() => router.push("/auth")}>Iniciar Sesión</button>
  );

  return (
    <>
      <nav className="av-nav">
        <Link href="/biblioteca" className="logo" onClick={close}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">ARCADE <span className="neon-magenta">VAULT</span></div>
        </Link>

        <div className="links">
          <Link href="/biblioteca" className={isActive("biblioteca") ? "active" : ""}>Biblioteca</Link>
          <Link href="/salon" className={isActive("salon") ? "active" : ""}>Salón de la Fama</Link>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        <ClientOnly fallback={<button className="btn auth-btn">Iniciar Sesión</button>}>
          {authBtn}
        </ClientOnly>

        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">≡</button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close} />
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        <Link href="/biblioteca" className={isActive("biblioteca") ? "active" : ""} onClick={close}>Biblioteca</Link>
        <Link href="/salon" className={isActive("salon") ? "active" : ""} onClick={close}>Salón de la Fama</Link>
        {user ? (
          <a className={pathname === "/auth" ? "active" : ""} onClick={() => { setUser(null); close(); }}>Cerrar Sesión</a>
        ) : (
          <Link href="/auth" className={pathname === "/auth" ? "active" : ""} onClick={close}>Iniciar Sesión</Link>
        )}
        <div style={{ flex: 1 }} />
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>CRÉDITOS · 03</div>
      </aside>
    </>
  );
}
