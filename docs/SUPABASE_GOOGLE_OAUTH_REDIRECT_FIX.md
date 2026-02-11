# Fix: Google OAuth et "Mot de passe oublié" redirigent vers localhost en production

## Problème

Lors de la connexion via Google SSO ou après avoir cliqué sur le lien "mot de passe oublié", les redirections pointent vers `localhost:3000` au lieu de votre domaine de production (`https://novlearn.fr`).

## Cause

Le problème vient de la configuration dans **Supabase Dashboard** où la "Site URL" est probablement encore configurée sur `http://localhost:3000`. Supabase utilise cette URL comme fallback pour toutes les redirections OAuth et les emails de réinitialisation de mot de passe.

## Solution complète

### 1. Configuration Supabase Dashboard (CRITIQUE)

1. **Aller dans votre projet Supabase** : https://supabase.com/dashboard
2. **Sélectionner votre projet** (NovLearn-prod)
3. **Aller dans** : `Authentication` → `URL Configuration` (dans le menu de gauche)
4. **Modifier la "Site URL"** :
   - ❌ **NE PAS mettre** : `http://localhost:3000`
   - ✅ **Mettre** : `https://novlearn.fr`
5. **Dans "Redirect URLs"**, ajouter les URLs suivantes (une par ligne) :
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/*
   https://novlearn.fr/auth/callback
   https://novlearn.fr/*
   https://www.novlearn.fr/auth/callback
   https://www.novlearn.fr/*
   ```
6. **Cliquer sur "Save"**

⚠️ **IMPORTANT** : Cette configuration est **CRITIQUE**. Sans cela, même si votre code utilise `window.location.origin`, Supabase utilisera toujours `localhost` comme fallback.

### 2. Configuration Google Cloud Console

1. **Aller dans Google Cloud Console** : https://console.cloud.google.com
2. **Sélectionner votre projet** (NovLearn-Auth)
3. **Aller dans** : `APIs & Services` → `Credentials`
4. **Trouver votre OAuth Client ID** (celui utilisé pour Supabase)
5. **Cliquer sur le nom du client** pour l'éditer
6. **Vérifier "Authorized JavaScript origins"** contient :
   - `http://localhost:3000`
   - `https://novlearn.fr`
   - `https://www.novlearn.fr`
7. **Vérifier "Authorized redirect URIs"** contient :
   - L'URL de callback Supabase : `https://VOTRE-PROJECT-REF.supabase.co/auth/v1/callback`
     - ⚠️ **Cette URL est unique à votre projet Supabase**, vous la trouverez dans Supabase Dashboard → `Authentication` → `Providers` → `Google` → Section "Callback URL"
   - Pour le dev local (si vous utilisez Supabase local) : `http://localhost:54321/auth/v1/callback`
8. **Cliquer sur "Save"**

### 3. Vérification du code (déjà corrigé)

Le code a été corrigé pour utiliser `window.location.origin` dynamiquement :

- ✅ `frontend/app/contexts/AuthContext.tsx` : Utilise `window.location.origin` pour Google OAuth
- ✅ `frontend/app/auth/forgot-password/page.tsx` : Utilise `window.location.origin` pour les emails de réinitialisation
- ✅ `frontend/app/auth/callback/route.ts` : Gère correctement les redirections en production avec `x-forwarded-host`

### 4. Test après configuration

1. **En local** :
   ```bash
   cd frontend
   npm run dev
   ```
   - Aller sur `http://localhost:3000/auth/login`
   - Tester la connexion Google → doit rediriger vers `http://localhost:3000/auth/callback`
   - Tester "Mot de passe oublié" → le lien dans l'email doit pointer vers `http://localhost:3000/auth/callback`

2. **En production** :
   - Aller sur `https://novlearn.fr/auth/login`
   - Tester la connexion Google → doit rediriger vers `https://novlearn.fr/auth/callback`
   - Tester "Mot de passe oublié" → le lien dans l'email doit pointer vers `https://novlearn.fr/auth/callback`

## Pourquoi ça ne fonctionnait pas ?

1. **Supabase utilise la "Site URL" comme fallback** : Même si vous passez `redirectTo` dans votre code, si cette URL n'est pas dans la liste des "Redirect URLs" autorisées, Supabase utilise la "Site URL" par défaut.

2. **Les emails de réinitialisation** : Supabase utilise la "Site URL" pour construire les liens dans les emails si aucun `redirectTo` n'est fourni ou si l'URL fournie n'est pas autorisée.

3. **Google OAuth** : Google vérifie que l'URL de redirection finale (après Supabase) correspond à une URL autorisée dans Google Cloud Console.

## Checklist de vérification

- [ ] Site URL dans Supabase Dashboard = `https://novlearn.fr` (pas localhost)
- [ ] Redirect URLs dans Supabase contient `https://novlearn.fr/*` et `http://localhost:3000/*`
- [ ] Authorized JavaScript origins dans Google Cloud Console contient `https://novlearn.fr`
- [ ] Authorized redirect URIs dans Google Cloud Console contient l'URL de callback Supabase
- [ ] Code utilise `window.location.origin` (déjà corrigé)
- [ ] Test en local fonctionne
- [ ] Test en production fonctionne

## Notes importantes

- ⚠️ **Ne changez PAS la "Site URL" pour le dev local** : Utilisez les "Redirect URLs" pour autoriser plusieurs environnements
- ⚠️ **Les Redirect URLs doivent être exactes** : `https://novlearn.fr/*` autorise toutes les sous-routes
- ⚠️ **Attendez quelques minutes** après avoir modifié les configurations pour que les changements prennent effet

## Références

- [Supabase Redirect URLs Documentation](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Troubleshooting: Wrong redirect URL](https://supabase.com/docs/guides/troubleshooting/why-am-i-being-redirected-to-the-wrong-url-when-using-auth-redirectto-option-_vqIeO)
