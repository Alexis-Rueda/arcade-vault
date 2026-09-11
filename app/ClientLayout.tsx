'use client';

import { usePathname } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith('/auth');

  return (
    <div id="root">
      {!isAuth && <Nav />}
      {children}
      {!isAuth && <Footer />}
    </div>
  );
}
