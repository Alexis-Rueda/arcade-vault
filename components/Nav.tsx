'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClientOnly } from './ClientOnly';
import { useUser } from '@/lib/hooks/useUser';

export function Nav() {
  const pathname = usePathname();
  const { user, username, avatarUrl, signOut } = useUser();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const isActive = (name: string) =>
    (name === 'home' && pathname === '/') ||
    (name !== 'home' && pathname === `/${name}`) ||
    (name === 'games' &&
      (pathname.startsWith('/games/') || pathname.startsWith('/player/'))) ||
    (name === 'about' && pathname === '/about');

  const initial = username?.[0] ?? '?';

  const authBtn = user ? (
    <div
      className="auth-btn"
      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username ?? ''}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--neon-cyan)',
          }}
        />
      ) : (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--neon-magenta)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            textShadow: '0 0 6px rgba(255,0,110,0.6)',
          }}
        >
          {initial}
        </div>
      )}
      <span style={{ fontSize: 11, letterSpacing: '0.08em' }}>{username}</span>
      <button className="btn ghost" onClick={signOut} style={{ fontSize: 10 }}>
        Cerrar sesión
      </button>
    </div>
  ) : (
    <Link href="/auth" className="btn auth-btn">
      ACCESO
    </Link>
  );

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>

        <div className="links">
          <Link href="/" className={isActive('home') ? 'active' : ''}>
            Inicio
          </Link>
          <Link href="/games" className={isActive('games') ? 'active' : ''}>
            Juegos
          </Link>
          <Link href="/salon" className={isActive('salon') ? 'active' : ''}>
            Salón de la Fama
          </Link>
          <Link href="/about" className={isActive('about') ? 'active' : ''}>
            Acerca de
          </Link>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        <ClientOnly
          fallback={
            <Link href="/auth" className="btn auth-btn">
              ACCESO
            </Link>
          }
        >
          {authBtn}
        </ClientOnly>

        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={'av-mobile-backdrop' + (open ? ' open' : '')}
        onClick={close}
      />
      <aside className={'av-mobile-panel' + (open ? ' open' : '')}>
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <Link
          href="/"
          className={isActive('home') ? 'active' : ''}
          onClick={close}
        >
          Inicio
        </Link>
        <Link
          href="/games"
          className={isActive('games') ? 'active' : ''}
          onClick={close}
        >
          Juegos
        </Link>
        <Link
          href="/salon"
          className={isActive('salon') ? 'active' : ''}
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link
          href="/about"
          className={isActive('about') ? 'active' : ''}
          onClick={close}
        >
          Acerca de
        </Link>
        {user ? (
          <a
            className={pathname === '/auth' ? 'active' : ''}
            onClick={() => {
              signOut();
              close();
            }}
          >
            Cerrar Sesión
          </a>
        ) : (
          <Link
            href="/auth"
            className={pathname === '/auth' ? 'active' : ''}
            onClick={close}
          >
            ACCESO
          </Link>
        )}
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: 'var(--ink-faint)',
            letterSpacing: '0.16em',
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
