"""
Service de notifications : Web Push (PWA) + Email (SMTP) + Rappel quotidien (APScheduler)

Générer les clés VAPID une seule fois :
    python -c "
from py_vapid import Vapid
v = Vapid()
v.generate_keys()
print('VAPID_PRIVATE_KEY=' + v.private_pem().decode().replace('\\n', '\\\\n'))
print('VAPID_PUBLIC_KEY=' + v.public_key)
"
Puis renseigner VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_MAILTO dans backend/.env
"""

import json
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from pywebpush import WebPushException, webpush

logger = logging.getLogger(__name__)


# ============================================
# WEB PUSH
# ============================================

def send_push_notification(subscription: dict, title: str, body: str, url: str = "/") -> None:
    """Envoie une notification push à une souscription Web Push donnée."""
    vapid_private_key = os.getenv("VAPID_PRIVATE_KEY", "")
    vapid_mailto = os.getenv("VAPID_MAILTO", "mailto:admin@novlearn.fr")

    if not vapid_private_key:
        logger.warning("[Push] VAPID_PRIVATE_KEY non configurée — notification ignorée")
        return

    webpush(
        subscription_info=subscription,
        data=json.dumps({"title": title, "body": body, "url": url}),
        vapid_private_key=vapid_private_key,
        vapid_claims={"sub": vapid_mailto},
    )


def send_push_to_user(supabase, user_id: str, title: str, body: str, url: str = "/") -> None:
    """
    Récupère toutes les souscriptions d'un utilisateur et envoie la notification.
    Supprime automatiquement les souscriptions expirées (HTTP 410).
    Vérifie que l'utilisateur a notif_pwa=true avant d'envoyer.
    """
    try:
        # Vérifier que l'utilisateur veut bien les notifications PWA
        pref = (
            supabase.table("profiles")
            .select("notif_pwa")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        if not pref.data or not pref.data.get("notif_pwa"):
            return

        subs = (
            supabase.table("push_subscriptions")
            .select("id, endpoint, p256dh, auth")
            .eq("user_id", user_id)
            .execute()
        )

        for sub in subs.data or []:
            subscription = {
                "endpoint": sub["endpoint"],
                "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
            }
            try:
                send_push_notification(subscription, title, body, url)
            except WebPushException as exc:
                # Souscription expirée ou invalide — on la supprime
                if exc.response is not None and exc.response.status_code in (404, 410):
                    supabase.table("push_subscriptions").delete().eq("id", sub["id"]).execute()
                    logger.info("[Push] Souscription expirée supprimée id=%s", sub["id"])
                else:
                    logger.error("[Push] Erreur push sub_id=%s: %s", sub["id"], exc)

    except Exception as exc:
        logger.error("[Push] send_push_to_user error user=%s: %s", user_id, exc)


# ============================================
# EMAIL (SMTP)
# ============================================

def send_email(to_email: str, subject: str, html_body: str) -> None:
    """Envoie un email via SMTP (configuration dans les variables d'environnement)."""
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    if not smtp_host or not smtp_user:
        logger.warning("[Email] SMTP non configuré — email ignoré pour %s", to_email)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_from
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, to_email, msg.as_string())
        logger.info("[Email] Envoyé à %s sujet='%s'", to_email, subject)
    except Exception as exc:
        logger.error("[Email] Erreur envoi à %s: %s", to_email, exc)


# ============================================
# TEMPLATES EMAIL
# ============================================

def email_duel_challenge(challenger_name: str) -> tuple[str, str]:
    """Retourne (subject, html) pour une notification de défi reçu."""
    subject = f"{challenger_name} t'a lancé un défi sur Novlearn !"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:#6366f1">⚔️ Nouveau défi reçu !</h2>
      <p><strong>{challenger_name}</strong> t'a lancé un défi sur Novlearn.</p>
      <p>Connecte-toi pour accepter ou refuser le duel.</p>
      <a href="https://novlearn.fr/duel"
         style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">
        Voir le défi
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px">
        Tu reçois cet email car tu as activé les notifications par email sur Novlearn.<br>
        <a href="https://novlearn.fr/parametres">Gérer mes préférences</a>
      </p>
    </div>
    """
    return subject, html


def email_daily_reminder(first_name: str, streak: int) -> tuple[str, str]:
    """Retourne (subject, html) pour un rappel quotidien."""
    subject = "Ta série Novlearn t'attend !"
    streak_text = f"🔥 Série actuelle : {streak} jour{'s' if streak > 1 else ''}" if streak > 0 else ""
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:#6366f1">📚 Entraîne-toi aujourd'hui !</h2>
      <p>Bonjour {first_name},</p>
      <p>N'oublie pas ton entraînement quotidien sur Novlearn pour progresser vers le Bac !</p>
      {f'<p style="font-size:18px">{streak_text}</p>' if streak_text else ""}
      <a href="https://novlearn.fr/entrainement"
         style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">
        S'entraîner maintenant
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px">
        Tu reçois cet email car tu as activé les notifications par email sur Novlearn.<br>
        <a href="https://novlearn.fr/parametres">Gérer mes préférences</a>
      </p>
    </div>
    """
    return subject, html


# ============================================
# RAPPEL QUOTIDIEN (APScheduler)
# ============================================

def setup_scheduler(supabase_factory) -> None:
    """
    Configure et démarre le scheduler APScheduler.
    Appeler depuis le lifespan de FastAPI en passant une factory qui retourne un client Supabase.
    """
    try:
        from apscheduler.schedulers.background import BackgroundScheduler

        scheduler = BackgroundScheduler()

        def daily_reminder_job() -> None:
            """Envoie un rappel push + email à 8h à tous les utilisateurs qui l'ont activé."""
            logger.info("[Scheduler] Démarrage du rappel quotidien")
            try:
                supabase = supabase_factory()

                # Récupérer les utilisateurs ayant activé au moins une notification
                result = (
                    supabase.table("profiles")
                    .select("id, email, first_name, current_streak, notif_pwa, notif_email")
                    .or_("notif_pwa.eq.true,notif_email.eq.true")
                    .execute()
                )

                count_push = 0
                count_email = 0
                for profile in result.data or []:
                    user_id = profile["id"]
                    first_name = profile.get("first_name") or "toi"
                    streak = profile.get("current_streak") or 0

                    if profile.get("notif_pwa"):
                        send_push_to_user(
                            supabase,
                            user_id,
                            "Entraîne-toi aujourd'hui ! 📚",
                            f"Ta série de {streak} jour{'s' if streak > 1 else ''} t'attend." if streak > 0 else "Un peu de maths pour commencer la journée ?",
                            "/entrainement",
                        )
                        count_push += 1

                    if profile.get("notif_email") and profile.get("email"):
                        subject, html = email_daily_reminder(first_name, streak)
                        send_email(profile["email"], subject, html)
                        count_email += 1

                logger.info(
                    "[Scheduler] Rappels envoyés : %d push, %d emails",
                    count_push,
                    count_email,
                )
            except Exception as exc:
                logger.error("[Scheduler] Erreur rappel quotidien: %s", exc)

        scheduler.add_job(daily_reminder_job, "cron", hour=17, minute=0)
        scheduler.start()
        logger.info("[Scheduler] Démarré — rappel quotidien à 17:00")
        return scheduler

    except ImportError:
        logger.warning("[Scheduler] APScheduler non installé — rappels désactivés")
        return None
