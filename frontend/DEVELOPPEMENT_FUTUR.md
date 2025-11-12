# Guide de développement futur - Page d'accueil

Ce document liste les éléments à modifier pour implémenter les comportements interactifs de la page d'accueil.

## Boutons et interactions

### 1. Bouton "S'entraîner" (MathExercise)
- **Fichier**: `app/components/MathExercise.tsx`
- **Action à implémenter**: Navigation vers la page d'exercice ou ouverture d'un modal
- **Modification**: Ajouter `onClick` prop et handler dans le composant parent

### 2. Bouton "1VS1" (ActionButton - primary)
- **Fichier**: `app/page.tsx`
- **Action à implémenter**: Créer/rejoindre un duel
- **Modification**: Passer une fonction `onClick` au composant ActionButton

### 3. Bouton "Réviser le cours" (ActionButton - secondary)
- **Fichier**: `app/page.tsx`
- **Action à implémenter**: Navigation vers la page de révision ou ouverture du cours
- **Modification**: Passer une fonction `onClick` au composant ActionButton

### 4. Icônes de navigation (SidebarIcon)
- **Fichier**: `app/page.tsx`
- **Actions à implémenter**:
  - 📚 (actif): Page d'accueil / Exercices
  - 📊: Page de progression / Statistiques
  - 🏋️: Page d'entraînement / Recommandations
  - ⚙️: Page de paramètres / Profil
- **Modification**: Passer des fonctions `onClick` à chaque SidebarIcon et gérer l'état `active`

## Navigation et routing

### 5. Système de routing
- **Fichier**: À créer - structure Next.js App Router
- **Pages à créer**:
  - `/exercices` - Liste des exercices
  - `/progression` - Statistiques et progression
  - `/entrainement` - Recommandations d'entraînement
  - `/parametres` - Paramètres utilisateur
  - `/duel` - Interface de duel
  - `/cours` - Révision du cours

### 6. Gestion de l'état utilisateur
- **Fichier**: À créer - Context ou store (Zustand/Redux)
- **Données à gérer**:
  - Utilisateur connecté
  - État de navigation actif
  - Données de progression

## Composants à enrichir

### 7. Composant MathExercise
- **Fichier**: `app/components/MathExercise.tsx`
- **Améliorations**:
  - Récupérer l'exercice depuis l'API
  - Afficher dynamiquement le contenu
  - Gérer le chargement et les erreurs

### 8. Composant Logo
- **Fichier**: `app/components/Logo.tsx`
- **Amélioration**: Ajouter `onClick` pour navigation vers l'accueil

### 9. Profil utilisateur (Header desktop)
- **Fichier**: `app/page.tsx`
- **Améliorations**:
  - Récupérer les données utilisateur depuis l'API
  - Ajouter menu déroulant au clic
  - Navigation vers profil

## API et données

### 10. Intégration API backend
- **Fichier**: À créer - `app/lib/api.ts` ou similaire
- **Endpoints à utiliser**:
  - `GET /users/me` - Profil utilisateur
  - `GET /exercises?chapter_id=X&type=flash` - Liste exercices
  - `POST /duels/create` - Créer un duel
  - `GET /progress` - Progression utilisateur

### 11. Gestion des erreurs
- **Fichier**: À créer - Error boundaries et handlers
- **À implémenter**: Gestion des erreurs API, affichage de messages d'erreur

## Responsive et UX

### 12. Amélioration mobile
- **Fichier**: `app/page.tsx`
- **Améliorations**:
  - Gestion du clavier virtuel
  - Optimisation des espacements sur petits écrans
  - Gestures (swipe) pour navigation

### 13. États de chargement
- **Fichier**: À créer - Composants de loading
- **À implémenter**: Skeletons, spinners pour les données en chargement

## Notes techniques

- Tous les boutons sont actuellement cliquables mais sans comportement
- Les composants utilisent `'use client'` pour les interactions
- La police Fredoka est chargée via Google Fonts
- Les couleurs suivent la charte graphique définie
- Les effets hover sont déjà implémentés

