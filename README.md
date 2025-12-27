# Novlearn

Plateforme d'entraînement ludique et personnalisée pour le Bac de mathématiques.

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** 18+ et npm/yarn
- **Python** 3.11+
- **PostgreSQL** 15+ (optionnel pour le développement initial)

### Installation

#### 1. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Le frontend sera accessible sur [http://localhost:3000](http://localhost:3000)

#### 2. Backend (FastAPI)

```bash
cd backend

# Sur Windows
.\venv\Scripts\Activate.ps1

# Sur Linux/Mac
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

Le backend sera accessible sur [http://localhost:8000](http://localhost:8000)

### Vérification

- Frontend : [http://localhost:3000](http://localhost:3000)
- Backend API : [http://localhost:8000](http://localhost:8000)
- Health check : [http://localhost:8000/api/health](http://localhost:8000/api/health)

> **Note** : Pour que l'authentification fonctionne en local, voir [GUIDE_LOCAL_SETUP.md](GUIDE_LOCAL_SETUP.md)

## 📁 Structure du projet

```
novlearn/
├── frontend/          # Application Next.js
│   ├── app/          # Pages et composants
│   ├── components/   # Composants React réutilisables
│   └── public/       # Fichiers statiques
├── backend/          # API FastAPI
│   ├── main.py       # Point d'entrée de l'API
│   └── requirements.txt
└── docs_projet/      # Documentation du projet
```

## 🛠️ Technologies utilisées

### Frontend
- **React 18+** : Bibliothèque JavaScript pour interfaces utilisateur
- **Next.js 14+** : Framework React avec routing
- **Tailwind CSS** : Framework CSS utility-first
- **TypeScript** : Typage statique

### Backend
- **Python 3.11+** : Langage serveur
- **FastAPI** : Framework moderne pour API REST asynchrone
- **PostgreSQL** : Base de données relationnelle
- **SQLAlchemy** : ORM Python

## 📝 Développement

### Commandes utiles

**Frontend :**
```bash
npm run dev      # Développement avec hot-reload
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # Vérification du code
```

**Backend :**
```bash
python main.py                    # Lancement avec auto-reload
uvicorn main:app --reload         # Alternative avec uvicorn
```

## 🔧 Configuration

### Variables d'environnement

#### Frontend (Supabase)

Créez un fichier `.env.local` dans le dossier `frontend/` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
```

**Où trouver ces valeurs ?**
- Aller sur https://supabase.com/dashboard
- Sélectionner votre projet > **Settings** > **API**
- Copier le **Project URL** et la clé **anon public**

**Important** : Après avoir créé/modifié `.env.local`, redémarrer le serveur (`npm run dev`)

Voir [GUIDE_LOCAL_SETUP.md](GUIDE_LOCAL_SETUP.md) pour la configuration complète de l'authentification en local.

#### Backend

Créez un fichier `.env` dans le dossier `backend/` :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/novlearn
SECRET_KEY=your-secret-key-here
```

## 📚 Documentation

- [Cahier des charges technique](docs_projet/Cahier%20des%20charges%20Technique.txt)
- [Fiche de lancement](docs_projet/Fiche%20de%20lancement.txt)

## 👥 Équipe

- Balthazar
- Charles
- Yoan
- Timothée
- Alexandre

## 📅 Calendrier

- **Février 2026** : MVP testable
- **Juin 2026** : Livraison finale

## 🚀 Déploiement

Le déploiement est automatisé via GitHub Actions. Chaque push sur `main` déclenche un déploiement automatique sur le VPS.

**Configuration requise :**
- VPS avec Apache, PostgreSQL, Python 3.11+
- Secrets GitHub Actions configurés (VPS_HOST, VPS_USERNAME, VPS_SSH_KEY, DATABASE_URL, SECRET_KEY)
- Nom de domaine `novlearn.fr` pointant vers le VPS
- SSL configuré avec Certbot

Le workflow déploie automatiquement le frontend (Next.js) et le backend (FastAPI) avec configuration Apache et service systemd.

## 📄 Licence

Projet académique - École Centrale de Lyon


```
Novlearn
├─ apache
│  ├─ novlearn.fr-le-ssl.conf
│  └─ novlearn.fr.conf
├─ backend
│  ├─ main.py
│  └─ requirements.txt
├─ clean-cache.sh
├─ data
│  └─ analyse_equation_de_degre_2_1_rgyfpt.json
├─ deploy.sh
├─ docs_projet
│  ├─ AJOUTS_MAQUETTE2.md
│  ├─ Cahier des charges Technique.txt
│  ├─ Charte graphique.txt
│  ├─ Fiche de lancement.txt
│  ├─ Maquette1
│  │  ├─ index.html
│  │  ├─ package.json
│  │  ├─ README.md
│  │  ├─ src
│  │  │  ├─ App.tsx
│  │  │  ├─ assets
│  │  │  │  └─ e87ed438d673a206ab378f4bc50ae391b5d1f031.png
│  │  │  ├─ Attributions.md
│  │  │  ├─ components
│  │  │  │  ├─ AccountPage.tsx
│  │  │  │  ├─ ActionButton.tsx
│  │  │  │  ├─ CoursePage.tsx
│  │  │  │  ├─ ExponentialExercise.tsx
│  │  │  │  ├─ figma
│  │  │  │  │  └─ ImageWithFallback.tsx
│  │  │  │  ├─ Logo.tsx
│  │  │  │  ├─ MathExercise.tsx
│  │  │  │  ├─ ProgressPage.tsx
│  │  │  │  ├─ SidebarIcon.tsx
│  │  │  │  ├─ TableVariationExercise.tsx
│  │  │  │  ├─ ui
│  │  │  │  │  ├─ accordion.tsx
│  │  │  │  │  ├─ alert-dialog.tsx
│  │  │  │  │  ├─ alert.tsx
│  │  │  │  │  ├─ aspect-ratio.tsx
│  │  │  │  │  ├─ avatar.tsx
│  │  │  │  │  ├─ badge.tsx
│  │  │  │  │  ├─ breadcrumb.tsx
│  │  │  │  │  ├─ button.tsx
│  │  │  │  │  ├─ calendar.tsx
│  │  │  │  │  ├─ card.tsx
│  │  │  │  │  ├─ carousel.tsx
│  │  │  │  │  ├─ chart.tsx
│  │  │  │  │  ├─ checkbox.tsx
│  │  │  │  │  ├─ collapsible.tsx
│  │  │  │  │  ├─ command.tsx
│  │  │  │  │  ├─ context-menu.tsx
│  │  │  │  │  ├─ dialog.tsx
│  │  │  │  │  ├─ drawer.tsx
│  │  │  │  │  ├─ dropdown-menu.tsx
│  │  │  │  │  ├─ form.tsx
│  │  │  │  │  ├─ hover-card.tsx
│  │  │  │  │  ├─ input-otp.tsx
│  │  │  │  │  ├─ input.tsx
│  │  │  │  │  ├─ label.tsx
│  │  │  │  │  ├─ menubar.tsx
│  │  │  │  │  ├─ navigation-menu.tsx
│  │  │  │  │  ├─ pagination.tsx
│  │  │  │  │  ├─ popover.tsx
│  │  │  │  │  ├─ progress.tsx
│  │  │  │  │  ├─ radio-group.tsx
│  │  │  │  │  ├─ resizable.tsx
│  │  │  │  │  ├─ scroll-area.tsx
│  │  │  │  │  ├─ select.tsx
│  │  │  │  │  ├─ separator.tsx
│  │  │  │  │  ├─ sheet.tsx
│  │  │  │  │  ├─ sidebar.tsx
│  │  │  │  │  ├─ skeleton.tsx
│  │  │  │  │  ├─ slider.tsx
│  │  │  │  │  ├─ sonner.tsx
│  │  │  │  │  ├─ switch.tsx
│  │  │  │  │  ├─ table.tsx
│  │  │  │  │  ├─ tabs.tsx
│  │  │  │  │  ├─ textarea.tsx
│  │  │  │  │  ├─ toggle-group.tsx
│  │  │  │  │  ├─ toggle.tsx
│  │  │  │  │  ├─ tooltip.tsx
│  │  │  │  │  ├─ use-mobile.ts
│  │  │  │  │  └─ utils.ts
│  │  │  │  └─ ValidationResult.tsx
│  │  │  ├─ DESIGN_DOCUMENTATION.md
│  │  │  ├─ guidelines
│  │  │  │  └─ Guidelines.md
│  │  │  ├─ index.css
│  │  │  ├─ main.tsx
│  │  │  └─ styles
│  │  │     └─ globals.css
│  │  └─ vite.config.ts
│  └─ Maquette2
│     ├─ index.html
│     ├─ package.json
│     ├─ README.md
│     ├─ src
│     │  ├─ App.tsx
│     │  ├─ assets
│     │  │  └─ e87ed438d673a206ab378f4bc50ae391b5d1f031.png
│     │  ├─ Attributions.md
│     │  ├─ components
│     │  │  ├─ AccountPage.tsx
│     │  │  ├─ ActionButton.tsx
│     │  │  ├─ ClassesPage.tsx
│     │  │  ├─ CoursePage.tsx
│     │  │  ├─ DuelPage.tsx
│     │  │  ├─ ExponentialExercise.tsx
│     │  │  ├─ figma
│     │  │  │  └─ ImageWithFallback.tsx
│     │  │  ├─ Logo.tsx
│     │  │  ├─ MathExercise.tsx
│     │  │  ├─ ProgressPage.tsx
│     │  │  ├─ SidebarIcon.tsx
│     │  │  ├─ SignupPage.tsx
│     │  │  ├─ TableVariationExercise.tsx
│     │  │  ├─ TrainingPage.tsx
│     │  │  ├─ ui
│     │  │  │  ├─ accordion.tsx
│     │  │  │  ├─ alert-dialog.tsx
│     │  │  │  ├─ alert.tsx
│     │  │  │  ├─ aspect-ratio.tsx
│     │  │  │  ├─ avatar.tsx
│     │  │  │  ├─ badge.tsx
│     │  │  │  ├─ breadcrumb.tsx
│     │  │  │  ├─ button.tsx
│     │  │  │  ├─ calendar.tsx
│     │  │  │  ├─ card.tsx
│     │  │  │  ├─ carousel.tsx
│     │  │  │  ├─ chart.tsx
│     │  │  │  ├─ checkbox.tsx
│     │  │  │  ├─ collapsible.tsx
│     │  │  │  ├─ command.tsx
│     │  │  │  ├─ context-menu.tsx
│     │  │  │  ├─ dialog.tsx
│     │  │  │  ├─ drawer.tsx
│     │  │  │  ├─ dropdown-menu.tsx
│     │  │  │  ├─ form.tsx
│     │  │  │  ├─ hover-card.tsx
│     │  │  │  ├─ input-otp.tsx
│     │  │  │  ├─ input.tsx
│     │  │  │  ├─ label.tsx
│     │  │  │  ├─ menubar.tsx
│     │  │  │  ├─ navigation-menu.tsx
│     │  │  │  ├─ pagination.tsx
│     │  │  │  ├─ popover.tsx
│     │  │  │  ├─ progress.tsx
│     │  │  │  ├─ radio-group.tsx
│     │  │  │  ├─ resizable.tsx
│     │  │  │  ├─ scroll-area.tsx
│     │  │  │  ├─ select.tsx
│     │  │  │  ├─ separator.tsx
│     │  │  │  ├─ sheet.tsx
│     │  │  │  ├─ sidebar.tsx
│     │  │  │  ├─ skeleton.tsx
│     │  │  │  ├─ slider.tsx
│     │  │  │  ├─ sonner.tsx
│     │  │  │  ├─ switch.tsx
│     │  │  │  ├─ table.tsx
│     │  │  │  ├─ tabs.tsx
│     │  │  │  ├─ textarea.tsx
│     │  │  │  ├─ toggle-group.tsx
│     │  │  │  ├─ toggle.tsx
│     │  │  │  ├─ tooltip.tsx
│     │  │  │  ├─ use-mobile.ts
│     │  │  │  └─ utils.ts
│     │  │  └─ ValidationResult.tsx
│     │  ├─ DESIGN_DOCUMENTATION.md
│     │  ├─ guidelines
│     │  │  └─ Guidelines.md
│     │  ├─ index.css
│     │  ├─ main.tsx
│     │  └─ styles
│     │     └─ globals.css
│     └─ vite.config.ts
├─ frontend
│  ├─ app
│  │  ├─ api
│  │  │  └─ exercises
│  │  │     └─ route.ts
│  │  ├─ auth
│  │  │  ├─ callback
│  │  │  │  └─ page.tsx
│  │  │  ├─ login
│  │  │  │  └─ page.tsx
│  │  │  ├─ signup
│  │  │  │  └─ page.tsx
│  │  │  └─ verify-email
│  │  │     └─ page.tsx
│  │  ├─ classes
│  │  │  └─ page.tsx
│  │  ├─ components
│  │  │  ├─ AccountPage.tsx
│  │  │  ├─ ActionButton.tsx
│  │  │  ├─ ClassesPage.tsx
│  │  │  ├─ CoursePage.tsx
│  │  │  ├─ DuelPage.tsx
│  │  │  ├─ Exercise
│  │  │  │  ├─ ExerciseLoader.tsx
│  │  │  │  ├─ ExerciseRenderer.tsx
│  │  │  │  └─ index.ts
│  │  │  ├─ ExercisePage.tsx
│  │  │  ├─ ExponentialExercise.tsx
│  │  │  ├─ Layout.tsx
│  │  │  ├─ LoginForm.tsx
│  │  │  ├─ Logo.tsx
│  │  │  ├─ MathExercise.tsx
│  │  │  ├─ ProgressPage.tsx
│  │  │  ├─ SidebarIcon.tsx
│  │  │  ├─ SignupForm.tsx
│  │  │  ├─ TableVariationExercise.tsx
│  │  │  ├─ TrainingPage.tsx
│  │  │  ├─ ui
│  │  │  │  └─ MathText.tsx
│  │  │  └─ ValidationResult.tsx
│  │  ├─ compte
│  │  │  └─ page.tsx
│  │  ├─ conditions-utilisation
│  │  │  └─ page.tsx
│  │  ├─ contexts
│  │  │  └─ AuthContext.tsx
│  │  ├─ cours
│  │  │  └─ page.tsx
│  │  ├─ currentexercise
│  │  │  └─ page.tsx
│  │  ├─ duel
│  │  │  └─ page.tsx
│  │  ├─ entrainement
│  │  │  └─ page.tsx
│  │  ├─ exercices
│  │  │  └─ page.tsx
│  │  ├─ globals.css
│  │  ├─ hooks
│  │  │  ├─ useVariable.ts
│  │  │  └─ useVariables.ts
│  │  ├─ layout.tsx
│  │  ├─ lib
│  │  │  └─ supabase.ts
│  │  ├─ page.tsx
│  │  ├─ parametres
│  │  │  └─ page.tsx
│  │  ├─ politique-confidentialite
│  │  │  └─ page.tsx
│  │  ├─ progression
│  │  │  └─ page.tsx
│  │  ├─ renderers
│  │  │  ├─ EquationRenderer.tsx
│  │  │  ├─ FunctionRenderer.tsx
│  │  │  ├─ GraphRenderer.tsx
│  │  │  ├─ index.ts
│  │  │  ├─ MCQRenderer.tsx
│  │  │  ├─ QuestionRenderer.tsx
│  │  │  ├─ SignTableRenderer.tsx
│  │  │  ├─ TextRenderer.tsx
│  │  │  └─ VariationTableRenderer.tsx
│  │  ├─ types
│  │  │  └─ exercise.ts
│  │  └─ utils
│  │     ├─ MathParser.ts
│  │     └─ variableGenerator.ts
│  ├─ DEVELOPPEMENT_FUTUR.md
│  ├─ middleware.ts
│  ├─ next-env.d.ts
│  ├─ next.config.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ data
│  │  │  └─ analyse_equation_de_degre_2_1_rgyfpt.json
│  │  ├─ favicon.ico
│  │  ├─ logo.png
│  │  └─ logo_seul.png
│  ├─ tailwind.config.js
│  └─ tsconfig.json
├─ package-lock.json
├─ README.md
├─ SETUP_AUTH.md
├─ start-dev.bat
├─ start-dev.sh
├─ supabase
│  └─ migrations
│     └─ 001_initial_schema.sql
└─ systemd
   ├─ novlearn-backend.service
   └─ novlearn-frontend.service

```