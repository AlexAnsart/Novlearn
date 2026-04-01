"use client";

import { useAuth } from "@/app/contexts/AuthContext"; // Vérifiez votre chemin d'import
import { useGuestMode } from "@/app/hooks/useGuestMode";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();
  const { startGuestSession } = useGuestMode();
  const router = useRouter();

  const handleGuestAccess = async () => {
    setGuestLoading(true);
    setError("");
    try {
      await startGuestSession();
      router.push("/");
    } catch {
      setError("Impossible de démarrer la session invité. Réessaie.");
      setGuestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message || "Erreur de connexion");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    await signInWithGoogle();
  };

  return (
    <div className="max-w-md w-full space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2
          className="text-4xl md:text-5xl tracking-tight text-white drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
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

      {/* Carte du formulaire */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Champ Email */}
          <div>
            <label
              className="block text-blue-200 mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-900/40 backdrop-blur-sm rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="votre@email.com"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              />
            </div>
          </div>

          {/* Champ Mot de passe */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                className="block text-blue-200"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
              >
                Mot de passe
              </label>

              {/* --- LIEN MOT DE PASSE OUBLIÉ --- */}
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-900/40 backdrop-blur-sm rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              />
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              >
                {error}
              </span>
            </div>
          )}

          {/* Bouton Connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 rounded-3xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_8px_0_0_rgb(29,78,216),0_13px_20px_rgba(37,99,235,0.3)] active:shadow-[0_4px_0_0_rgb(29,78,216),0_6px_15px_rgba(37,99,235,0.3)] active:translate-y-1 hover:shadow-[0_10px_0_0_rgb(29,78,216),0_15px_25px_rgba(37,99,235,0.4)] transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 600,
              fontSize: "1.125rem",
            }}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Se connecter"}
          </button>
        </form>

        {/* Séparateur */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-slate-700"></div>
          <span
            className="px-4 text-blue-200"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            ou
          </span>
          <div className="flex-1 border-t border-slate-700"></div>
        </div>

        {/* Bouton Google */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full px-8 py-4 rounded-3xl bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-3"
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 600,
            fontSize: "1.125rem",
          }}
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

        {/* Lien Inscription */}
        <div className="mt-6 text-center">
          <p
            className="text-blue-200"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Pas encore de compte ?{" "}
            <Link
              href="/auth/signup"
              className="text-blue-400 hover:text-blue-300 underline"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              S'inscrire
            </Link>
          </p>
        </div>

        {/* Accès invité */}
        <div className="mt-4 text-center">
          <button
            onClick={handleGuestAccess}
            disabled={guestLoading}
            className="text-slate-400 hover:text-slate-200 text-sm transition-colors disabled:opacity-50"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            {guestLoading ? (
              <span className="flex items-center gap-1 justify-center">
                <Loader2 className="w-3 h-3 animate-spin" /> Démarrage…
              </span>
            ) : (
              "Essayer sans créer de compte →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
