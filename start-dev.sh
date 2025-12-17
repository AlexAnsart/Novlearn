#!/bin/bash

echo "===================================="
echo "  Novlearn"
echo "  Démarrage de l'environnement de développement"
echo "===================================="
echo ""

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé"
    exit 1
fi

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Créer l'environnement virtuel Python s'il n'existe pas
if [ ! -d "backend/venv" ]; then
    echo "[Backend] Création de l'environnement virtuel..."
    cd backend
    python3 -m venv venv
    cd ..
fi

# Activer l'environnement virtuel et installer les dépendances
echo "[Backend] Installation des dépendances Python..."
cd backend
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
cd ..

# Démarrer le backend en arrière-plan
echo "[Backend] Démarrage du serveur FastAPI..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Attendre un peu pour que le backend démarre
sleep 3

# Installer les dépendances npm si nécessaire
if [ ! -d "frontend/node_modules" ]; then
    echo "[Frontend] Installation des dépendances npm..."
    cd frontend
    npm install
    cd ..
fi

# Démarrer le frontend
echo "[Frontend] Démarrage du serveur Next.js..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "===================================="
echo "  Serveurs démarrés !"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8010"
echo "===================================="
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs..."

# Attendre l'interruption
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

