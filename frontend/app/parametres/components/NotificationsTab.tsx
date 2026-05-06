"use client";

import {
  BellOff,
  BellRing,
  Loader2,
  Mail,
  Newspaper,
  Smartphone,
  Swords,
  CalendarClock
} from "lucide-react";
import { Switch } from "./SettingsUI";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array(
    [...rawData].map((char) => char.charCodeAt(0)),
  ) as Uint8Array<ArrayBuffer>;
}

interface NotificationsTabProps {
  notifPushDuels: boolean;
  setNotifPushDuels: (v: boolean) => void;
  notifPushDaily: boolean;
  setNotifPushDaily: (v: boolean) => void;
  notifEmailDuels: boolean;
  setNotifEmailDuels: (v: boolean) => void;
  notifEmailDaily: boolean;
  setNotifEmailDaily: (v: boolean) => void;
  notifNewsletter: boolean;
  setNotifNewsletter: (v: boolean) => void;
  notifPermission: NotificationPermission | "unsupported";
  setNotifPermission: (p: NotificationPermission | "unsupported") => void;
  notifLoading: boolean;
  setNotifLoading: (v: boolean) => void;
  playSlide: () => void;
}

export function NotificationsTab({
  notifPushDuels,
  setNotifPushDuels,
  notifPushDaily,
  setNotifPushDaily,
  notifEmailDuels,
  setNotifEmailDuels,
  notifEmailDaily,
  setNotifEmailDaily,
  notifNewsletter,
  setNotifNewsletter,
  notifPermission,
  setNotifPermission,
  notifLoading,
  setNotifLoading,
  playSlide,
}: NotificationsTabProps) {

  const savePrefs = async (updates: Record<string, boolean>) => {
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notif_push_duels: notifPushDuels,
          notif_push_daily: notifPushDaily,
          notif_email_duels: notifEmailDuels,
          notif_email_daily: notifEmailDaily,
          notif_newsletter: notifNewsletter,
          ...updates,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // handled by caller if needed
    }
  };

  const ensurePushSubscription = async (): Promise<boolean> => {
    if (notifPermission === "unsupported") return false;
    
    let permission = notifPermission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
      setNotifPermission(permission);
    }
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const keyRes = await fetch("/api/notifications/vapid-public-key");
      if (!keyRes.ok) throw new Error("Clé VAPID indisponible");
      const { publicKey } = await keyRes.json();

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const sub = subscription.toJSON();
      if (!sub.keys?.p256dh || !sub.keys?.auth) throw new Error();

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        }),
      });
    }
    return true;
  };

  const handleTogglePush = async (field: "notif_push_duels" | "notif_push_daily", enable: boolean) => {
    if (notifPermission === "unsupported") return;
    setNotifLoading(true);
    
    try {
      if (enable) {
        const subscribed = await ensurePushSubscription();
        if (!subscribed) return;
      }
      
      // Update local state
      if (field === "notif_push_duels") setNotifPushDuels(enable);
      if (field === "notif_push_daily") setNotifPushDaily(enable);
      
      // Save to db
      await savePrefs({ [field]: enable });

      // Clean up subscription if both are disabled
      if (!enable) {
        const willBeDuels = field === "notif_push_duels" ? enable : notifPushDuels;
        const willBeDaily = field === "notif_push_daily" ? enable : notifPushDaily;
        
        if (!willBeDuels && !willBeDaily) {
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
        }
      }
    } finally {
      setNotifLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Notifications Appareil (PWA) */}
      <section className="bg-app-surface/50 border border-app-border rounded-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-app-border/50">
          <h2 className="text-xl font-bold text-content-main flex items-center gap-2">
            <Smartphone className="text-indigo-400" /> Notifications Push
          </h2>
          <p className="text-content-muted text-sm mt-1">
            Reçois des alertes sur ton appareil, même quand l&apos;application est fermée.
          </p>
        </div>

        <div className="p-2">
          {/* Défis Push */}
          <div className="p-4 flex items-center justify-between border-b border-app-border/20 last:border-0">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl transition-colors ${notifPushDuels ? "bg-indigo-500/20 text-indigo-400" : "bg-app-surface text-content-muted"}`}>
                <Swords size={20} />
              </div>
              <div>
                <h3 className="text-content-main font-bold text-sm">Défis reçus</h3>
                <p className="text-content-muted text-xs">Quand un ami te lance un défi en 1v1</p>
              </div>
            </div>
            {notifLoading ? (
              <Loader2 className="animate-spin text-content-muted w-5 h-5" />
            ) : (
              <Switch checked={notifPushDuels} onChange={(val) => { playSlide(); handleTogglePush("notif_push_duels", val); }} />
            )}
          </div>

          {/* Rappels Push */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl transition-colors ${notifPushDaily ? "bg-indigo-500/20 text-indigo-400" : "bg-app-surface text-content-muted"}`}>
                <CalendarClock size={20} />
              </div>
              <div>
                <h3 className="text-content-main font-bold text-sm">Rappels quotidiens</h3>
                <p className="text-content-muted text-xs">Ne perds pas ta série d'entraînement (à 17h00)</p>
              </div>
            </div>
            {notifLoading ? (
              <Loader2 className="animate-spin text-content-muted w-5 h-5" />
            ) : (
              <Switch checked={notifPushDaily} onChange={(val) => { playSlide(); handleTogglePush("notif_push_daily", val); }} />
            )}
          </div>
        </div>

        {notifPermission === "denied" && (
          <div className="m-4 mt-0 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
            Les notifications sont bloquées dans ton navigateur. Autorise-les dans les réglages du site pour activer ces options.
          </div>
        )}
        {notifPermission === "unsupported" && (
          <div className="m-4 mt-0 p-3 bg-app-surface border border-app-border rounded-xl text-content-muted text-sm">
            Ton navigateur ne supporte pas les notifications push.
          </div>
        )}
      </section>

      {/* Email */}
      <section className="bg-app-surface/50 border border-app-border rounded-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-app-border/50">
          <h2 className="text-xl font-bold text-content-main flex items-center gap-2">
            <Mail className="text-emerald-400" /> Notifications par Email
          </h2>
          <p className="text-content-muted text-sm mt-1">
            Reçois des alertes et actualités directement dans ta boîte mail.
          </p>
        </div>

        <div className="p-2">
          {/* Défis Email */}
          <div className="p-4 flex items-center justify-between border-b border-app-border/20">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl transition-colors ${notifEmailDuels ? "bg-emerald-500/20 text-emerald-400" : "bg-app-surface text-content-muted"}`}>
                <Swords size={20} />
              </div>
              <div>
                <h3 className="text-content-main font-bold text-sm">Défis reçus</h3>
                <p className="text-content-muted text-xs">Alertes de défis en 1v1 par mail</p>
              </div>
            </div>
            <Switch checked={notifEmailDuels} onChange={(val) => { playSlide(); setNotifEmailDuels(val); savePrefs({ notif_email_duels: val }); }} />
          </div>

          {/* Rappels Email */}
          <div className="p-4 flex items-center justify-between border-b border-app-border/20">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl transition-colors ${notifEmailDaily ? "bg-emerald-500/20 text-emerald-400" : "bg-app-surface text-content-muted"}`}>
                <CalendarClock size={20} />
              </div>
              <div>
                <h3 className="text-content-main font-bold text-sm">Rappels quotidiens</h3>
                <p className="text-content-muted text-xs">Ton rappel de série d'entraînement par mail</p>
              </div>
            </div>
            <Switch checked={notifEmailDaily} onChange={(val) => { playSlide(); setNotifEmailDaily(val); savePrefs({ notif_email_daily: val }); }} />
          </div>

          {/* Newsletter */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl transition-colors ${notifNewsletter ? "bg-purple-500/20 text-purple-400" : "bg-app-surface text-content-muted"}`}>
                <Newspaper size={20} />
              </div>
              <div>
                <h3 className="text-content-main font-bold text-sm">Newsletter</h3>
                <p className="text-content-muted text-xs">Nouveautés, conseils et mises à jour de Novlearn</p>
              </div>
            </div>
            <Switch checked={notifNewsletter} onChange={(val) => { playSlide(); setNotifNewsletter(val); savePrefs({ notif_newsletter: val }); }} />
          </div>
        </div>
      </section>
    </div>
  );
}

