# Guide de Déploiement - Système de Duel 1v1

## Étape 1: Migration Supabase

### 1.1 Appliquer la migration

Connectez-vous à votre dashboard Supabase et exécutez la migration:

```bash
# Depuis votre machine locale
cd supabase/migrations
```

Copiez le contenu de `002_friends_and_duels_system.sql` et exécutez-le dans le SQL Editor de Supabase.

**OU** si vous avez le CLI Supabase installé:

```bash
supabase db push
```

### 1.2 Vérifications

Vérifiez que les tables suivantes ont été créées:
- `friend_codes`
- `friends`
- `friend_requests`
- `duel_attempts`

Et que la table `duels` a été étendue avec les nouvelles colonnes:
- `exercise_id`
- `player1_score`, `player2_score`
- `player1_time`, `player2_time`
- `started_at`
- `exercise_data`

### 1.3 Créer un exercice de test

Si vous n'avez pas encore d'exercices dans la table `exercises`, créez-en un:

```sql
INSERT INTO public.exercises (chapter, difficulty, content, title)
VALUES (
  'Analyse',
  'easy',
  '{
    "variables": [
      {"id": 1, "name": "a", "type": "integer", "min": 1, "max": 10, "decimals": 0, "choices": []},
      {"id": 2, "name": "b", "type": "integer", "min": 1, "max": 10, "decimals": 0, "choices": []}
    ],
    "elements": [
      {
        "id": 1,
        "type": "text",
        "content": {"text": "Résoudre : {a}x + {b} = 0"}
      },
      {
        "id": 2,
        "type": "question",
        "content": {
          "question": "Quelle est la valeur de x ?",
          "answerType": "numeric",
          "answer": "-{b}/{a}",
          "tolerance": 0.1
        }
      }
    ]
  }'::jsonb,
  'Équation simple'
);
```

## Étape 2: Configuration Backend

### 2.1 Variables d'environnement

Ajoutez les variables suivantes dans GitHub Secrets (pour le déploiement automatique):

```
SUPABASE_URL=https://votre-project-ref.supabase.co
SUPABASE_SERVICE_KEY=votre-service-role-key
```

**⚠️ IMPORTANT**: Utilisez la clé **service_role**, pas la clé **anon** !

### 2.2 Fichier .env local (backend)

Pour tester en local, créez `backend/.env`:

```env
APP_ENV=development
DEBUG=True
HOST=0.0.0.0
PORT=8010
SUPABASE_URL=https://votre-project-ref.supabase.co
SUPABASE_SERVICE_KEY=votre-service-role-key
```

### 2.3 Installer les dépendances

```bash
cd backend
pip install -r requirements.txt
```

### 2.4 Lancer le backend

```bash
python main.py
```

Le backend devrait être accessible sur `http://localhost:8010`

Test: `curl http://localhost:8010/health`

## Étape 3: Configuration Frontend

### 3.1 Variables d'environnement

Créez `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8010
```

Pour la production, `NEXT_PUBLIC_API_URL` devrait être vide (les requêtes passeront par Apache).

### 3.2 Installer les dépendances

```bash
cd frontend
npm install
```

### 3.3 Lancer le frontend

```bash
npm run dev
```

Le frontend devrait être accessible sur `http://localhost:3000`

## Étape 4: Test du Système

### 4.1 Créer 2 comptes utilisateurs

1. Allez sur `/auth/signup`
2. Créez le compte **User A**
3. Déconnectez-vous
4. Créez le compte **User B** (utilisez un autre navigateur ou mode incognito)

### 4.2 Ajouter un ami

**Sur le compte User A:**
1. Allez sur `/compte` → onglet "Mes amis"
2. Copiez votre **lien d'invitation**

**Sur le compte User B:**
1. Collez le lien dans votre navigateur (ex: `http://localhost:3000/invite/ABC12345`)
2. La demande d'ami est envoyée automatiquement

**Sur le compte User A:**
1. Retournez sur `/compte` → onglet "Mes amis"
2. Vous devriez voir une demande d'ami de User B
3. Cliquez sur **Accepter**

### 4.3 Lancer un duel

**Sur le compte User A:**
1. Allez sur `/duel`
2. Vous devriez voir User B dans votre liste d'amis
3. Cliquez sur **Envoyer une demande de duel**

**Sur le compte User B:**
1. Allez sur `/duel`
2. Vous devriez voir une demande de duel de User A
3. Cliquez sur **Accepter**

### 4.4 Jouer le duel

Vous êtes automatiquement redirigés vers `/duel/active/[id]`

- L'exercice s'affiche avec des variables générées aléatoirement
- Les 2 joueurs voient le **même exercice avec les mêmes variables**
- Le premier à répondre correctement gagne **+1 point**
- L'exercice se recharge automatiquement avec de nouvelles variables
- Les scores se mettent à jour **en temps réel** via Supabase Realtime

### 4.5 Vérifier les données

Vérifiez dans Supabase que les données sont bien enregistrées:

```sql
-- Vérifier les amis
SELECT * FROM friends;

-- Vérifier les duels
SELECT * FROM duels;

-- Vérifier les tentatives
SELECT * FROM duel_attempts;
```

## Étape 5: Déploiement en Production

### 5.1 Vérifications avant déploiement

1. ✅ Migration Supabase appliquée
2. ✅ Au moins 1 exercice dans la table `exercises`
3. ✅ Secrets GitHub configurés (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`)
4. ✅ Backend testé localement
5. ✅ Frontend testé localement

### 5.2 Push vers GitHub

```bash
git add .
git commit -m "feat: implement complete duel system with friends and realtime"
git push origin main
```

Le workflow GitHub Actions (`deploy.yml`) se déclenchera automatiquement.

### 5.3 Vérifications post-déploiement

1. **Backend**: `curl https://novlearn.fr/api/health`
2. **Frontend**: Accédez à `https://novlearn.fr`
3. **Testez le flow complet** comme décrit en Étape 4

## Étape 6: Configuration Apache (déjà fait)

Le fichier `apache/novlearn.fr-le-ssl.conf` est déjà configuré pour:
- Proxy `/api/*` → backend FastAPI (port 8010)
- Proxy `/` → frontend Next.js (port 3000)

Aucune modification nécessaire.

## Dépannage

### Problème: "Authentication failed" dans le backend

**Solution**: Vérifiez que `SUPABASE_SERVICE_KEY` est bien la clé **service_role**, pas **anon**.

### Problème: "Code d'ami invalide"

**Solution**: Vérifiez que la migration a bien créé le trigger `create_friend_code_for_new_user`. Si ce n'est pas le cas, générez manuellement un code:

```sql
INSERT INTO friend_codes (user_id, code)
VALUES ('uuid-de-l-utilisateur', 'CODE123');
```

### Problème: Les scores ne se mettent pas à jour en temps réel

**Solution**: Vérifiez que Supabase Realtime est activé pour la table `duels`:
1. Dashboard Supabase → Database → Replication
2. Activez Realtime pour la table `duels`

### Problème: "Aucun exercice disponible"

**Solution**: Créez au moins 1 exercice dans la table `exercises` (voir Étape 1.3).

## Fonctionnalités Implémentées

✅ Système d'amis avec code d'invitation  
✅ Lien partageable pour ajouter un ami  
✅ Demandes d'amis (accepter/refuser)  
✅ Création de duels (uniquement entre amis)  
✅ Acceptation/refus de duels  
✅ Page de duel actif avec exercice  
✅ Scoring en temps réel (Supabase Realtime)  
✅ Premier à répondre correctement = +1 point  
✅ Exercice se recharge automatiquement après bonne réponse  
✅ Variables d'exercice partagées entre les 2 joueurs  
✅ Backend API complet (FastAPI)  
✅ Frontend connecté aux APIs  
✅ Déploiement automatique via GitHub Actions  

## Prochaines Étapes (Améliorations futures)

- [ ] Timer pour les duels (ex: 10 minutes max)
- [ ] Écran de fin de duel avec récapitulatif
- [ ] Historique des duels
- [ ] Système de classement (leaderboard)
- [ ] Notifications push pour les demandes de duel
- [ ] Support de plusieurs types d'exercices dans un même duel
- [ ] Système de défis (séries d'exercices)
- [ ] Statistiques détaillées (temps moyen, taux de réussite, etc.)

---

**Bon duel ! ⚔️**
