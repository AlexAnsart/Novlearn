#!/bin/bash

# Script de déploiement pour Novlearn
# Ce script est exécuté sur le VPS après chaque déploiement

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du déploiement Novlearn..."

# Variables
APP_DIR="/opt/novlearn"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"
BACKEND_SERVICE="novlearn-backend"
FRONTEND_SERVICE="novlearn-frontend"

# ===== BACKEND =====
echo "📦 Déploiement du backend..."

# Aller dans le répertoire backend
cd "$BACKEND_DIR"

# Créer l'environnement virtuel Python s'il n'existe pas
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Création de l'environnement virtuel Python..."
    python3 -m venv venv
fi

# Activer l'environnement virtuel
source venv/bin/activate

# Installer/mettre à jour les dépendances
echo "📦 Installation des dépendances Python..."
pip install --upgrade pip
pip install -r requirements.txt

# Appliquer les migrations de base de données (si vous utilisez Alembic)
# echo "🗄️ Application des migrations..."
# alembic upgrade head

# Redémarrer le service systemd backend
echo "🔄 Redémarrage du service backend..."
if systemctl list-unit-files | grep -q "^${BACKEND_SERVICE}.service"; then
    sudo systemctl restart $BACKEND_SERVICE
    
    # Vérifier le statut du service
    if sudo systemctl is-active --quiet $BACKEND_SERVICE; then
        echo "✅ Service $BACKEND_SERVICE démarré avec succès"
    else
        echo "❌ Erreur: le service $BACKEND_SERVICE n'a pas démarré"
        sudo systemctl status $BACKEND_SERVICE
        exit 1
    fi
else
    echo "⚠️  Le service $BACKEND_SERVICE n'existe pas encore. Il sera créé par le workflow GitHub Actions."
fi

# ===== FRONTEND =====
echo "📦 Déploiement du frontend..."

# Aller dans le répertoire frontend
cd "$FRONTEND_DIR"

# Installer les dépendances npm
echo "📦 Installation des dépendances Node.js..."
npm ci --production=false

# Builder l'application Next.js
echo "🔨 Build de l'application Next.js..."
NODE_ENV=production npm run build

# Redémarrer le service systemd frontend
echo "🔄 Redémarrage du service frontend..."
if systemctl list-unit-files | grep -q "^${FRONTEND_SERVICE}.service"; then
    sudo systemctl restart $FRONTEND_SERVICE
    
    # Vérifier le statut du service
    if sudo systemctl is-active --quiet $FRONTEND_SERVICE; then
        echo "✅ Service $FRONTEND_SERVICE démarré avec succès"
    else
        echo "❌ Erreur: le service $FRONTEND_SERVICE n'a pas démarré"
        sudo systemctl status $FRONTEND_SERVICE
        exit 1
    fi
else
    echo "⚠️  Le service $FRONTEND_SERVICE n'existe pas encore. Il sera créé par le workflow GitHub Actions."
fi

echo "✅ Déploiement terminé avec succès!"

