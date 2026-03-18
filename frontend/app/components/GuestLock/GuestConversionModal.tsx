"use client";
import { AlertCircle, Calendar, Lock, Mail, User, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useGuestMode } from "@/app/hooks/useGuestMode";

interface GuestConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  canClose?: boolean;
}

const FEATURES = [
  { icon: "⚔️", label: "Duels 1V1 en temps réel contre tes amis" },
  { icon: "📊", label: "Suivi de progression par chapitre" },
  { icon: "🏆", label: "Classement hebdomadaire et mensuel" },
  { icon: "🎯", label: "Recommandations adaptées à ton niveau" },
];

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function Field({
  label, icon, type = "text", value, onChange, placeholder, required, min, max, minLength,
}: {
  label: string; icon: React.ReactNode; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
  min?: string; max?: string; minLength?: number;
}) {
  return (
    <div>
      <label className="block text-blue-200 mb-1 text-sm" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">{icon}</span>
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} required={required} min={min} max={max} minLength={minLength}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-900/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        />
      </div>
    </div>
  );
}

export function GuestConversionModal({ isOpen, onClose, canClose = true }: GuestConversionModalProps) {
  const { signIn, signInWithGoogle, refreshProfile } = useAuth();
  const { upgradeAccount } = useGuestMode();

  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Signup fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  if (!isOpen) return null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 15) {
      setError("Tu dois avoir au moins 15 ans pour créer un compte.");
      return;
    }

    setLoading(true);
    try {
      await upgradeAccount(signupEmail, signupPassword, firstName, lastName, birthDate);
      await refreshProfile();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        setError(error.message || "Email ou mot de passe incorrect.");
        setLoading(false);
      }
      // Si succès : onAuthStateChange redirige automatiquement
    } catch {
      setError("Une erreur est survenue. Réessaie dans un instant.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    await signInWithGoogle();
  };

  const tabClass = (t: "signup" | "login") =>
    `flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
      tab === t ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={canClose ? onClose : undefined} />

      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {canClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all z-10">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="text-3xl mb-1">{canClose ? "🚀" : "🎯"}</div>
            <h2 className="text-2xl text-white" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
              {canClose ? "Tu as du potentiel !" : "Tu as atteint ta limite !"}
            </h2>
            <p className="text-slate-300 text-sm" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
              {canClose ? "Rejoins NovLearn pour débloquer tout le contenu" : "Crée ton compte pour continuer sans limite"}
            </p>
          </div>

          {/* Features */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2">
                <span className="text-base">{f.icon}</span>
                <span className="text-slate-300 text-xs" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
                  {f.label}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-700" />

          {/* Tabs */}
          <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <button onClick={() => { setTab("signup"); setError(null); }} className={tabClass("signup")}
              style={{ fontFamily: "'Fredoka', sans-serif" }}>
              Créer un compte
            </button>
            <button onClick={() => { setTab("login"); setError(null); }} className={tabClass("login")}
              style={{ fontFamily: "'Fredoka', sans-serif" }}>
              Se connecter
            </button>
          </div>

          {/* Google button (both tabs) */}
          <button
            onClick={handleGoogle}
            className="w-full px-6 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-slate-700" />
            <span className="text-slate-500 text-xs" style={{ fontFamily: "'Fredoka', sans-serif" }}>ou</span>
            <div className="flex-1 border-t border-slate-700" />
          </div>

          {/* Signup form */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Field label="Prénom" icon={<User className="w-4 h-4" />} value={firstName} onChange={setFirstName} placeholder="Prénom" required />
                <Field label="Nom" icon={<User className="w-4 h-4" />} value={lastName} onChange={setLastName} placeholder="Nom" required />
              </div>
              <Field
                label="Date de naissance" icon={<Calendar className="w-4 h-4" />} type="date"
                value={birthDate} onChange={setBirthDate} required
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 15)).toISOString().split("T")[0]}
              />
              <p className="text-xs text-blue-300 -mt-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                Tu dois avoir au moins 15 ans
              </p>
              <Field label="Email" icon={<Mail className="w-4 h-4" />} type="email" value={signupEmail} onChange={setSignupEmail} placeholder="ton@email.com" required />
              <Field label="Mot de passe" icon={<Lock className="w-4 h-4" />} type="password" value={signupPassword} onChange={setSignupPassword} placeholder="••••••••" required minLength={6} />
              <Field label="Confirmer le mot de passe" icon={<Lock className="w-4 h-4" />} type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" required minLength={6} />

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-900/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_6px_0_0_rgb(29,78,216)] active:shadow-[0_3px_0_0_rgb(29,78,216)] active:translate-y-1 hover:shadow-[0_8px_0_0_rgb(29,78,216)] transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
              >
                {loading ? "Création en cours…" : "Créer mon compte gratuit"}
              </button>
            </form>
          )}

          {/* Login form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <Field label="Email" icon={<Mail className="w-4 h-4" />} type="email" value={loginEmail} onChange={setLoginEmail} placeholder="ton@email.com" required />
              <Field label="Mot de passe" icon={<Lock className="w-4 h-4" />} type="password" value={loginPassword} onChange={setLoginPassword} placeholder="••••••••" required />

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-900/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_6px_0_0_rgb(29,78,216)] active:shadow-[0_3px_0_0_rgb(29,78,216)] active:translate-y-1 hover:shadow-[0_8px_0_0_rgb(29,78,216)] transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
              >
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
