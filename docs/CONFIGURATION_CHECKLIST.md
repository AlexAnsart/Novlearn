# Checklist de Configuration - Système de Duel

## ✅ Ce qui est déjà configuré

Vous avez déjà ces secrets GitHub Actions :
- ✅ `DATABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SECRET_KEY`
- ✅ `VPS_HOST`
- ✅ `VPS_SSH_KEY`
- ✅ `VPS_USERNAME`

## ⚠️ Ce qu'il faut ajouter

### 1. Secret GitHub Actions manquant

**Ajoutez ce secret dans GitHub Actions** :

- **Nom** : `SUPABASE_SERVICE_KEY`
- **Valeur** : La clé **service_role** de Supabase (⚠️ **PAS** la clé anon !)

**Où trouver cette clé ?**
1. Dashboard Supabase → Settings → API
2. Cherchez la section **Project API keys**
3. Copiez la clé **`service_role`** (celle qui a des permissions admin)

**⚠️ IMPORTANT** : C'est une clé sensible avec des permissions élevées. Ne la partagez jamais publiquement.

---

## 📋 Checklist Complète

### Étape 1 : Migration Supabase (OBLIGATOIRE)

1. Allez sur votre dashboard Supabase
2. SQL Editor → New Query
3. Copiez/collez le contenu de `supabase/migrations/002_friends_and_duels_system.sql`
4. Exécutez la requête

**Vérification** : Vérifiez que ces tables existent :
- `friend_codes`
- `friends`
- `friend_requests`
- `duel_attempts`
- La table `duels` doit avoir les nouvelles colonnes (`exercise_id`, `player1_score`, etc.)

### Étape 2 : Activer Supabase Realtime (OBLIGATOIRE)

1. Dashboard Supabase → Database → Replication
2. Trouvez la table `duels`
3. Activez le toggle **Realtime** pour cette table

**Pourquoi ?** Pour que les scores se mettent à jour en temps réel entre les joueurs.

### Étape 3 : Ajouter le secret GitHub (OBLIGATOIRE)

1. GitHub → Votre repo → Settings → Secrets and variables → Actions
2. New repository secret
3. Nom : `SUPABASE_SERVICE_KEY`
4. Valeur : La clé service_role de Supabase
5. Add secret

### Étape 4 : Vérifier qu'il y a un exercice (OPTIONNEL si déjà fait)

Si vous avez déjà des exercices dans la table `exercises`, vous pouvez passer cette étape.

Sinon, créez-en un via le SQL Editor :

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

---

## 🚀 Déploiement

Une fois les 3 étapes obligatoires faites :

```bash
git add .
git commit -m "feat: add Supabase service key to deployment"
git push origin main
```

Le workflow GitHub Actions se déclenchera automatiquement et déploiera tout.

---

## ✅ Vérification Post-Déploiement

1. **Backend** : `curl https://novlearn.fr/api/health` → doit retourner `{"status": "healthy"}`
2. **Frontend** : Accédez à `https://novlearn.fr` → doit s'afficher
3. **Test du système** :
   - Créez 2 comptes
   - Ajoutez un ami via le lien d'invitation
   - Lancez un duel
   - Jouez !

---

## 📝 Résumé

**Si vous avez déjà un exercice**, vous devez faire **3 choses** :

1. ✅ **Migration Supabase** (exécuter le SQL)
2. ✅ **Activer Realtime** sur la table `duels`
3. ✅ **Ajouter le secret** `SUPABASE_SERVICE_KEY` dans GitHub

C'est tout ! Le reste est automatique via le workflow de déploiement.

---

## 🐛 Si ça ne marche pas

### Backend ne démarre pas

**Erreur** : `supabase_url` ou `supabase_service_key` manquant

**Solution** : Vérifiez que le secret `SUPABASE_SERVICE_KEY` est bien ajouté dans GitHub Actions

### Les scores ne se mettent pas à jour en temps réel

**Solution** : Vérifiez que Realtime est activé sur la table `duels` (Database → Replication)

### "Aucun exercice disponible"

**Solution** : Créez un exercice (voir Étape 4)

---

**C'est tout ! Bon duel ! ⚔️**
