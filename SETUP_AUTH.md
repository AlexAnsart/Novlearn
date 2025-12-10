# Guide de configuration - Authentification Supabase

Ce document explique étape par étape ce que vous devez faire manuellement pour que l'authentification fonctionne.

## ✅ Ce qui a été fait automatiquement

- ✅ Migration SQL créée (`supabase/migrations/001_initial_schema.sql`)
- ✅ Client Supabase configuré (`frontend/app/lib/supabase.ts`)
- ✅ Contexte d'authentification créé (`frontend/app/contexts/AuthContext.tsx`)
- ✅ Composants de login/signup avec le design de la maquette
- ✅ Pages d'authentification (login, signup, callback, verify-email)
- ✅ AccountPage modifiée pour afficher les vraies données
- ✅ Layout modifié pour gérer l'authentification
- ✅ Workflow GitHub Actions mis à jour pour les secrets

## 📋 Ce que vous devez faire manuellement

---

## 📍 PARTIE 1 : CRÉER LE PROJET SUPABASE

### Étape 1 : Créer le compte et le projet

1. Aller sur https://supabase.com
2. Cliquer **"Sign in"** (ou créer un compte si tu n'en as pas)
3. Cliquer **"New Project"** (bouton vert)
4. Remplir :
   - **Name** : `NovLearn-prod`
   - **Database Password** : Cliquer **"Generate a password"** → **COPIER ET SAUVEGARDER CE MOT DE PASSE**
   - **Region** : ⚠️ **IMPORTANT RGPD** → Choisir **"Europe (Frankfurt)"** ou **"Europe West (London)"**
   - **Pricing Plan** : Free (gratuit)
5. Cliquer **"Create new project"**
6. Attendre ~2 minutes que le projet se crée

### Étape 2 : Récupérer les clés API

1. Dans ton projet, cliquer sur l'icône ⚙️ **"Settings"** (barre de gauche en bas)
2. Cliquer **"API"** dans le sous-menu
3. Noter/Copier (tu en auras besoin plus tard) :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** (la clé qui commence par `eyJ...`)

💡 **Qu'est-ce que le `<project-ref>` ?**

Le **project-ref** est l'identifiant unique de votre projet Supabase. Il apparaît dans votre **Project URL**.

**Exemple** : Si votre Project URL est `https://abcdefghijklmnop.supabase.co`, alors votre **project-ref** est `abcdefghijklmnop`.

Vous trouverez aussi le project-ref dans l'URL de votre dashboard Supabase : `https://supabase.com/dashboard/project/abcdefghijklmnop`

### Étape 3 : Appliquer la migration SQL

1. Dans le Dashboard Supabase, aller dans **SQL Editor** (icône dans la barre de gauche)
2. Ouvrir le fichier `supabase/migrations/001_initial_schema.sql` de ce projet
3. Copier **tout le contenu** du fichier
4. Coller dans l'éditeur SQL de Supabase
5. Cliquer sur **"Run"** (ou `Ctrl+Enter`) pour exécuter la migration
6. Vérifier qu'il n'y a pas d'erreur (message vert "Success")

💡 **Note** : La migration crée la table `profiles` avec les champs `first_name` et `last_name`. Si vous avez déjà appliqué une version précédente sans `last_name`, vous devrez ajouter la colonne manuellement :
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
```

---

## 📍 PARTIE 2 : ACTIVER L'AUTHENTIFICATION EMAIL/PASSWORD

### Étape 4 : Configurer Email Authentication

1. Cliquer sur **"Authentication"** (icône 🔐 dans barre de gauche)
2. Cliquer **"Providers"** dans le sous-menu
3. Trouver **"Email"** dans la liste
4. Activer le toggle **"Enable Email provider"** (mettre en vert)
5. Vérifier que **"Confirm email"** est activé (obligatoire RGPD)
6. Cliquer **"Save"** en bas

💡 **À propos de l'email de confirmation** :
- **Qui l'envoie ?** : **Supabase** envoie automatiquement l'email de confirmation
- **Quand ?** : Dès qu'un utilisateur s'inscrit avec email/password
- **Pourquoi ?** : Obligatoire pour la conformité RGPD (vérifier que l'email est valide)
- **Personnalisation** : Vous pouvez personnaliser le template d'email dans Supabase > **Authentication** > **Email Templates**
- **Note** : Pour Google OAuth, pas besoin de confirmation email (Google vérifie déjà l'email)

### Étape 5 : Configurer les URLs de redirection

1. Rester dans **"Authentication"** > **"Providers"**
2. Cliquer **"Configuration"** dans le sous-menu (ou **"URL Configuration"**)
3. Trouver **"Site URL"** et mettre :
   - Pour dev : `http://localhost:3000`
   - Pour prod : `https://novlearn.fr` (votre domaine final)
4. Trouver **"Redirect URLs"** et ajouter :
   - `http://localhost:3000/*` (dev)
   - `https://novlearn.fr/*` (prod)
   - `https://www.novlearn.fr/*` (prod avec www)
5. Cliquer **"Save"**

---

## 📍 PARTIE 3 : CONFIGURER GOOGLE OAUTH (optionnel mais recommandé)

### Étape 6 : Créer le projet Google Cloud

1. Aller sur https://console.cloud.google.com
2. Cliquer sur le nom du projet en haut → **"New Project"**
3. Remplir :
   - **Project name** : `NovLearn-Auth`
4. Cliquer **"Create"**
5. Attendre que le projet se crée (~30 sec)
6. Sélectionner le projet dans le dropdown en haut

### Étape 7 : Configurer OAuth Consent Screen

1. Dans Google Cloud Console, aller dans le menu ☰ (en haut à gauche)
2. Cliquer **"APIs & Services"** > **"OAuth consent screen"** (ou **"Écran de consentement OAuth"**)
3. Choisir **"External"** (pour que n'importe qui puisse s'inscrire)
4. Cliquer **"Create"** (ou **"Créer"**)

5. **Remplir la section Branding** :
   - **Page d'accueil de l'application** : `https://novlearn.fr`
   - **Lien vers les règles de confidentialité** : `https://novlearn.fr/politique-confidentialite`
   - **Lien vers les conditions d'utilisation** : `https://novlearn.fr/conditions-utilisation`
   - **Domaines autorisés** :
     - Cliquer **"+ Ajouter un domaine"**
     - Ajouter : `novlearn.fr` (sans https:// ni www)
     - ⚠️ **Ne pas mettre** le domaine Supabase ici (ex: `xxxxx.supabase.co`)
     - Le domaine Supabase sera ajouté dans l'étape suivante dans les "Authorized redirect URIs"
   - **Coordonnées du développeur** : Ton email (@ecl.fr)

6. Cliquer **"Enregistrer"** (ou **"Save"**)

💡 **Note sur les Scopes et Test Users** :
- Si vous ne voyez pas les sections "Scopes" ou "Test Users", c'est normal avec la nouvelle interface.
- Pour Supabase OAuth, les scopes par défaut sont généralement suffisants (email, profile).
- Les utilisateurs de test peuvent être ajoutés plus tard si nécessaire via **"Utilisateurs de test"** dans le menu latéral, ou lors des tests.
- Si votre application est en mode "Externe" et que vous voulez tester avant publication, vous devrez peut-être ajouter des utilisateurs de test. Cherchez **"Test users"** ou **"Utilisateurs de test"** dans le menu latéral gauche.

### Étape 8 : Créer OAuth Client ID

💡 **Note** : "OAuth Client ID" est bien un client OAuth. C'est le nom exact dans Google Cloud Console. Quand vous créez un "OAuth Client ID", vous créez automatiquement un client OAuth complet avec un ID et un Secret.

1. Rester dans **"APIs & Services"**
2. Cliquer **"Credentials"** (dans menu gauche)
3. Cliquer **"+ Create Credentials"** (en haut)
4. Choisir **"OAuth client ID"** (c'est bien un client OAuth complet)
5. **Application type** : `Web application`
6. **Name** : `NovLearn Web Client`
7. Sous **"Authorized JavaScript origins"**, cliquer **"+ Add URI"** et ajouter :
   - `http://localhost:3000`
   - `https://novlearn.fr`
8. Sous **"Authorized redirect URIs"**, cliquer **"+ Add URI"** et ajouter :

   **IMPORTANT** : Retourner dans Supabase pour copier l'URL de callback :
   
   → Dans Supabase :
   - Aller dans **"Authentication"** > **"Providers"**
   - Cliquer sur **"Google"** dans la liste
   - Copier le **"Callback URL (for OAuth)"** (ex: `https://xxxxx.supabase.co/auth/v1/callback`)
   
   → Retour dans Google Cloud Console :
   - Coller cette URL dans **"Authorized redirect URIs"**
   - Ajouter aussi (pour dev local) : `http://localhost:54321/auth/v1/callback`
   
9. Cliquer **"Create"**
10. Une popup apparaît avec **Client ID** et **Client Secret**
11. **COPIER ET SAUVEGARDER** :
    - **Client ID** (commence par `xxxx.apps.googleusercontent.com`)
    - **Client Secret**
12. Cliquer **"OK"**

### Étape 9 : Configurer Google OAuth dans Supabase

1. Retourner dans Supabase Dashboard
2. Aller dans **"Authentication"** > **"Providers"**
3. Trouver **"Google"** dans la liste
4. Activer le toggle **"Enable Sign in with Google"**

5. **Remplir les champs suivants** :
   - **Client ID** : Coller le **Client ID** copié depuis Google Cloud Console (commence par `xxxx.apps.googleusercontent.com`)
   - **Client Secret (for OAuth)** : Coller le **Client Secret** copié depuis Google Cloud Console
   - **Skip nonce checks** : 
     - ⚠️ **DÉSACTIVÉ (OFF)** en production (recommandé pour la sécurité)
     - Peut être activé temporairement en développement local si vous rencontrez des erreurs liées au nonce
   - **Allows users without email** :
     - ⚠️ **DÉSACTIVÉ (OFF)** par défaut (Supabase exige un email pour l'authentification)
     - Activez seulement si vous avez vraiment besoin d'autoriser des utilisateurs sans email (rare)

6. Cliquer **"Save"** (ou **"Enregistrer"**)

💡 **Note** : Le **Callback URL** affiché dans cette page est celui que vous devez utiliser dans Google Cloud Console (étape 8, point 8). Il ressemble à : `https://xxxxx.supabase.co/auth/v1/callback`

---

## 📍 PARTIE 4 : CONFIGURER LES VARIABLES D'ENVIRONNEMENT

### Étape 10 : Configuration locale (développement)

1. Créer un fichier `frontend/.env.local` à la racine du dossier `frontend/`
2. Ajouter le contenu suivant (remplacer avec vos vraies valeurs) :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
```

💡 **Où trouver ces valeurs ?**
- `NEXT_PUBLIC_SUPABASE_URL` : C'est votre **Project URL** (étape 2)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : C'est votre **anon public key** (étape 2)

### Étape 11 : Configuration production (GitHub Secrets)

1. Aller dans votre repository GitHub
2. Aller dans **Settings** > **Secrets and variables** > **Actions**
3. Cliquer **"New repository secret"**
4. Ajouter les secrets suivants (un par un) :
   - **Name** : `NEXT_PUBLIC_SUPABASE_URL`
     **Value** : Votre Project URL Supabase (ex: `https://xxxxx.supabase.co`)
   - **Name** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     **Value** : Votre anon/public key (commence par `eyJ...`)

✅ **Pour la production** : Les secrets GitHub Actions suffisent ! Le workflow `.github/workflows/deploy.yml` :
   - Utilise ces secrets lors du **build** du frontend (ligne 31-32)
   - Crée automatiquement le fichier `.env.local` sur le VPS avec ces valeurs (ligne 196-197)
   - **Vous n'avez rien d'autre à faire côté VPS**

⚠️ **Pour le développement local** : Vous devez **AUSSI** créer le fichier `frontend/.env.local` (étape 10) pour que ça fonctionne en local avec `npm run dev`.

---

## 📍 PARTIE 5 : TESTER L'AUTHENTIFICATION

### Étape 12 : Tester en local

1. Démarrer le serveur de développement :
```bash
cd frontend
npm run dev
```

2. Aller sur `http://localhost:3000/auth/signup`
3. Créer un compte de test :
   - Remplir le formulaire
   - Vérifier que la date de naissance est >= 15 ans
   - Cocher la case de consentement RGPD
   - Cliquer "S'inscrire"
4. Vérifier que l'email de confirmation est reçu (vérifier aussi les spams)
5. Cliquer sur le lien dans l'email pour confirmer
6. Aller sur `http://localhost:3000/auth/login`
7. Se connecter avec le compte créé
8. Vérifier que vous êtes redirigé vers la page d'accueil
9. Aller sur `/compte` et vérifier que vos informations s'affichent correctement

### Étape 13 : Tester Google OAuth (si configuré)

1. Aller sur `http://localhost:3000/auth/login`
2. Cliquer sur **"Continuer avec Google"**
3. Sélectionner votre compte Google
4. Vérifier que vous êtes redirigé vers l'application
5. Vérifier que votre profil est créé automatiquement

---

## 🔍 Checklist de vérification

- [ ] Projet Supabase créé en région Europe
- [ ] Migration SQL appliquée avec succès
- [ ] Email/Password activé dans Supabase
- [ ] URLs de redirection configurées (Site URL + Redirect URLs)
- [ ] Google OAuth configuré (si utilisé)
- [ ] Variables d'environnement configurées (`.env.local` créé)
- [ ] GitHub Secrets configurés (pour production)
- [ ] Test d'inscription réussi
- [ ] Test de connexion réussi
- [ ] Test de connexion Google réussi (si configuré)
- [ ] Page `/compte` affiche les bonnes données

---

## 📝 Notes importantes

- **RGPD** : Les données sont hébergées en Europe (Supabase Frankfurt/London)
- **Âge minimum** : 15 ans (vérifié automatiquement à l'inscription)
- **Consentement** : Checkbox obligatoire à l'inscription
- **Politique de confidentialité** : Accessible sur `/politique-confidentialite`
- **Project-ref** : Identifiant unique de votre projet Supabase (dans l'URL)

---

## 🐛 Dépannage

### Erreur "Supabase URL or Anon Key is missing"
- Vérifier que le fichier `.env.local` existe dans `frontend/`
- Vérifier que les variables commencent par `NEXT_PUBLIC_`
- Redémarrer le serveur de développement après avoir créé/modifié `.env.local`

### Erreur lors de l'inscription
- Vérifier que la migration SQL a été appliquée (étape 3)
- Vérifier les logs dans le Dashboard Supabase > **Logs** > **Postgres Logs**
- Vérifier que l'âge est >= 15 ans
- Vérifier que la case de consentement est cochée

### Google OAuth ne fonctionne pas
- Vérifier que les URLs de redirection sont correctes dans Google Cloud Console
- Vérifier que le Client ID et Secret sont corrects dans Supabase
- Vérifier que le projet Google Cloud est bien sélectionné
- Vérifier que l'email de test est ajouté dans "Test users" (OAuth consent screen)

### L'email de confirmation n'arrive pas
- Vérifier les spams
- Vérifier que "Confirm email" est activé dans Supabase
- Vérifier les logs dans Supabase > **Authentication** > **Logs**

### Erreur "Invalid API key"
- Vérifier que vous avez copié la bonne clé (anon/public, pas service_role)
- Vérifier qu'il n'y a pas d'espaces avant/après dans `.env.local`

---

## 🎯 Prochaines étapes

Une fois l'authentification fonctionnelle, vous pouvez :
1. Alimenter la base de données avec des exercices
2. Implémenter la logique de progression réelle
3. Ajouter le système de duels (1VS1)
4. Personnaliser la politique de confidentialité avec vos vraies informations

---

## 📚 Fichiers créés automatiquement

Pour référence, voici les fichiers qui ont été créés automatiquement :

- `supabase/migrations/001_initial_schema.sql` - Schéma de la base de données
- `frontend/app/lib/supabase.ts` - Client Supabase
- `frontend/app/contexts/AuthContext.tsx` - Contexte d'authentification
- `frontend/app/components/LoginForm.tsx` - Formulaire de connexion
- `frontend/app/components/SignupForm.tsx` - Formulaire d'inscription
- `frontend/app/auth/login/page.tsx` - Page de connexion
- `frontend/app/auth/signup/page.tsx` - Page d'inscription
- `frontend/app/auth/callback/page.tsx` - Callback OAuth
- `frontend/app/auth/verify-email/page.tsx` - Page de vérification email
- `frontend/app/components/AccountPage.tsx` - Page de compte (modifiée)
- `frontend/app/components/Layout.tsx` - Layout (modifié)
- `frontend/middleware.ts` - Middleware de protection des routes
