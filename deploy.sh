#!/bin/bash

# Script de déploiement pour Novlearn
# Ce script est exécuté sur le VPS après chaque déploiement

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du déploiement Novlearn..."

# Variables
APP_DIR="/opt/novlearn"
BACKEND_DIR="$APP_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"
SERVICE_NAME="novlearn-backend"

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

# Redémarrer le service systemd (seulement s'il existe)
echo "🔄 Redémarrage du service backend..."
if systemctl list-unit-files | grep -q "^${SERVICE_NAME}.service"; then
    sudo systemctl restart $SERVICE_NAME
    
    # Vérifier le statut du service
    if sudo systemctl is-active --quiet $SERVICE_NAME; then
        echo "✅ Service $SERVICE_NAME démarré avec succès"
    else
        echo "❌ Erreur: le service $SERVICE_NAME n'a pas démarré"
        sudo systemctl status $SERVICE_NAME
        exit 1
    fi
else
    echo "⚠️  Le service $SERVICE_NAME n'existe pas encore. Il sera créé par le workflow GitHub Actions."
fi

echo "✅ Déploiement terminé avec succès!"

