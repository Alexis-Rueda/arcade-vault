'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  TOUCH_CONTROLS,
  type GamepadAction,
} from '@/lib/games/controls-mapping';
import './virtual-gamepad.css';

interface VirtualGamepadProps {
  gameId: string;
}

type ActiveState = Record<GamepadAction, boolean>;

const INITIAL_ACTIVE: ActiveState = {
  UP: false,
  DOWN: false,
  LEFT: false,
  RIGHT: false,
  BTN_A: false,
  BTN_B: false,
};

const DESKTOP_KEYS: Record<string, GamepadAction> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  s: 'DOWN',
  a: 'LEFT',
  d: 'RIGHT',
  z: 'BTN_A',
  j: 'BTN_A',
  x: 'BTN_B',
  k: 'BTN_B',
};

export default function VirtualGamepad({ gameId }: VirtualGamepadProps) {
  const mapping = TOUCH_CONTROLS[gameId];
  const [active, setActive] = useState<ActiveState>(INITIAL_ACTIVE);

  const setPressed = useCallback(
    (action: GamepadAction, pressed: boolean) => {
      if (!mapping) return;

      // Emite evento de teclado sintético para el engine del juego
      const key = mapping[action];
      const event = new KeyboardEvent(pressed ? 'keydown' : 'keyup', {
        key,
        code: `Key${key.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      setActive((prev) => ({ ...prev, [action]: pressed }));
    },
    [mapping],
  );

  // Activa la clase .on cuando se pulsa la tecla física correspondiente
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const action = DESKTOP_KEYS[e.key];
      if (!action || e.repeat) return;
      setActive((prev) => ({ ...prev, [action]: true }));
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const action = DESKTOP_KEYS[e.key];
      if (!action) return;
      setActive((prev) => ({ ...prev, [action]: false }));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  if (!mapping) return null;

  const DP_POSITION: Partial<Record<GamepadAction, string>> = {
    UP: 'dp-up',
    DOWN: 'dp-down',
    LEFT: 'dp-left',
    RIGHT: 'dp-right',
  };

  const AB_COLOR: Partial<Record<GamepadAction, string>> = {
    BTN_A: 'a',
    BTN_B: 'b',
  };

  const dpClass = (action: GamepadAction) =>
    ['dp', DP_POSITION[action], active[action] && 'on']
      .filter(Boolean)
      .join(' ');

  const abClass = (action: GamepadAction) =>
    ['ab', AB_COLOR[action], active[action] && 'on'].filter(Boolean).join(' ');

  const dpButtonProps = (action: GamepadAction) => ({
    className: dpClass(action),
    onPointerDown: () => setPressed(action, true),
    onPointerUp: () => setPressed(action, false),
    onPointerLeave: () => setPressed(action, false),
    onPointerCancel: () => setPressed(action, false),
  });

  const abButtonProps = (action: GamepadAction) => ({
    className: abClass(action),
    onPointerDown: () => setPressed(action, true),
    onPointerUp: () => setPressed(action, false),
    onPointerLeave: () => setPressed(action, false),
    onPointerCancel: () => setPressed(action, false),
  });

  return (
    <div className="gp" role="group" aria-label="Gamepad">
      <div className="gp-body">
        {/* D-Pad */}
        <div className="gp-col gp-col-left">
          <div className="gp-dpad" aria-label="D-pad">
            <button {...dpButtonProps('UP')} aria-label="up" type="button">
              <svg className="dp-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4 L20 16 L4 16 Z" fill="currentColor" />
              </svg>
            </button>
            <button
              {...dpButtonProps('RIGHT')}
              aria-label="right"
              type="button"
            >
              <svg className="dp-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 4 L20 12 L8 20 Z" fill="currentColor" />
              </svg>
            </button>
            <button {...dpButtonProps('DOWN')} aria-label="down" type="button">
              <svg className="dp-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 8 L20 8 L12 20 Z" fill="currentColor" />
              </svg>
            </button>
            <button {...dpButtonProps('LEFT')} aria-label="left" type="button">
              <svg className="dp-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 4 L16 20 L4 12 Z" fill="currentColor" />
              </svg>
            </button>
            <div className="dp-hub" aria-hidden="true">
              <span className="dp-hub-gem" />
            </div>
          </div>
        </div>
        {/* Botones de acción */}
        <div className="gp-col gp-col-right">
          <div className="gp-actions">
            <button {...abButtonProps('BTN_B')} aria-label="B" type="button">
              <span className="ab-ring" />
              <span className="ab-letter">B</span>
            </button>
            <button {...abButtonProps('BTN_A')} aria-label="A" type="button">
              <span className="ab-ring" />
              <span className="ab-letter">A</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
