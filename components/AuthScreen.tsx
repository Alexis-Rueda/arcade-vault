'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client-browser';

type Tab = 'in' | 'up';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export function AuthScreen() {
  const [tab, setTab] = useState<Tab>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });
  }, [supabase, router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push('/');
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPasswordError(null);

    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError(
        'Mínimo 8 caracteres, 1 minúscula, 1 mayúscula, 1 número y 1 símbolo',
      );
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim().toUpperCase().slice(0, 10) },
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setInfo('Revisa tu correo para confirmar tu cuenta');
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      resetEmail,
      { redirectTo: `${window.location.origin}/auth/reset-password` },
    );

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setResetSent(true);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        {!showReset ? (
          <>
            <div className="auth-tabs">
              <button
                className={tab === 'in' ? 'on' : ''}
                onClick={() => {
                  setTab('in');
                  setError(null);
                  setInfo(null);
                }}
              >
                INICIAR SESIÓN
              </button>
              <button
                className={tab === 'up' ? 'on' : ''}
                onClick={() => {
                  setTab('up');
                  setError(null);
                  setInfo(null);
                }}
              >
                CREAR CUENTA
              </button>
            </div>

            {error && (
              <div
                className="auth-error"
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

            {info && (
              <div
                className="auth-info"
                style={{
                  color: '#6bff9f',
                  fontSize: 11,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                {info}
              </div>
            )}

            <form onSubmit={tab === 'in' ? handleLogin : handleRegister}>
              {tab === 'up' && (
                <div className="field slide-in">
                  <label>Nombre de usuario</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="PX_KAI"
                    maxLength={10}
                  />
                </div>
              )}
              <div className="field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jugador@vault.gg"
                  required
                />
              </div>
              <div className="field">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="••••••••"
                  required
                />
                {passwordError && (
                  <div
                    style={{
                      color: '#ff6b6b',
                      fontSize: 10,
                      marginTop: 4,
                    }}
                  >
                    {passwordError}
                  </div>
                )}
              </div>

              <button
                className="btn lg"
                type="submit"
                style={{ width: '100%', marginTop: 8 }}
                disabled={loading}
              >
                {loading
                  ? 'ESPERA...'
                  : tab === 'in'
                    ? 'ENTRAR AL VAULT'
                    : 'CREAR Y JUGAR'}
              </button>
            </form>

            {tab === 'in' && (
              <button
                className="btn ghost"
                style={{ width: '100%', marginTop: 8, fontSize: 10 }}
                onClick={() => {
                  setShowReset(true);
                  setError(null);
                  setResetSent(false);
                  setResetEmail(email);
                }}
              >
                ¿OLVIDASTE TU CONTRASEÑA?
              </button>
            )}

            <div className="auth-divider">O CONTINÚA CON</div>
            <div className="social">
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleOAuth('google')}
              >
                ◆ GOOGLE
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleOAuth('github')}
              >
                ▣ GITHUB
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                textAlign: 'center',
                fontSize: 11,
                color: 'var(--ink-faint)',
                letterSpacing: '0.1em',
              }}
            >
              AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
            </div>
          </>
        ) : (
          <>
            <div className="auth-tabs">
              <button className="on">RECUPERAR CONTRASEÑA</button>
            </div>

            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{ color: '#6bff9f', fontSize: 12, marginBottom: 12 }}
                >
                  Te hemos enviado un enlace de recuperación
                </div>
                <button
                  className="btn ghost"
                  onClick={() => {
                    setShowReset(false);
                    setResetSent(false);
                  }}
                >
                  VOLVER AL LOGIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                {error && (
                  <div
                    className="auth-error"
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
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="jugador@vault.gg"
                    required
                  />
                </div>
                <button
                  className="btn lg"
                  type="submit"
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={loading}
                >
                  {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
                </button>
                <button
                  className="btn ghost"
                  style={{ width: '100%', marginTop: 8, fontSize: 10 }}
                  type="button"
                  onClick={() => {
                    setShowReset(false);
                    setError(null);
                  }}
                >
                  VOLVER
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
