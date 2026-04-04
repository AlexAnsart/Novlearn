"use client";

import { Layout } from "@/app/components/Layout";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { supabase } from "@/app/lib/supabase";
import {
  Bell,
  BellOff,
  BellRing,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Monitor,
  Moon,
  Newspaper,
  Save,
  Sliders,
  Smartphone,
  Sun,
  User,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAudioFeedback } from "../hooks/useAudioFeedback";

export default function SettingsPage() {
  const { user, profile } = useAuth();

  // Gestion des onglets
  const [activeTab, setActiveTab] = useState<
    "account" | "preferences" | "notifications"
  >("account");
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
  const { theme, setTheme } = useTheme();
  const { playSlide } = useAudioFeedback();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- ÉTAT : NOTIFICATIONS ---
  const [notifPwa, setNotifPwa] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifNewsletter, setNotifNewsletter] = useState(false);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [notifLoading, setNotifLoading] = useState(false);

  // 1. Chargement Initial
  useEffect(() => {
    // Profil
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
      });
      setNotifPwa(profile.notif_pwa ?? false);
      setNotifEmail(profile.notif_email ?? true);
      setNotifNewsletter(profile.notif_newsletter ?? false);
    }

    // Préférences (LocalStorage) — le thème est géré par ThemeContext
    const savedSound = localStorage.getItem("novlearn-sound");
    if (savedSound !== null) setSoundEnabled(savedSound === "true");

    // État de la permission push navigateur
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission("unsupported");
    }

    setIsLoaded(true);
  }, [profile]);

  // 2. Sauvegarde de la préférence son
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("novlearn-sound", String(soundEnabled));
  }, [soundEnabled, isLoaded]);

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

  // --- LOGIQUE : NOTIFICATIONS EMAIL + NEWSLETTER ---
  const handleSaveEmailPrefs = async (
    newNotifEmail: boolean,
    newNotifNewsletter: boolean,
  ) => {
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notif_pwa: notifPwa,
          notif_email: newNotifEmail,
          notif_newsletter: newNotifNewsletter,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Erreur lors de la mise à jour des préférences.");
    }
  };

  // --- LOGIQUE : TOGGLE NOTIFICATIONS PWA ---
  const handleTogglePwa = async (enable: boolean) => {
    if (notifPermission === "unsupported") {
      toast.error("Les notifications push ne sont pas supportées sur ce navigateur.");
      return;
    }

    setNotifLoading(true);
    try {
      if (enable) {
        // 1. Demander la permission si pas encore accordée
        let permission = notifPermission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
          setNotifPermission(permission);
        }

        if (permission !== "granted") {
          toast.error(
            "Permission refusée. Autorise les notifications dans les réglages du navigateur.",
          );
          return;
        }

        // 2. Récupérer la clé VAPID publique
        const keyRes = await fetch("/api/notifications/vapid-public-key");
        if (!keyRes.ok) throw new Error("Clé VAPID indisponible");
        const { publicKey } = await keyRes.json();

        // 3. Souscrire via le service worker
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const sub = subscription.toJSON();
        if (!sub.keys?.p256dh || !sub.keys?.auth) throw new Error();

        // 4. Enregistrer la souscription côté serveur
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          }),
        });

        // 5. Mettre à jour la préférence en base
        await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notif_pwa: true,
            notif_email: notifEmail,
            notif_newsletter: notifNewsletter,
          }),
        });

        setNotifPwa(true);
        toast.success("Notifications push activées !");
      } else {
        // Désabonnement
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();
          await fetch("/api/notifications/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint }),
          });
        }

        // Mettre à jour la préférence en base
        await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notif_pwa: false,
            notif_email: notifEmail,
            notif_newsletter: notifNewsletter,
          }),
        });

        setNotifPwa(false);
        toast.success("Notifications push désactivées.");
      }
    } catch {
      toast.error("Erreur lors de la gestion des notifications push.");
    } finally {
      setNotifLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 px-4 md:px-8 pb-12 overflow-y-auto bg-app-bg">
        <div className="max-w-4xl mx-auto pt-8 space-y-8">
          <h1
            className="text-3xl font-bold text-content-main mb-6"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Paramètres
          </h1>

          {/* --- NAVIGATION ONGLETS --- */}
          <div className="flex flex-wrap gap-2 p-1 bg-app-surface/50 rounded-xl w-fit border border-app-border mb-6">
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
            <TabButton
              active={activeTab === "notifications"}
              onClick={() => setActiveTab("notifications")}
              icon={<Bell size={18} />}
              label="Notifications"
            />
          </div>

          {/* =======================================================
              ONGLET 1 : COMPTE & SÉCURITÉ
             ======================================================= */}
          {activeTab === "account" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Infos Personnelles */}
              <section className="bg-app-surface/50 border border-app-border rounded-2xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-content-main flex items-center gap-2">
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
                    <label className="text-sm font-medium text-content-muted">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-content-main focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-content-muted">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-content-main focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Changement Mot de Passe */}
              <section className="bg-app-surface/50 border border-app-border rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-content-main mb-6 flex items-center gap-2">
                  <Lock className="text-emerald-400" /> Changer le mot de passe
                </h2>

                <div className="space-y-4 max-w-lg">
                  {/* Ancien MDP */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-content-muted">
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
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-content-main focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                        placeholder="Requis pour changer"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-main"
                      >
                        {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Nouveau MDP */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-content-muted">
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
                          className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-content-main focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-main"
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
                      <label className="text-sm font-medium text-content-muted">
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
                        className={`w-full bg-app-bg border rounded-xl px-4 py-3 text-content-main outline-none ${
                          passwordData.confirmPassword &&
                          passwordData.newPassword !==
                            passwordData.confirmPassword
                            ? "border-red-500 focus:ring-red-500"
                            : "border-app-border focus:ring-emerald-500"
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
              ONGLET 3 : NOTIFICATIONS
             ======================================================= */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Section Notifications Appareil (PWA) */}
              <section className="bg-app-surface/50 border border-app-border rounded-2xl overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-app-border/50">
                  <h2 className="text-xl font-bold text-content-main flex items-center gap-2">
                    <Smartphone className="text-indigo-400" /> Notifications
                    appareil
                  </h2>
                  <p className="text-content-muted text-sm mt-1">
                    Reçois des alertes sur ton appareil, même quand
                    l&apos;application est fermée.
                  </p>
                </div>

                {/* Toggle PWA */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl transition-colors ${
                          notifPwa
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "bg-app-surface text-content-muted"
                        }`}
                      >
                        {notifPwa ? (
                          <BellRing size={24} />
                        ) : (
                          <BellOff size={24} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-content-main font-bold">
                          Notifications push
                        </h3>
                        <p className="text-content-muted text-sm">
                          Défis reçus, résultats de duels, rappels
                          d&apos;entraînement
                        </p>
                      </div>
                    </div>
                    {notifLoading ? (
                      <Loader2 className="animate-spin text-content-muted w-6 h-6" />
                    ) : (
                      <Switch
                        checked={notifPwa}
                        onChange={(val) => {
                          playSlide();
                          handleTogglePwa(val);
                        }}
                      />
                    )}
                  </div>

                  {/* Avertissement si permission refusée */}
                  {notifPermission === "denied" && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
                      Les notifications sont bloquées dans ton navigateur.
                      Autorise-les dans les réglages du site pour activer cette
                      option.
                    </div>
                  )}
                  {notifPermission === "unsupported" && (
                    <div className="mt-4 p-3 bg-app-surface border border-app-border rounded-xl text-content-muted text-sm">
                      Ton navigateur ne supporte pas les notifications push.
                    </div>
                  )}
                </div>
              </section>

              {/* Section Email */}
              <section className="bg-app-surface/50 border border-app-border rounded-2xl overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-app-border/50">
                  <h2 className="text-xl font-bold text-content-main flex items-center gap-2">
                    <Mail className="text-emerald-400" /> Notifications par
                    email
                  </h2>
                  <p className="text-content-muted text-sm mt-1">
                    Reçois des résumés et alertes directement dans ta boîte
                    mail.
                  </p>
                </div>

                {/* Notifications email */}
                <div className="p-6 flex items-center justify-between border-b border-app-border/50">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-colors ${
                        notifEmail
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-app-surface text-content-muted"
                      }`}
                    >
                      <Mail size={24} />
                    </div>
                    <div>
                      <h3 className="text-content-main font-bold">
                        Emails de notifications
                      </h3>
                      <p className="text-content-muted text-sm">
                        Défis reçus, rappels quotidiens
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifEmail}
                    onChange={(val) => {
                      playSlide();
                      setNotifEmail(val);
                      handleSaveEmailPrefs(val, notifNewsletter);
                    }}
                  />
                </div>

                {/* Newsletter */}
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-colors ${
                        notifNewsletter
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-app-surface text-content-muted"
                      }`}
                    >
                      <Newspaper size={24} />
                    </div>
                    <div>
                      <h3 className="text-content-main font-bold">
                        Newsletter
                      </h3>
                      <p className="text-content-muted text-sm">
                        Nouveautés, conseils et mises à jour de Novlearn
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifNewsletter}
                    onChange={(val) => {
                      playSlide();
                      setNotifNewsletter(val);
                      handleSaveEmailPrefs(notifEmail, val);
                    }}
                  />
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
              <section className="bg-app-surface/50 border border-app-border rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-content-main mb-6 flex items-center gap-2">
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
              <section className="bg-app-surface/50 border border-app-border rounded-2xl overflow-hidden">
                {/* Son */}
                <div className="p-6 flex items-center justify-between border-b border-app-border/50">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-colors ${soundEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-app-surface text-content-muted"}`}
                    >
                      {soundEnabled ? (
                        <Volume2 size={24} />
                      ) : (
                        <VolumeX size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-content-main font-bold">
                        Effets sonores
                      </h3>
                      <p className="text-content-muted text-sm">
                        Bruitages lors des exercices
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={soundEnabled}
                    onChange={(val) => {
                      playSlide();
                      setSoundEnabled(val);
                    }}
                  />
                </div>

                {/* Animations */}
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-colors ${!reduceMotion ? "bg-purple-500/20 text-purple-400" : "bg-app-surface text-content-muted"}`}
                    >
                      <Zap size={24} />
                    </div>
                    <div>
                      <h3 className="text-content-main font-bold">
                        Animations fluides
                      </h3>
                      <p className="text-content-muted text-sm">
                        Désactiver pour réduire les mouvements
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={!reduceMotion}
                    onChange={(val) => {
                      playSlide();
                      setReduceMotion(!val);
                    }}
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

// --- UTILITAIRE VAPID ---

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

// --- PETITS COMPOSANTS UI ---

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-indigo-500 text-white shadow-md"
          : "text-content-muted hover:text-content-main hover:bg-app-surface/50"
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
          : "bg-app-bg border-app-border hover:border-app-border/70 hover:bg-app-surface"
      }`}
    >
      <div
        className={`mb-3 transition-colors ${active ? "text-indigo-400" : "text-content-muted group-hover:text-content-main"}`}
      >
        {icon}
      </div>
      <div className="font-bold text-content-main mb-1">{label}</div>
      <div className="text-xs text-content-muted">{description}</div>
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
        checked ? "bg-indigo-500" : "bg-app-border"
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
