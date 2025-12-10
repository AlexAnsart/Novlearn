# Guide : Faire fonctionner l'authentification Supabase en local

## 🔍 Problème actuel

L'authentification Supabase fonctionne en production mais pas en local. C'est normal car il manque la configuration des variables d'environnement et les URLs de redirection pour le développement local.

## ✅ Solution : 3 étapes simples

### Étape 1 : Créer le fichier `.env.local`

1. **Aller dans le dossier `frontend/`** :
   ```bash
   cd frontend
   ```

2. **Créer un fichier `.env.local`** (copier depuis `.env.example` si disponible) :
   ```bash
   # Sur Windows (PowerShell)
   Copy-Item .env.example .env.local
   
   # Sur Linux/Mac
   cp .env.example .env.local
   ```

3. **Remplir les valeurs** dans `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
   ```

   **Où trouver ces valeurs ?**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet
   - Aller dans **Settings** > **API**
   - Copier :
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** (clé qui commence par `eyJ...`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Étape 2 : Configurer les URLs de redirection dans Supabase

1. **Aller dans Supabase Dashboard** > Votre projet
2. Aller dans **Authentication** > **URL Configuration**
3. Configurer :
   - **Site URL** : `http://localhost:3000`
   - **Redirect URLs** : Ajouter `http://localhost:3000/*`
4. Cliquer **Save**

### Étape 3 : Lancer l'application en local

```bash
cd frontend
npm install  # Si ce n'est pas déjà fait
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

## 🔧 Configuration supplémentaire pour Google OAuth (si utilisé)

Si vous utilisez la connexion Google, il faut aussi configurer localhost dans Google Cloud Console :

1. **Aller dans Google Cloud Console** : https://console.cloud.google.com
2. Sélectionner votre projet OAuth
3. Aller dans **APIs & Services** > **Credentials**
4. Cliquer sur votre **OAuth Client ID**
5. Dans **Authorized JavaScript origins**, ajouter :
   - `http://localhost:3000`
6. Dans **Authorized redirect URIs**, ajouter :
   - `http://localhost:3000/auth/callback`
7. Cliquer **Save**

## 🧪 Tester l'authentification

1. **Démarrer le serveur** :
   ```bash
   cd frontend
   npm run dev
   ```

2. **Aller sur** : http://localhost:3000/auth/signup

3. **Créer un compte de test** :
   - Remplir le formulaire
   - Date de naissance >= 15 ans
   - Cocher le consentement RGPD
   - Cliquer "S'inscrire"

4. **Vérifier l'email de confirmation** (vérifier aussi les spams)

5. **Confirmer l'email** en cliquant sur le lien

6. **Se connecter** sur http://localhost:3000/auth/login

7. **Vérifier** que vous êtes bien connecté et redirigé

## ⚠️ Points importants

### Variables d'environnement

- **Fichier** : `frontend/.env.local` (NE PAS commiter dans Git)
- **Format** : Les variables doivent commencer par `NEXT_PUBLIC_` pour être accessibles côté client
- **Redémarrage** : Après avoir créé/modifié `.env.local`, **redémarrer le serveur** (`npm run dev`)

### URLs de redirection

- **Site URL** : URL de base de votre application
- **Redirect URLs** : URLs autorisées pour les redirections après authentification
- **Format** : Utiliser `/*` à la fin pour autoriser toutes les routes (ex: `http://localhost:3000/*`)

### Différence production vs local

| Configuration | Production | Local |
|--------------|------------|-------|
| Site URL | `https://novlearn.fr` | `http://localhost:3000` |
| Redirect URLs | `https://novlearn.fr/*` | `http://localhost:3000/*` |
| Variables d'env | GitHub Secrets | `.env.local` |

## 🐛 Dépannage

### Erreur "Supabase URL or Anon Key is missing"

**Solution** :
1. Vérifier que `.env.local` existe dans `frontend/`
2. Vérifier que les variables commencent par `NEXT_PUBLIC_`
3. Redémarrer le serveur (`Ctrl+C` puis `npm run dev`)

### Erreur "Invalid redirect URL"

**Solution** :
1. Vérifier que `http://localhost:3000/*` est bien dans les Redirect URLs de Supabase
2. Vérifier que le Site URL est `http://localhost:3000`

### Google OAuth ne fonctionne pas en local

**Solution** :
1. Vérifier que `http://localhost:3000` est dans les Authorized JavaScript origins
2. Vérifier que `http://localhost:3000/auth/callback` est dans les Authorized redirect URIs
3. Vérifier que le Client ID et Secret sont corrects dans Supabase

### L'application ne démarre pas

**Solution** :
1. Vérifier que Node.js 18+ est installé : `node --version`
2. Installer les dépendances : `npm install`
3. Vérifier qu'il n'y a pas d'erreurs dans la console

## 📝 Checklist

- [ ] Fichier `.env.local` créé dans `frontend/`
- [ ] Variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` remplies
- [ ] Site URL configuré dans Supabase : `http://localhost:3000`
- [ ] Redirect URLs configuré dans Supabase : `http://localhost:3000/*`
- [ ] Google OAuth configuré pour localhost (si utilisé)
- [ ] Serveur redémarré après modification de `.env.local`
- [ ] Test d'inscription réussi
- [ ] Test de connexion réussi

## 🎯 Résumé rapide

```bash
# 1. Créer .env.local
cd frontend
cp .env.example .env.local  # ou créer manuellement

# 2. Remplir les valeurs dans .env.local
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 3. Configurer Supabase Dashboard :
# - Authentication > URL Configuration
# - Site URL: http://localhost:3000
# - Redirect URLs: http://localhost:3000/*

# 4. Lancer l'application
npm run dev
```

Une fois ces étapes effectuées, l'authentification fonctionnera parfaitement en local ! 🎉

