'use client';

import { useEffect, useState } from 'react';
import { seededScores } from '@/app/data/scores';
import { fetchLeaderboard } from '@/lib/supabase/scores';
import type { ScoreRow } from '@/app/data/types';

export function Leaderboard({
  gameId,
  real = false,
}: {
  gameId: string;
  real?: boolean;
}) {
  const [realScores, setRealScores] = useState<ScoreRow[] | null>(null);

  useEffect(() => {
    if (!real) return;
    let cancelled = false;
    fetchLeaderboard(gameId, 10)
      .then((rows) => {
        if (!cancelled) setRealScores(rows);
      })
      .catch(() => {
        if (!cancelled) setRealScores([]);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, real]);

  const scores = real
    ? (realScores ?? [])
    : seededScores(gameId.length * 17 + 3, 10);

  return (
    <div className="leaderboard">
      <h3>MEJORES PUNTUACIONES</h3>
      {realScores !== null && realScores.length === 0 ? (
        <div className="lb-empty">SIN PUNTUACIONES TODAVÍA</div>
      ) : (
        scores.map((r, i) => (
          <div
            key={r.name + i}
            className={
              'lb-row' +
              (i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : '')
            }
          >
            <div className="rk">#{String(r.rank).padStart(2, '0')}</div>
            <div className="pl">
              {r.name}
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--ink-faint)',
                  letterSpacing: '0.1em',
                }}
              >
                {r.date}
              </div>
            </div>
            <div className="sc">{r.score.toLocaleString('es-ES')}</div>
          </div>
        ))
      )}
    </div>
  );
}
