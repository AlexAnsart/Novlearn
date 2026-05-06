# Guide de développement futur

Ce document liste les éléments restants à implémenter après l'intégration de la maquette.

## ✅ Implémenté

- ✅ Système de routing Next.js App Router avec toutes les pages
- ✅ Navigation complète avec sidebar (desktop) et bottom bar (mobile)
- ✅ Page d'accueil avec exercice et boutons d'action
- ✅ Page d'entraînement avec exercices interactifs (TableVariationExercise, ExponentialExercise)
- ✅ Page de progression avec graphiques radar et linéaires (recharts)
- ✅ Page de compte avec informations utilisateur
- ✅ Page de cours avec liste des chapitres
- ✅ Composants de validation et feedback
- ✅ Layout partagé avec navigation responsive

## À implémenter

### 1. Bouton "1VS1" (ActionButton - primary)
- **Fichier**: `app/page.tsx`
- **Action à implémenter**: Créer/rejoindre un duel
- **Modification**: Implémenter la logique de création/rejoindre un duel
- **Connecteur API**: `POST /duels/create` - Créer un duel

### 2. Gestion de l'état utilisateur
- **Fichier**: À créer - Context ou store (Zustand/Redux)
- **Données à gérer**:
  - Utilisateur connecté (actuellement hardcodé "GOTAGA")
  - Données de progression réelles
  - État de session

### 3. Composant MathExercise - Données dynamiques
- **Fichier**: `app/components/MathExercise.tsx`
- **Améliorations**:
  - Récupérer l'exercice depuis l'API
  - Afficher dynamiquement le contenu
  - Gérer le chargement et les erreurs
- **Connecteur API**: `GET /exercises?chapter_id=X&type=flash` - Liste exercices

### 4. Composant Logo
- **Fichier**: `app/components/Logo.tsx`
- **Amélioration**: Ajouter `onClick` pour navigation vers l'accueil

### 5. Profil utilisateur (Header desktop)
- **Fichier**: `app/components/Layout.tsx`
- **Améliorations**:
  - Récupérer les données utilisateur depuis l'API
  - Ajouter menu déroulant au clic
  - Navigation vers profil
- **Connecteur API**: `GET /users/me` - Profil utilisateur

### 6. Page de progression - Données réelles
- **Fichier**: `app/components/ProgressPage.tsx`
- **Améliorations**:
  - Récupérer les données de progression depuis l'API
  - Afficher les données réelles de l'utilisateur
- **Connecteur API**: `GET /progress` - Progression utilisateur

### 7. Page de compte - Données réelles
- **Fichier**: `app/components/AccountPage.tsx`
- **Améliorations**:
  - Récupérer les données utilisateur depuis l'API
  - Afficher les statistiques réelles
- **Connecteur API**: `GET /users/me` - Profil utilisateur

## API et données

### 8. Intégration API backend
- **Fichier**: À créer - `app/lib/api.ts` ou similaire
- **Endpoints à utiliser**:
  - `GET /users/me` - Profil utilisateur
  - `GET /exercises?chapter_id=X&type=flash` - Liste exercices
  - `POST /duels/create` - Créer un duel
  - `GET /progress` - Progression utilisateur

### 9. Gestion des erreurs
- **Fichier**: À créer - Error boundaries et handlers
- **À implémenter**: Gestion des erreurs API, affichage de messages d'erreur

## Responsive et UX

### 10. Amélioration mobile
- **Fichier**: Tous les composants
- **Améliorations**:
  - Gestion du clavier virtuel (déjà géré partiellement)
  - Optimisation des espacements sur petits écrans (déjà fait)
  - Gestures (swipe) pour navigation

### 11. États de chargement
- **Fichier**: À créer - Composants de loading
- **À implémenter**: Skeletons, spinners pour les données en chargement

## Notes techniques

- ✅ Navigation complète implémentée avec Next.js App Router
- ✅ Tous les composants utilisent `'use client'` pour les interactions
- ✅ La police Fredoka est chargée via Google Fonts dans `app/layout.tsx`
- ✅ Les couleurs suivent la charte graphique définie
- ✅ Les effets hover sont déjà implémentés
- ✅ Layout responsive avec sidebar (desktop) et bottom bar (mobile)
- ✅ Composants d'exercices interactifs avec validation
- ✅ Graphiques de progression avec recharts

## Connecteurs API à utiliser

1. **GET /users/me** - Récupérer le profil utilisateur
   - Utilisé dans: Layout (header), AccountPage
   
2. **GET /exercises?chapter_id=X&type=flash** - Liste des exercices
   - Utilisé dans: MathExercise, TrainingPage
   
3. **POST /duels/create** - Créer un duel
   - Utilisé dans: Page d'accueil (bouton 1VS1)
   
4. **GET /progress** - Progression utilisateur
   - Utilisé dans: ProgressPage

