"""
Tests unitaires pour notifications.py

Couvre :
  - send_push_notification (webpush mocké, variables d'env patchées)
  - email_duel_challenge et email_daily_reminder (pure functions)
  - send_email (smtplib mocké, variables d'env patchées)
  - send_push_to_user (DB mockée + send_push_notification mocké)
"""
import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from helpers import make_supabase

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-key")

from notifications import (
    send_push_notification,
    email_duel_challenge,
    email_daily_reminder,
    send_email,
    send_push_to_user,
)


# ── send_push_notification ────────────────────────────────────────────────────

class TestSendPushNotification:

    def test_sans_vapid_key_ignore_et_ne_leve_pas(self):
        with patch.dict(os.environ, {"VAPID_PRIVATE_KEY": ""}):
            with patch("notifications.webpush") as mock_wp:
                send_push_notification({"endpoint": "https://test.com"}, "Titre", "Corps")
                mock_wp.assert_not_called()

    def test_avec_vapid_key_appelle_webpush(self):
        sub = {"endpoint": "https://fcm.test.com", "keys": {"p256dh": "k", "auth": "a"}}
        with patch.dict(os.environ, {"VAPID_PRIVATE_KEY": "fake-private-key"}):
            with patch("notifications.webpush") as mock_wp:
                send_push_notification(sub, "Titre", "Corps", "/duel")
                mock_wp.assert_called_once()

    def test_vapid_private_key_transmis_a_webpush(self):
        sub = {"endpoint": "https://fcm.test.com"}
        with patch.dict(os.environ, {"VAPID_PRIVATE_KEY": "secret-key"}):
            with patch("notifications.webpush") as mock_wp:
                send_push_notification(sub, "T", "B")
                _, kwargs = mock_wp.call_args
                assert kwargs.get("vapid_private_key") == "secret-key"

    def test_url_par_defaut_est_slash(self):
        with patch.dict(os.environ, {"VAPID_PRIVATE_KEY": "key"}):
            with patch("notifications.webpush") as mock_wp:
                send_push_notification({}, "T", "B")
                _, kwargs = mock_wp.call_args
                import json
                data = json.loads(kwargs.get("data", "{}"))
                assert data.get("url") == "/"


# ── Templates email (pure functions) ─────────────────────────────────────────

class TestEmailDuelChallenge:

    def test_retourne_subject_et_html(self):
        subject, html = email_duel_challenge("Alice")
        assert isinstance(subject, str) and len(subject) > 0
        assert isinstance(html, str) and "<" in html

    def test_nom_du_challenger_dans_subject(self):
        subject, _ = email_duel_challenge("Bob")
        assert "Bob" in subject

    def test_nom_du_challenger_dans_html(self):
        _, html = email_duel_challenge("Charlie")
        assert "Charlie" in html

    def test_noms_differents(self):
        s1, h1 = email_duel_challenge("Alice")
        s2, h2 = email_duel_challenge("Zoe")
        assert "Alice" in s1 and "Zoe" not in s1
        assert "Zoe" in s2 and "Alice" not in s2


class TestEmailDailyReminder:

    def test_retourne_subject_et_html(self):
        subject, html = email_daily_reminder("Thomas", 5)
        assert isinstance(subject, str)
        assert isinstance(html, str) and "<" in html

    def test_prenom_dans_html(self):
        _, html = email_daily_reminder("Marie", 3)
        assert "Marie" in html

    def test_streak_dans_html(self):
        _, html = email_daily_reminder("Luc", 7)
        assert "7" in html

    def test_streak_zero(self):
        subject, html = email_daily_reminder("Paul", 0)
        assert isinstance(subject, str)
        assert "Paul" in html


# ── send_email ────────────────────────────────────────────────────────────────

class TestSendEmail:

    def test_sans_smtp_host_ne_leve_pas_et_ne_connecte_pas(self):
        with patch.dict(os.environ, {"SMTP_HOST": "", "SMTP_USER": ""}):
            with patch("notifications.smtplib") as mock_smtp:
                send_email("test@example.com", "Sujet", "<p>Corps</p>")
                mock_smtp.SMTP.assert_not_called()

    def test_avec_smtp_envoie_email(self):
        mock_server = MagicMock()
        mock_smtp_ctx = MagicMock()
        mock_smtp_ctx.__enter__ = MagicMock(return_value=mock_server)
        mock_smtp_ctx.__exit__ = MagicMock(return_value=False)

        with patch.dict(os.environ, {
            "SMTP_HOST": "smtp.test.com",
            "SMTP_USER": "user@test.com",
            "SMTP_PASSWORD": "password",
            "SMTP_FROM": "",
        }):
            with patch("notifications.smtplib.SMTP", return_value=mock_smtp_ctx):
                send_email("dest@example.com", "Sujet", "<p>Test</p>")
                mock_server.sendmail.assert_called_once()

    def test_exception_smtp_ne_leve_pas(self):
        with patch.dict(os.environ, {
            "SMTP_HOST": "smtp.test.com",
            "SMTP_USER": "user@test.com",
        }):
            with patch("notifications.smtplib.SMTP", side_effect=Exception("Connexion refusée")):
                # Ne doit pas propager l'exception
                send_email("dest@example.com", "Sujet", "<p>Test</p>")


# ── send_push_to_user ─────────────────────────────────────────────────────────

class TestSendPushToUser:

    def test_ignore_si_preference_desactivee(self):
        sb = make_supabase(
            profiles=([], {"notif_push_duels": False}),
            push_subscriptions=[],
        )
        with patch("notifications.send_push_notification") as mock_push:
            send_push_to_user(sb, "user-1", "Titre", "Corps")
            mock_push.assert_not_called()

    def test_ignore_si_pas_de_profil(self):
        sb = make_supabase(
            profiles=([], None),
            push_subscriptions=[],
        )
        with patch("notifications.send_push_notification") as mock_push:
            send_push_to_user(sb, "user-1", "Titre", "Corps")
            mock_push.assert_not_called()

    def test_envoie_notif_si_preference_activee(self):
        sb = make_supabase(
            profiles=([], {"notif_push_duels": True}),
            push_subscriptions=[
                {"id": "sub-1", "endpoint": "https://fcm.test", "p256dh": "key", "auth": "auth"}
            ],
        )
        with patch("notifications.send_push_notification") as mock_push:
            send_push_to_user(sb, "user-1", "Titre", "Corps")
            mock_push.assert_called_once()

    def test_envoie_a_plusieurs_souscriptions(self):
        sb = make_supabase(
            profiles=([], {"notif_push_duels": True}),
            push_subscriptions=[
                {"id": "sub-1", "endpoint": "https://fcm.test/1", "p256dh": "k1", "auth": "a1"},
                {"id": "sub-2", "endpoint": "https://fcm.test/2", "p256dh": "k2", "auth": "a2"},
            ],
        )
        with patch("notifications.send_push_notification") as mock_push:
            send_push_to_user(sb, "user-1", "Titre", "Corps")
            assert mock_push.call_count == 2

    def test_gere_souscription_expiree_sans_lever(self):
        from pywebpush import WebPushException

        sb = make_supabase(
            profiles=([], {"notif_push_duels": True}),
            push_subscriptions=[
                {"id": "sub-expired", "endpoint": "https://expired", "p256dh": "k", "auth": "a"}
            ],
        )
        mock_resp = MagicMock()
        mock_resp.status_code = 410
        exc = WebPushException("Gone", response=mock_resp)

        with patch("notifications.send_push_notification", side_effect=exc):
            # Ne doit pas propager l'exception
            send_push_to_user(sb, "user-1", "Titre", "Corps")

    def test_preference_field_personnalise(self):
        sb = make_supabase(
            profiles=([], {"notif_push_daily": True}),
            push_subscriptions=[
                {"id": "sub-1", "endpoint": "https://fcm.test", "p256dh": "key", "auth": "auth"}
            ],
        )
        with patch("notifications.send_push_notification") as mock_push:
            send_push_to_user(sb, "user-1", "Rappel", "Corps", preference_field="notif_push_daily")
            mock_push.assert_called_once()
