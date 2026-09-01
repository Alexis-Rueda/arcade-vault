'use client';

import React, { useState, useEffect } from 'react';
import VirtualGamepad from './VirtualGamepad';

interface MobileGameLayoutProps {
  children: React.ReactNode;
  gameId: string;
  footer: React.ReactNode;
}

export default function MobileGameLayout({
  children,
  gameId,
  footer,
}: MobileGameLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isTouch = navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768; // Tailwind 'md' breakpoint
      setIsMobile(isTouch && isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-start w-full h-dvh overflow-hidden bg-slate-950">
      {/* Game Canvas Area */}
      <div className="relative w-full flex-1 flex items-center justify-center p-2 min-h-0">
        {children}
      </div>

      {/* Virtual Gamepad */}
      <div className="w-full py-4 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800 shrink-0">
        <VirtualGamepad gameId={gameId} />
      </div>

      {/* Footer Actions */}
      <div className="w-full p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        {footer}
      </div>
    </div>
  );
}
