'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GAMES } from '@/app/data/games';
import { seededScores } from '@/app/data/scores';
import { fetchLeaderboard, fetchPlayerBest } from '@/lib/supabase/scores';
import { isRealGame } from '@/lib/games/registry';
import { Podium } from './Podium';
import { useUser } from '@/lib/hooks/useUser';
import type { ScoreRow } from '@/app/data/types';

export function HallOfFameScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState(GAMES[0].id);

  const isReal = isRealGame(tab);
  const [realRows, setRealRows] = useState<ScoreRow[] | null>(null);
  const [youBest, setYouBest] = useState<{
    score: number;
    date: string;
  } | null>(null);

  useEffect(() => {
    if (!isReal) return;
    let cancelled = false;
    fetchLeaderboard(tab, 12)
      .then((rows) => {
        if (!cancelled) setRealRows(rows);
      })
      .catch(() => {
        if (!cancelled) setRealRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, isReal]);

  useEffect(() => {
    if (!isReal || !user) {
      setYouBest(null);
      return;
    }
    let cancelled = false;
    fetchPlayerBest(tab, user.name)
      .then((best) => {
        if (!cancelled) setYouBest(best);
      })
      .catch(() => {
        if (!cancelled) setYouBest(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, isReal, user]);

  const rows = useMemo(
    () => (isReal ? (realRows ?? []) : seededScores(tab.length * 23 + 7, 12)),
    [tab, isReal, realRows],
  );
  const game = GAMES.find((g) => g.id === tab);

  const youRank = isReal
    ? (realRows?.findIndex((r) => r.name === user?.name) ?? -1) + 1 ||
      (realRows?.length ?? 0) + 1
    : Math.floor(8 + (tab.length % 4));
  const youScore = isReal
    ? (youBest?.score ?? 0)
    : user
      ? rows[5]?.score - 2400
      : null;
  const showEmpty = isReal && realRows !== null && realRows.length === 0;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={'chip' + (tab === g.id ? ' active' : '')}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      <Podium rows={rows} />

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {showEmpty ? (
          <div className="hall-empty">SIN PUNTUACIONES TODAVÍA</div>
        ) : (
          rows.map((r, i) => (
            <div
              key={r.name + i}
              className={
                'tr' +
                (i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : '')
              }
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="rk">#{String(r.rank).padStart(2, '0')}</div>
              <div className="pl">{r.name}</div>
              <div className="sc">{r.score.toLocaleString('es-ES')}</div>
              <div className="dt">{r.date}</div>
            </div>
          ))
        )}
        {user && game && (
          <>
            <div className="tr you-label">▸ TU MEJOR MARCA EN {game.title}</div>
            <div
              className="tr you"
              style={{ animationDelay: `${rows.length * 50 + 50}ms` }}
            >
              <div className="rk" style={{ color: 'var(--yellow)' }}>
                #{String(youRank).padStart(2, '0')}
              </div>
              <div className="pl" style={{ color: 'var(--yellow)' }}>
                {user.name}
              </div>
              <div
                className="sc"
                style={{
                  color: 'var(--yellow)',
                  textShadow: '0 0 6px rgba(245,255,0,0.5)',
                }}
              >
                {(youScore ?? 9999).toLocaleString('es-ES')}
              </div>
              <div className="dt">
                {isReal ? (youBest?.date ?? '—') : '11/05/2026'}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button className="btn lg" onClick={() => router.push('/games')}>
          VOLVER A LA BIBLIOTECA
        </button>
      </div>
    </div>
  );
}
