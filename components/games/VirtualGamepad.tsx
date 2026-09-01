'use client';

import React, { useCallback } from 'react';
import {
  TOUCH_CONTROLS,
  type GamepadAction,
} from '@/lib/games/controls-mapping';

interface VirtualGamepadProps {
  gameId: string;
  onAction?: (action: GamepadAction, key: string) => void;
}

export default function VirtualGamepad({
  gameId,
  onAction,
}: VirtualGamepadProps) {
  const mapping = TOUCH_CONTROLS[gameId];

  if (!mapping) return null;

  const handlePress = useCallback(
    (action: GamepadAction) => {
      const key = mapping[action];

      // Dispatch synthetic keyboard event
      const event = new KeyboardEvent('keydown', {
        key: key,
        code: `Key${key.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      // Also trigger callback if provided
      if (onAction) onAction(action, key);

      console.log(`Gamepad: ${action} -> ${key}`);
    },
    [mapping, onAction],
  );

  const handleRelease = useCallback(
    (action: GamepadAction) => {
      const key = mapping[action];
      const event = new KeyboardEvent('keyup', {
        key: key,
        code: `Key${key.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
    },
    [mapping],
  );

  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto p-4 gap-8 select-none touch-none">
      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-2">
        <div />
        <button
          onKeyDown={(e) => e.preventDefault()}
          onTouchStart={() => handlePress('UP')}
          onTouchEnd={() => handleRelease('UP')}
          className="w-12 h-12 bg-slate-800 border-2 border-cyan-500 rounded-lg active:bg-cyan-600 active:scale-95 transition-all flex items-center justify-center"
        >
          <span className="text-cyan-400 text-xl">▲</span>
        </button>
        <div />
        <button
          onTouchStart={() => handlePress('LEFT')}
          onTouchEnd={() => handleRelease('LEFT')}
          className="w-12 h-12 bg-slate-800 border-2 border-cyan-500 rounded-lg active:bg-cyan-600 active:scale-95 transition-all flex items-center justify-center"
        >
          <span className="text-cyan-400 text-xl">◀</span>
        </button>
        <div className="w-12 h-12 bg-slate-900 border-2 border-slate-700 rounded-lg flex items-center justify-center">
          <span className="text-slate-600 text-xs">•</span>
        </div>
        <button
          onTouchStart={() => handlePress('RIGHT')}
          onTouchEnd={() => handleRelease('RIGHT')}
          className="w-12 h-12 bg-slate-800 border-2 border-cyan-500 rounded-lg active:bg-cyan-600 active:scale-95 transition-all flex items-center justify-center"
        >
          <span className="text-cyan-400 text-xl">▶</span>
        </button>
        <div />
        <button
          onTouchStart={() => handlePress('DOWN')}
          onTouchEnd={() => handleRelease('DOWN')}
          className="w-12 h-12 bg-slate-800 border-2 border-cyan-500 rounded-lg active:bg-cyan-600 active:scale-95 transition-all flex items-center justify-center"
        >
          <span className="text-cyan-400 text-xl">▼</span>
        </button>
        <div />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onTouchStart={() => handlePress('BTN_A')}
          onTouchEnd={() => handleRelease('BTN_A')}
          className="w-16 h-16 bg-slate-800 border-4 border-pink-500 rounded-full active:bg-pink-600 active:scale-90 transition-all text-pink-400 font-bold text-xl shadow-[0_0_10px_rgba(236,72,153,0.5)]"
        >
          A
        </button>
        <button
          onTouchStart={() => handlePress('BTN_B')}
          onTouchEnd={() => handleRelease('BTN_B')}
          className="w-16 h-16 bg-slate-800 border-4 border-pink-500 rounded-full active:bg-pink-600 active:scale-90 transition-all text-pink-400 font-bold text-xl shadow-[0_0_10px_rgba(236,72,153,0.5)]"
        >
          B
        </button>
      </div>
    </div>
  );
}
