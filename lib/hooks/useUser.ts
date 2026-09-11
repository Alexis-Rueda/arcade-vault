'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client-browser';
import type { User, Session } from '@supabase/supabase-js';

interface UserContextValue {
  user: User | null;
  session: Session | null;
  username: string | null;
  avatarUrl: string | null;
  signOut: () => Promise<void>;
}

const supabase = createClient();

export function useUser(): UserContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const username = (() => {
    if (!user) return null;
    const m = user.user_metadata ?? {};
    // Registro con email+password: username en user_metadata
    if (m.username) return m.username as string;
    // OAuth providers: full_name, name, o preferred_username
    if (m.full_name) return (m.full_name as string).split(' ')[0].toUpperCase();
    if (m.name) return (m.name as string).split(' ')[0].toUpperCase();
    if (m.preferred_username)
      return (m.preferred_username as string).toUpperCase();
    // Fallback: email sin dominio
    if (user.email) return user.email.split('@')[0].toUpperCase();
    return null;
  })();

  const avatarUrl = (() => {
    if (!user) return null;
    const m = user.user_metadata ?? {};
    return (m.avatar_url as string) ?? (m.picture as string) ?? null;
  })();

  return { user, session, username, avatarUrl, signOut };
}
