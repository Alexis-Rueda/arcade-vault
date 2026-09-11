'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client-browser';

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(pw)) return 'Al menos 1 mayúscula';
  if (!/[0-9]/.test(pw)) return 'Al menos 1 número';
  return null;
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const type = params.get('type');

    if (accessToken && type === 'recovery') {
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: params.get('refresh_token') ?? '',
        })
        .then(() => setReady(true));
    } else {
      setError('Enlace de recuperación no válido');
    }
  }, [supabase]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              letterSpacing: '0.16em',
              marginTop: 6,
            }}
          >
            RESTABLECER CONTRASEÑA
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ color: '#6bff9f', fontSize: 12, marginBottom: 12 }}>
              Contraseña actualizada
            </div>
            <Link
              href="/auth"
              className="btn lg"
              style={{ display: 'inline-block' }}
            >
              INICIAR SESIÓN
            </Link>
          </div>
        ) : !ready && !error ? (
          <div
            style={{
              textAlign: 'center',
              padding: '20px 0',
              fontSize: 11,
              color: 'var(--ink-faint)',
            }}
          >
            Verificando enlace...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  color: '#ff6b6b',
                  fontSize: 11,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <div className="field">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="field">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              className="btn lg"
              type="submit"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading || !ready}
            >
              {loading ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Link
                href="/auth"
                style={{ fontSize: 11, color: 'var(--ink-faint)' }}
              >
                VOLVER AL LOGIN
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
