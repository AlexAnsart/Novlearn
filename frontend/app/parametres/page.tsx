"use client";

import { Layout } from "@/app/components/Layout";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/app/lib/supabase";
import {
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Monitor,
  Moon,
  Save,
  Sliders,
  Sun,
  User,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Theme = "light" | "dark" | "system";

export default function SettingsPage() {
  const { user, profile } = useAuth();

  // Gestion des onglets
  const [activeTab, setActiveTab] = useState<"account" | "preferences">(
    "account",
  );
  const [loading, setLoading] = useState(false);

  // --- ÉTAT : COMPTE ---
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
  });

  // --- ÉTAT : SÉCURITÉ ---
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // --- ÉTAT : PRÉFÉRENCES ---
  const [theme, setTheme] = useState<Theme>("dark");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Chargement Initial
  useEffect(() => {
    // Profil
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
      });
    }

    // Préférences (LocalStorage)
    const savedTheme = localStorage.getItem("novlearn-theme") as Theme;
    const savedSound = localStorage.getItem("novlearn-sound");
    const savedNotif = localStorage.getItem("novlearn-notif");

    if (savedTheme) setTheme(savedTheme);
    if (savedSound !== null) setSoundEnabled(savedSound === "true");
    if (savedNotif !== null) setNotifications(savedNotif === "true");

    setIsLoaded(true);
  }, [profile]);

  // 2. Application du Thème & Sauvegarde
  useEffect(() => {
    if (!isLoaded) return;

    // Appliquer le thème au document HTML
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Sauvegarder dans le localStorage
    localStorage.setItem("novlearn-theme", theme);
    localStorage.setItem("novlearn-sound", String(soundEnabled));
    localStorage.setItem("novlearn-notif", String(notifications));
  }, [theme, soundEnabled, notifications, isLoaded]);

  // --- LOGIQUE : MISE À JOUR PROFIL (Nom/Prénom) ---
  const handleUpdateInfo = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;
      toast.success("Informations mises à jour !");
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour du profil.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE : CHANGEMENT MOT DE PASSE (Avec vérif ancien) ---
  const handleUpdatePassword = async () => {
    if (!passwordData.newPassword || !passwordData.oldPassword) {
      toast.error("Veuillez remplir tous les champs mot de passe.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Le nouveau mot de passe est trop court (6 caractères min).");
      return;
    }

    setLoading(true);
    try {
      if (!user?.email) throw new Error("Utilisateur non identifié");

      // 1. VÉRIFICATION DE L'ANCIEN MOT DE PASSE
      // On tente une connexion avec l'ancien mot de passe
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.oldPassword,
      });

      if (signInError) {
        throw new Error("L'ancien mot de passe est incorrect.");
      }

      // 2. MISE À JOUR SI L'ANCIEN EST BON
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) throw updateError;

      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Mot de passe modifié avec succès !");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 px-4 md:px-8 pb-12 overflow-y-auto bg-slate-900">
        <div className="max-w-4xl mx-auto pt-8 space-y-8">
          <h1
            className="text-3xl font-bold text-white mb-6"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Paramètres
          </h1>

          {/* --- NAVIGATION ONGLETS --- */}
          <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl w-fit border border-slate-700 mb-6">
            <TabButton
              active={activeTab === "account"}
              onClick={() => setActiveTab("account")}
              icon={<User size={18} />}
              label="Compte & Sécurité"
            />
            <TabButton
              active={activeTab === "preferences"}
              onClick={() => setActiveTab("preferences")}
              icon={<Sliders size={18} />}
              label="Préférences App"
            />
          </div>

          {/* =======================================================
              ONGLET 1 : COMPTE & SÉCURITÉ
             ======================================================= */}
          {activeTab === "account" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Infos Personnelles */}
              <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="text-indigo-400" /> Informations
                  </h2>
                  <button
                    onClick={handleUpdateInfo}
                    disabled={loading}
                    // J'ai modifié le padding ici : p-3 (carré sur mobile) -> md:px-4 (rectangulaire sur PC)
                    className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white p-3 md:px-4 md:py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                    title="Sauvegarder les informations" // Ajout d'un titre pour l'accessibilité quand il n'y a pas de texte
                  >
                    {loading ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}

                    {/* Le texte est caché sur mobile (hidden) et visible sur PC (md:inline) */}
                    <span className="hidden md:inline">Sauvegarder Infos</span>
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Changement Mot de Passe */}
              <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Lock className="text-emerald-400" /> Changer le mot de passe
                </h2>

                <div className="space-y-4 max-w-lg">
                  {/* Ancien MDP */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Ancien mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPass ? "text" : "password"}
                        value={passwordData.oldPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            oldPassword: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                        placeholder="Requis pour changer"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Nouveau MDP */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-slate-300">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          {showNewPass ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        Confirmer
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white outline-none ${
                          passwordData.confirmPassword &&
                          passwordData.newPassword !==
                            passwordData.confirmPassword
                            ? "border-red-500 focus:ring-red-500"
                            : "border-slate-700 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleUpdatePassword}
                      disabled={loading || !passwordData.oldPassword}
                      className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                      Mettre à jour le mot de passe
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* =======================================================
              ONGLET 2 : PRÉFÉRENCES (Apparence, Sons, etc.)
             ======================================================= */}
          {activeTab === "preferences" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Section Apparence */}
              <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Monitor className="text-blue-400" /> Apparence
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ThemeCard
                    active={theme === "light"}
                    onClick={() => setTheme("light")}
                    icon={<Sun size={24} />}
                    label="Clair"
                    description="Lumineux"
                  />
                  <ThemeCard
                    active={theme === "dark"}
                    onClick={() => setTheme("dark")}
                    icon={<Moon size={24} />}
                    label="Sombre"
                    description="Recommandé"
                  />
                  <ThemeCard
                    active={theme === "system"}
                    onClick={() => setTheme("system")}
                    icon={<Monitor size={24} />}
                    label="Système"
                    description="Automatique"
                  />
                </div>
              </section>

              {/* Section Options */}
              <section className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                {/* Son */}
                <div className="p-6 flex items-center justify-between border-b border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-colors ${soundEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}
                    >
                      {soundEnabled ? (
                        <Volume2 size={24} />
                      ) : (
                        <VolumeX size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Effets sonores</h3>
                      <p className="text-slate-400 text-sm">
                        Bruitages lors des exercices
                      </p>
                    </div>
                  </div>
                  <Switch checked={soundEnabled} onChange={setSoundEnabled} />
                </div>

                {/* Notifications */}
                <div className="p-6 flex items-center justify-between border-b border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-colors ${notifications ? "bg-blue-500/20 text-blue-400" : "bg-slate-700 text-slate-400"}`}
                    >
                      {notifications ? (
                        <Bell size={24} />
                      ) : (
                        <BellOff size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Notifications</h3>
                      <p className="text-slate-400 text-sm">
                        Rappels d'entraînement
                      </p>
                    </div>
                  </div>
                  <Switch checked={notifications} onChange={setNotifications} />
                </div>

                {/* Animations */}
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-colors ${!reduceMotion ? "bg-purple-500/20 text-purple-400" : "bg-slate-700 text-slate-400"}`}
                    >
                      <Zap size={24} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">
                        Animations fluides
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Désactiver pour réduire les mouvements
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={!reduceMotion}
                    onChange={(val) => setReduceMotion(!val)}
                  />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// --- PETITS COMPOSANTS UI ---

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-indigo-500 text-white shadow-md"
          : "text-slate-400 hover:text-white hover:bg-slate-700/50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ThemeCard({ active, onClick, icon, label, description }: any) {
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl border text-left transition-all duration-200 group ${
        active
          ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500"
          : "bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
      }`}
    >
      <div
        className={`mb-3 transition-colors ${active ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"}`}
      >
        {icon}
      </div>
      <div className="font-bold text-white mb-1">{label}</div>
      <div className="text-xs text-slate-400">{description}</div>
      {active && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
      )}
    </button>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
        checked ? "bg-indigo-500" : "bg-slate-700"
      }`}
    >
      <div
        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
