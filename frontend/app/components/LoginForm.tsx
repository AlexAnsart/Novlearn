'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message || 'Erreur de connexion');
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    await signInWithGoogle();
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Connexion
          </h2>
          <p
            className="text-blue-200 mt-2 drop-shadow-md"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            Connectez-vous à votre compte NovLearn
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-6"
        >
          {/* Adresse mail */}
          <div>
            <label
              className="flex items-center gap-2 text-blue-200 mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              <Mail className="w-5 h-5" />
              Adresse mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900/60 text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              placeholder="votre.email@exemple.fr"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label
              className="flex items-center gap-2 text-blue-200 mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              <Lock className="w-5 h-5" />
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900/60 text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              placeholder="••••••••"
            />
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 rounded-xl p-3">
              <AlertCircle className="w-5 h-5" />
              <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 rounded-3xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_8px_0_0_rgb(29,78,216),0_13px_20px_rgba(37,99,235,0.3)] transform transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-[0_4px_0_0_rgb(29,78,216),0_6px_15px_rgba(37,99,235,0.3)] active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.125rem" }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center">
          <div className="flex-1 border-t border-slate-700"></div>
          <span className="px-4 text-blue-200" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
            ou
          </span>
          <div className="flex-1 border-t border-slate-700"></div>
        </div>

        {/* Bouton Google */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full px-8 py-4 rounded-3xl bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-3"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.125rem' }}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuer avec Google
        </button>

        {/* Lien inscription */}
        <div className="text-center">
          <p className="text-blue-200" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
            Pas encore de compte ?{' '}
            <a
              href="/auth/signup"
              className="text-blue-400 hover:text-blue-300 underline"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              S'inscrire
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

