# Ajouts Maquette 2 - Synthèse

## Nouveaux composants

### 1. **ClassesPage** (`ClassesPage.tsx`)
- Gestion des classes : rejoindre, rechercher par nom ou code
- Affichage des membres d'une classe
- Système de demandes d'amis depuis les classes
- Vue "Mes amis" avec gestion des demandes (accepter/refuser)
- Profils d'amis détaillés

### 2. **TrainingPage** (`TrainingPage.tsx`)
- Page d'entraînement complète remplaçant le placeholder "À venir"
- Liste de chapitres (Suites, Limites, Dérivabilité, etc.)
- Système de flash cards interactif par chapitre
- Choix entre exercices flash et exercices longs
- Marquage des chapitres "pas encore vus"

### 3. **DuelPage** (`DuelPage.tsx`)
- Page 1VS1 fonctionnelle
- Liste des amis disponibles pour défier
- Gestion des demandes de duel (recevoir, accepter, refuser)
- Suivi des duels envoyés

### 4. **SignupPage** (`SignupPage.tsx`)
- Formulaire d'inscription complet
- Validation des champs (nom, email, date de naissance, mot de passe)
- Design cohérent avec le reste de l'application

## Modifications dans App.tsx

### Navigation
- Nouvel onglet **"classes"** dans la sidebar (icône 📚)
- Nouvel onglet **"duel"** pour la page 1VS1
- Nouvel onglet **"signup"** pour l'inscription
- Le bouton 1VS1 redirige maintenant vers la page Duel

### Améliorations UX
- Badge de notification rouge sur le profil utilisateur pour les demandes d'amis
- Section Training remplacée par TrainingPage au lieu du message "À venir"
- Ajustement du padding de la sidebar (pt-8 au lieu de pt-64)

## Modifications dans AccountPage.tsx

### Système d'onglets
- Onglet **"Mon profil"** : informations personnelles (inchangé)
- Onglet **"Mes amis"** : nouvelle section avec :
  - Liste des amis
  - Demandes d'amis en attente
  - Profils détaillés des amis
  - Badge de notification pour nouvelles demandes

## Points techniques

- Tous les composants utilisent le même système de design (Fredoka, gradients, glassmorphism)
- Gestion d'état locale avec React hooks
- Navigation entre vues avec boutons "Retour"
- Responsive design (mobile et desktop)

