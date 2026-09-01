'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CrtFrame } from './CrtFrame';
import { useUser } from '@/lib/hooks/useUser';
import { useScores } from '@/lib/hooks/useScores';
import { insertScore } from '@/lib/supabase/scores';
import { getRealGame } from '@/lib/games/registry';
import { SkinSwitcher } from './games/SkinSwitcher';
import MobileGameLayout from './games/MobileGameLayout';
import { useSkinWith } from '@/lib/hooks/useSkin';
import { SKINS_BY_GAME, GLOBAL_SKIN_CONFIG } from '@/lib/games/skins';
import type { Game } from '@/app/data/types';
import type { GameHandle } from '@/lib/games/types';

export function PlayerScreen({ game }: { game: Game }) {
  const { user } = useUser();
  const { addScore } = useScores();
  const router = useRouter();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ? user.name : 'INVITADO');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [engineLevel, setEngineLevel] = useState(1);
  const gameRef = useRef<GameHandle | null>(null);
  const skinConfig = game.skins ? SKINS_BY_GAME[game.id] : null;
  const { skin, setSkin } = useSkinWith(skinConfig ?? GLOBAL_SKIN_CONFIG);

  const realGame = useMemo(() => getRealGame(game.id), [game.id]);

  const derivedLevel = useMemo(() => Math.floor(score / 2500) + 1, [score]);
  const level = realGame ? engineLevel : derivedLevel;

  useEffect(() => {
    if (realGame && typeof window !== 'undefined') {
      const checkMobile = () => {
        const isTouch = navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth < 768;
        if (isTouch && isSmallScreen) {
          document.body.classList.add('game-active-mobile');
        } else {
          document.body.classList.remove('game-active-mobile');
        }
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => {
        window.removeEventListener('resize', checkMobile);
        document.body.classList.remove('game-active-mobile');
      };
    }

    return () => {
      document.body.classList.remove('game-active-mobile');
    };
  }, [realGame]);

  const endGame = () => setOver(true);
  const restart = () => {
    setScore(0);
    setLives(3);
    setEngineLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setSaving(false);
    setSaveError(false);
    gameRef.current?.reset();
  };

  const handleSave = async () => {
    if (saving || saved) return;
    if (realGame) {
      setSaving(true);
      setSaveError(false);
      try {
        await insertScore({ gameId: game.id, playerName: name, score });
        setSaved(true);
      } catch {
        setSaveError(true);
      } finally {
        setSaving(false);
      }
      return;
    }
    addScore({ game: game.id, score, name });
    setSaved(true);
  };

  return (
    <div
      className={`av-player fade-in ${realGame ? 'game-active-mobile' : ''}`}
    >
      <div className={`player-hud ${realGame ? 'hidden-mobile' : ''}`}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: 'var(--ink)' }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString('es-ES')}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{'♥ '.repeat(lives).trim() || '—'}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, '0')}</div>
          </div>
          {game.skins && skinConfig && (
            <div className="hud-stat skin">
              <div className="l">Skin</div>
              <div className="v">
                <SkinSwitcher
                  current={skin}
                  onChange={setSkin}
                  options={skinConfig.options}
                />
              </div>
            </div>
          )}
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? 'REANUDAR' : 'PAUSA'}
          </button>
          <button
            className="btn magenta"
            onClick={() => {
              if (realGame) {
                return gameRef.current?.end() ?? endGame();
              }
              return endGame();
            }}
          >
            FIN
          </button>
          <button
            className="btn ghost"
            onClick={() => router.push(`/games/${game.id}`)}
          >
            SALIR
          </button>
        </div>
      </div>

      {/* Layout wrap for mobile touch controls */}
      <MobileGameLayout
        gameId={game.id}
        footer={
          <div className="hud-actions flex flex-col gap-4">
            <div className="flex gap-3 justify-center items-center">
              <button
                className="btn yellow"
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? 'REANUDAR' : 'PAUSA'}
              </button>
              {game.skins && skinConfig && (
                <div className="v">
                  <SkinSwitcher
                    current={skin}
                    onChange={setSkin}
                    options={skinConfig.options}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center items-center">
              <button
                className="btn magenta"
                onClick={() => {
                  if (realGame) {
                    return gameRef.current?.end() ?? endGame();
                  }
                  return endGame();
                }}
              >
                FIN
              </button>
              <button
                className="btn ghost"
                onClick={() => router.push(`/games/${game.id}`)}
              >
                SALIR
              </button>
            </div>
          </div>
        }
      >
        <CrtFrame title={game.title}>
          {realGame ? (
            <realGame.Component
              paused={paused}
              onScore={setScore}
              onLives={setLives}
              onLevel={setEngineLevel}
              onOver={(final) => {
                setScore(final);
                setOver(true);
              }}
              handleRef={gameRef}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor" />
              <div className="enemy e1" />
              <div className="enemy e2" />
              <div className="enemy e3" />
              <div className="player-ship" />
            </div>
          )}
          {paused && (
            <div
              className="crt-content"
              style={{ background: 'rgba(0,0,0,0.6)', zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-dim)',
                    marginTop: 10,
                    letterSpacing: '0.16em',
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </CrtFrame>
      </MobileGameLayout>

      {over && (
        <div className="modal-bd" onClick={() => {}}>
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString('es-ES')}</div>
            {!saved ? (
              <>
                <div className="input-row flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value.toUpperCase().slice(0, 10))
                    }
                    placeholder="TUS INICIALES"
                    className="w-full sm:w-auto"
                  />
                  <button
                    className="btn yellow w-full sm:w-auto"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'GUARDANDO…' : 'GUARDAR PUNTUACIÓN'}
                  </button>
                </div>
                {saveError && (
                  <div className="toast-error">
                    ▸ ERROR AL GUARDAR — INTÉNTALO DE NUEVO_
                  </div>
                )}
              </>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <button
                className="btn"
                onClick={() => router.push(`/games/${game.id}`)}
              >
                VER PUNTUACIONES
              </button>
              <button
                className="btn magenta"
                onClick={() => router.push('/games')}
              >
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
