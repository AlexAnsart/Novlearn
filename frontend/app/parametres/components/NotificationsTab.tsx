"use client";

import {
  BellOff,
  BellRing,
  Loader2,
  Mail,
  Newspaper,
  Smartphone,
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
  notifPwa: boolean;
  setNotifPwa: (v: boolean) => void;
  notifEmail: boolean;
  setNotifEmail: (v: boolean) => void;
  notifNewsletter: boolean;
  setNotifNewsletter: (v: boolean) => void;
  notifPermission: NotificationPermission | "unsupported";
  setNotifPermission: (p: NotificationPermission | "unsupported") => void;
  notifLoading: boolean;
  setNotifLoading: (v: boolean) => void;
  playSlide: () => void;
}

export function NotificationsTab({
  notifPwa,
  setNotifPwa,
  notifEmail,
  setNotifEmail,
  notifNewsletter,
  setNotifNewsletter,
  notifPermission,
  setNotifPermission,
  notifLoading,
  setNotifLoading,
  playSlide,
}: NotificationsTabProps) {
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
      // toast handled by caller if needed
    }
  };

  const handleTogglePwa = async (enable: boolean) => {
    if (notifPermission === "unsupported") return;

    setNotifLoading(true);
    try {
      if (enable) {
        let permission = notifPermission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
          setNotifPermission(permission);
        }
        if (permission !== "granted") return;

        const keyRes = await fetch("/api/notifications/vapid-public-key");
        if (!keyRes.ok) throw new Error("Clé VAPID indisponible");
        const { publicKey } = await keyRes.json();

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
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
      } else {
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
            <Smartphone className="text-indigo-400" /> Notifications appareil
          </h2>
          <p className="text-content-muted text-sm mt-1">
            Reçois des alertes sur ton appareil, même quand l&apos;application
            est fermée.
          </p>
        </div>

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
                {notifPwa ? <BellRing size={24} /> : <BellOff size={24} />}
              </div>
              <div>
                <h3 className="text-content-main font-bold">
                  Notifications push
                </h3>
                <p className="text-content-muted text-sm">
                  Défis reçus, résultats de duels, rappels d&apos;entraînement
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

          {notifPermission === "denied" && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
              Les notifications sont bloquées dans ton navigateur.
              Autorise-les dans les réglages du site pour activer cette option.
            </div>
          )}
          {notifPermission === "unsupported" && (
            <div className="mt-4 p-3 bg-app-surface border border-app-border rounded-xl text-content-muted text-sm">
              Ton navigateur ne supporte pas les notifications push.
            </div>
          )}
        </div>
      </section>

      {/* Email */}
      <section className="bg-app-surface/50 border border-app-border rounded-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-app-border/50">
          <h2 className="text-xl font-bold text-content-main flex items-center gap-2">
            <Mail className="text-emerald-400" /> Notifications par email
          </h2>
          <p className="text-content-muted text-sm mt-1">
            Reçois des résumés et alertes directement dans ta boîte mail.
          </p>
        </div>

        {/* Emails de notifications */}
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
              <h3 className="text-content-main font-bold">Newsletter</h3>
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
  );
}
