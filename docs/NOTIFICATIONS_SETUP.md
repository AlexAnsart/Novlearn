# Système de Notifications — Guide de mise en place

## Ce qui a été implémenté

### Base de données ✅ (migration appliquée)
- **3 colonnes** ajoutées à `profiles` : `notif_pwa` (bool), `notif_email` (bool), `notif_newsletter` (bool)
- **Table `push_subscriptions`** : stocke les souscriptions Web Push par utilisateur (endpoint, clés p256dh/auth)

### Backend (Python/FastAPI)
- **`backend/notifications.py`** (nouveau) — service centralisé :
  - `send_push_to_user()` : envoie une notification push à toutes les souscriptions d'un utilisateur
  - `send_email()` : envoi via SMTP classique
  - Templates email (défi reçu, rappel quotidien)
  - `setup_scheduler()` : rappel quotidien automatique à 8h via APScheduler
- **`backend/main.py`** — nouvelles routes :
  - `GET  /api/notifications/vapid-public-key`
  - `GET  /api/notifications/preferences`
  - `PUT  /api/notifications/preferences`
  - `POST /api/notifications/subscribe`
  - `DELETE /api/notifications/subscribe`
  - Notification push + email automatique lors d'un `POST /api/duels/create`

### Frontend (Next.js)
- **`frontend/app/sw.ts`** — service worker mis à jour avec les handlers push et notificationclick
- **`frontend/app/parametres/page.tsx`** — nouvel onglet **Notifications** avec :
  - Toggle notifications push PWA (avec flow de permission navigateur)
  - Toggle notifications par email
  - Toggle newsletter
- **`frontend/app/contexts/AuthContext.tsx`** — interface `Profile` mise à jour avec les 3 champs notif

---

## Ce que tu dois faire (dans l'ordre)

### 1. Installer les dépendances Python

Active ton venv puis installe :

```bash
cd backend
.venv\Scripts\activate        # Windows
pip install pywebpush APScheduler
```

---

### 2. Générer les clés VAPID

Les clés VAPID servent à authentifier le serveur auprès des navigateurs pour les notifications push.
À faire **une seule fois** :

```bash
cd backend
.venv\Scripts\activate
python -c "
import os
from py_vapid import Vapid
from py_vapid.utils import b64urlencode

v = Vapid()
v.generate_keys()

public_numbers = v.public_key.public_numbers()
x = public_numbers.x.to_bytes(32, 'big')
y = public_numbers.y.to_bytes(32, 'big')
pub_bytes = b'\x04' + x + y
pub_key_str = b64urlencode(pub_bytes)

print('VAPID_PUBLIC_KEY=' + pub_key_str)
print('VAPID_PRIVATE_KEY=' + v.private_pem().decode().replace('\n', '\\n'))
"
```

Copie les deux valeurs affichées.

---

### 3. Configurer les variables d'environnement

Ouvre `backend/.env` et ajoute à la fin :

```env
# Clés VAPID (notifications push PWA)
VAPID_PUBLIC_KEY=<colle la clé publique ici>
VAPID_PRIVATE_KEY=<colle la clé privée ici>
VAPID_MAILTO=mailto:admin@novlearn.fr

# SMTP (notifications email)
SMTP_HOST=smtp.tondomaine.fr       # ex: ssl0.ovh.net ou smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@novlearn.fr
SMTP_PASSWORD=<mot_de_passe>
SMTP_FROM=Novlearn <noreply@novlearn.fr>
```

> **Gmail** : utilise un "mot de passe d'application" (compte Google → Sécurité → Mots de passe des applications).
> **OVH** : host = `ssl0.ovh.net`, port = `587`.

---

### 4. Vérifier le fonctionnement

#### Backend
Démarre le backend et teste ces endpoints :

```bash
# Vérifier que la clé VAPID est exposée
curl http://localhost:8010/api/notifications/vapid-public-key

# Vérifier les préférences d'un utilisateur (remplace <token> par un JWT valide)
curl -H "Authorization: Bearer <token>" http://localhost:8010/api/notifications/preferences
```

#### Frontend PWA
1. Lance `npm run dev` dans `frontend/`
2. Va dans **Paramètres → Notifications**
3. Active "Notifications push" → le navigateur doit demander la permission
4. Accepte → une souscription doit apparaître dans la table `push_subscriptions` (vérifiable dans Supabase Studio)

#### Tester une notification push manuellement
Dans Chrome DevTools → Application → Service Workers → clique **Push** (avec un payload JSON) :
```json
{"title": "Test Novlearn", "body": "Ça fonctionne !", "url": "/entrainement"}
```

---

### 5. Résultat attendu

| Fonctionnalité | Comportement |
|---|---|
| Toggle PWA ON | Demande permission navigateur → souscription en base |
| Toggle PWA OFF | Désabonnement navigateur + suppression en base |
| Toggle Email ON/OFF | Préférence sauvegardée en base |
| Toggle Newsletter ON/OFF | Préférence sauvegardée en base |
| Créer un duel | Push + email automatique à l'adversaire (si activés) |
| Rappel quotidien 8h | Push + email à tous les users qui l'ont activé |
| Notification cliquée | Ouvre la bonne page de l'app |

---

### 6. Notes de déploiement

- Les clés VAPID doivent être les **mêmes** entre les redémarrages du serveur (sinon les souscriptions existantes deviennent invalides).
- Le scheduler APScheduler tourne **dans le process FastAPI** — si le backend redémarre à 8h, le rappel du jour sera manqué. Pour un environnement de production robuste, envisage un cron système à la place.
- Le service worker push ne fonctionne **qu'en HTTPS** (ou localhost). En production, l'HTTPS est déjà géré par Apache.
