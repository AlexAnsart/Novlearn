# Guide des tests Novlearn

## Vue d'ensemble

La suite de tests couvre les trois composants principaux :

| Composant | Framework | Fichiers | Couverture |
|-----------|-----------|----------|------------|
| `backend` | pytest | `backend/tests/` | Streak, recommandation, DS, auth, API |
| `duel-server` | vitest | `duel-server/src/__tests__/` | DB functions, état duel, logique de jeu |
| `frontend` | vitest | `frontend/__tests__/` | Utilitaires (scores, difficulté) |

---

## Prérequis

### Backend
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux / Mac
source .venv/bin/activate

pip install -r requirements-test.txt
```

### Duel Server
```bash
cd duel-server
npm install
```

### Frontend
```bash
cd frontend
npm install
```

---

## Lancer les tests

### Tous les tests (depuis la racine)
```bash
# Windows — cmd/PowerShell séquentiel
npm run test:backend
npm run test:duel
npm run test:frontend
```

### Backend uniquement
```bash
cd backend

# Tous les tests
python -m pytest

# Avec couverture
python -m pytest --cov=. --cov-report=term-missing

# Un fichier spécifique
python -m pytest tests/test_recommandation.py -v

# Un test précis
python -m pytest tests/test_streak.py::TestComputeStreak::test_three_correct_returns_three -v
```

### Duel Server uniquement
```bash
cd duel-server

# Tous les tests
npm test

# Mode watch (relance au changement)
npm run test:watch

# Avec couverture
npm run test:coverage
```

### Frontend uniquement
```bash
cd frontend

# Tous les tests
npm test

# Mode watch
npm run test:watch

# Avec couverture
npm run test:coverage
```

---

## Structure des tests

```
backend/
├── pytest.ini                    # Configuration pytest
├── requirements-test.txt         # Dépendances de test
└── tests/
    ├── conftest.py               # Fixtures partagées + factory make_supabase()
    ├── test_streak.py            # compute_streak() — 13 tests
    ├── test_recommandation.py    # Algo recommandation — 20 tests
    ├── test_ds.py                # Devoirs Surveillés — 14 tests
    ├── test_auth.py              # verify_token() — 7 tests
    └── test_api.py               # Endpoints FastAPI — 22 tests

duel-server/
├── vitest.config.ts              # Configuration vitest
└── src/__tests__/
    ├── db.test.ts                # DB functions (Supabase mock) — 13 tests
    └── DuelState.test.ts         # Schéma état + logique jeu — 25 tests

frontend/
├── vitest.config.ts              # Configuration vitest
└── __tests__/
    ├── setup.ts                  # Mocks globaux (Next.js, Supabase)
    └── lib/
        ├── competenceScore.test.ts  # getBonusStreak, computeNewScore — 17 tests
        └── exerciseUtils.test.ts    # dbToUiDifficulty, uiToDbDifficulty — 18 tests
```

---

## Philosophie des tests

### Backend
- **Fonctions pures** testées directement sans mock (tri fusion, choisir difficulté, pick exercise).
- **Supabase mocké** via la factory `make_supabase(**tables)` dans `conftest.py` : simule le pattern builder (select → eq → execute) et supporte les modes liste et single.
- **API endpoints** testés via `TestClient` de FastAPI avec `app.dependency_overrides` pour bypasser `verify_token`.
- **Le scheduler APScheduler** (notifications) est patché avant import de `main` pour éviter les connexions réseau.

### Duel Server
- **Client Supabase** mocké avec `vi.hoisted` + `vi.mock('@supabase/supabase-js')`.
- **Logique de jeu** (score, skip, gagnant) extraite et testée en isolation via des fonctions miroirs — aucune dépendance sur le serveur Colyseus.
- **DuelState** testé directement pour vérifier les valeurs initiales et les mutations.

### Frontend
- **Fonctions utilitaires pures** testées directement (aucun mock nécessaire pour `competenceScore.ts` et `exerciseUtils.ts`).
- **Mocks globaux** dans `setup.ts` pour Next.js et Supabase (évite les erreurs d'import hors contexte navigateur).

---

## Ajouter de nouveaux tests

### Backend
Créer `backend/tests/test_<module>.py` en important depuis `conftest.py` :
```python
from conftest import make_supabase
from mon_module import ma_fonction

def test_cas_nominal():
    client = make_supabase(ma_table=[{"id": 1, "data": "value"}])
    result = ma_fonction(client, "arg")
    assert result == expected
```

### Duel Server / Frontend
Créer un fichier `*.test.ts` dans le dossier `__tests__/` correspondant.
vitest détecte automatiquement tous les fichiers `*.test.ts`.

---

## CI / Intégration continue

Pour intégrer dans GitHub Actions, ajouter une étape dans `.github/workflows/` :

```yaml
- name: Tests Backend
  run: |
    cd backend
    pip install -r requirements-test.txt
    python -m pytest --tb=short

- name: Tests Duel Server
  run: |
    cd duel-server
    npm ci
    npm test

- name: Tests Frontend
  run: |
    cd frontend
    npm ci
    npm test
```
