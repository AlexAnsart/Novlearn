# Documentation Design - NovLearn

## Polices d'écriture utilisées

### 1. **Fredoka** (Google Fonts)
Police principale de l'application, arrondie et moderne.

#### Utilisations :
- **Poids 400 (Regular)** : Non utilisé directement
- **Poids 500 (Medium)** : 
  - Sous-titres et descriptions
  - Labels de formulaire
  - Textes secondaires
  - Exemple : Sous-titre "Maths Bac" du logo
  
- **Poids 600 (Semi-Bold)** :
  - Titres de sections
  - Boutons de navigation
  - Noms de chapitres
  - Nom d'utilisateur (GOTAGA)
  - Questions d'exercices
  - Labels "Réponse"
  - Exemple : Titres d'exercices, boutons de la sidebar
  
- **Poids 700 (Bold)** :
  - Titres principaux (h1, h2, h3)
  - Nom de l'application "NovLearn"
  - Texte des boutons d'action
  - Scores et statistiques
  - Résultats de validation
  - Exemple : "Ma progression", boutons "Valider", "Passer"

#### Emplacements spécifiques :
- Logo (titre "NovLearn") : 700, 3rem (48px)
- Logo (sous-titre "Maths Bac") : 500, 0.75rem (12px)
- Titres de pages : 700, 2.25rem-3rem (36-48px)
- Boutons principaux : 700, 1.125rem-1.5rem (18-24px)
- Texte des exercices : 500-600, 1.125rem (18px)
- Résultats de validation : 700, 2rem (32px)

### 2. **Serif** (Police système)
Police sérif native du navigateur pour les formules mathématiques.

#### Utilisations :
- Symboles mathématiques : ∫, Σ, ∞
- Variables mathématiques : f, x, i
- Formules : f(x) = x² · e^(-x), f(x) = x³ - 3x² + 2
- Éléments décoratifs mathématiques

#### Emplacements spécifiques :
- Formules dans les exercices : 1.5rem-2rem (24-32px)
- Éléments décoratifs : 1.5rem-2.5rem (24-40px)

---

## Couleurs utilisées (Codes Hexadécimaux)

### Fond principal (Dégradés)
- **#020617** - Slate 950 (from) - Point de départ du dégradé de fond
- **#1e3a8a** - Blue 950 (via) - Milieu du dégradé de fond
- **#0c4a6e** - Sky 900 (to) - Fin du dégradé de fond (utilisé également dans certaines variantes)

### Couleurs de la sidebar
- **#0f172a** avec opacité 60% - Slate 900/60 - Fond de la sidebar
- **#334155** avec opacité 50% - Slate 700/50 - Bouton inactif
- **#475569** avec opacité 60% - Slate 600/60 - Bouton hover
- **#2563eb** avec opacité 80% - Blue 600/80 - Bouton actif
- **#3b82f6** avec opacité 30% - Blue 500/30 - Ombre du bouton actif

### Couleurs des boutons principaux (1VS1, Réviser le cours, S'entraîner)

#### Bouton Bleu (1VS1, S'entraîner)
- **#3b82f6** - Blue 500 (from) - Début du dégradé
- **#1d4ed8** - Blue 700 (to) - Fin du dégradé
- **#1e40af** - Blue 800 - Ombre 3D
- **#2563eb** avec opacité 30% - Blue 600/30 - Ombre diffuse

#### Bouton Violet (Réviser le cours, Vérifier le cours)
- **#a855f7** - Purple 500 (from) - Début du dégradé
- **#7e22ce** - Purple 700 (to) - Fin du dégradé
- **#6b21a8** - Purple 800 - Ombre 3D (rgb(107,33,168))
- **#6d28d9** - Purple 700 dark - Ombre 3D alternative (rgb(109,40,217))
- **#9333ea** avec opacité 30% - Purple 600/30 - Ombre diffuse

### Couleurs du bouton "Valider" (Vert)
- **#16a34a** - Green 600 (from) - Début du dégradé
- **#22c55e** - Green 500 (to) - Fin du dégradé
- **#15803d** - Green 700 (hover from)
- **#4ade80** - Green 400 (hover to)

### Couleurs du bouton "Passer" (Gris)
- **#4b5563** - Gray 600 (from) - Début du dégradé
- **#6b7280** - Gray 500 (to) - Fin du dégradé
- **#6b7280** - Gray 500 (hover from)
- **#9ca3af** - Gray 400 (hover to)

### Couleurs des cartes et conteneurs
- **#1e293b** avec opacité 60% - Slate 800/60 - Fond des cartes principales
- **#0f172a** avec opacité 40% - Slate 900/40 - Fond des sous-cartes
- **#ffffff** avec opacité 10% - White/10 - Bordure interne (inset highlight)
- **#000000** avec opacité 40% - Black/40 - Ombres des cartes

### Couleurs des textes

#### Textes blancs/clairs
- **#ffffff** - White - Textes principaux sur fond sombre
- **#e0f2fe** - Sky 100 - Textes secondaires clairs
- **#bfdbfe** - Blue 200 - Textes tertiaires
- **#dbeafe** - Blue 100 - Textes de description

#### Textes sur fond blanc (exercices)
- **#1f2937** - Gray 800 - Titres sur fond blanc
- **#374151** - Gray 700 - Textes normaux sur fond blanc
- **#4b5563** - Gray 600 - Textes secondaires
- **#111827** - Gray 900 - Textes en gras/emphase

### Couleurs du profil utilisateur
- **#6b7280** - Gray 500 (from) - Début du dégradé de l'avatar
- **#374151** - Gray 700 (to) - Fin du dégradé de l'avatar

### Couleurs de progression (Code couleur des scores)

#### Rouge (0-30)
- **#ef4444** - Red 500 - Texte et stroke
- **#dc2626** - Red 600 (from) - Début du dégradé de fond
- **#ef4444** - Red 500 (to) - Fin du dégradé de fond

#### Orange (31-50)
- **#fb923c** - Orange 400 - Texte
- **#f97316** - Orange 500 - Stroke et couleurs principales
- **#ea580c** - Orange 600 (from) - Début du dégradé

#### Jaune (51-74)
- **#facc15** - Yellow 400 - Texte
- **#eab308** - Yellow 500 - Stroke et couleurs principales
- **#ca8a04** - Yellow 600 (from) - Début du dégradé

#### Bleu (75-89)
- **#60a5fa** - Blue 400 - Texte
- **#3b82f6** - Blue 500 - Stroke et couleurs principales
- **#2563eb** - Blue 600 (from) - Début du dégradé

#### Vert (90-100)
- **#4ade80** - Green 400 - Texte
- **#22c55e** - Green 500 - Stroke et couleurs principales
- **#16a34a** - Green 600 (from) - Début du dégradé

### Couleurs de l'objectif (75/100)
- **#f59e0b** - Amber 500 - Ligne de référence et marqueur d'objectif
- **#ef4444** avec opacité 20% - Red 500/20 - Fin du dégradé de l'octogone

### Couleurs des graphiques (Recharts)
- **#475569** - Slate 600 - Grilles et axes
- **#94a3b8** - Slate 400 - Textes des axes

### Couleurs des inputs et formulaires
- **#f9fafb** - Gray 50 - Fond des inputs (sur fond blanc)
- **#e5e7eb** - Gray 300 - Bordures des inputs
- **#1f2937** - Gray 900 - Texte dans les inputs (sur fond blanc)
- **#3b82f6** - Blue 500 - Focus ring des inputs
- **#dbeafe** - Blue 50 - Fond des zones de formules mathématiques
- **#93c5fd** - Blue 300 - Bordures des tableaux

### Couleurs de validation (Canvas de résultat)

#### Canvas Vert (Tout juste)
- **#16a34a** - Green 600 (from) - Début du dégradé
- **#22c55e** - Green 500 (to) - Fin du dégradé

#### Canvas Jaune (Partiellement juste)
- **#ca8a04** - Yellow 600 (from) - Début du dégradé
- **#eab308** - Yellow 500 (to) - Fin du dégradé

#### Canvas Rouge (Faux)
- **#dc2626** - Red 600 (from) - Début du dégradé
- **#ef4444** - Red 500 (to) - Fin du dégradé

### Couleurs des bordures
- **#d1d5db** - Gray 300 - Bordures sur fond blanc
- **#e5e7eb** - Gray 200 - Bordures légères
- **#475569** avec opacité 50% - Slate 600/50 - Bordures sur fond sombre

### Couleurs des éléments décoratifs (exercice page d'accueil)
- **#93c5fd** avec opacité 20% - Blue 300/20 - Symbole ∫
- **#c4b5fd** avec opacité 20% - Purple 300/20 - Symbole Σ
- **#bfdbfe** avec opacité 20% - Blue 200/20 - Symbole ∞

### Couleurs spécifiques aux icônes
- **#60a5fa** - Blue 400 - Icônes d'information (Mail, Calendar, Award)
- **#facc15** - Yellow 400 - Icône de niveau (Award doré)

---

## Résumé des dégradés utilisés

1. **Fond principal de l'app** : `from-slate-950 via-blue-950 to-slate-950`
2. **Bouton bleu** : `from-blue-500 to-blue-700`
3. **Bouton violet** : `from-purple-500 to-purple-700`
4. **Bouton vert** : `from-green-600 to-green-500`
5. **Bouton gris** : `from-gray-600 to-gray-500`
6. **Titre NovLearn** : `from-white via-blue-100 to-white`
7. **Avatar utilisateur** : `from-gray-500 to-gray-700`
8. **Canvas validation vert** : `from-green-600 to-green-500`
9. **Canvas validation jaune** : `from-yellow-600 to-yellow-500`
10. **Canvas validation rouge** : `from-red-600 to-red-500`

---

## Notes supplémentaires

- La plupart des couleurs utilisent des opacités pour créer des effets de transparence et de profondeur
- Les ombres sont créées avec des combinaisons de couleurs noires avec opacité variable
- Le système de couleurs suit la palette Tailwind CSS pour assurer la cohérence
- Les dégradés sont principalement verticaux (top to bottom) sauf pour le titre qui est horizontal (left to right)
