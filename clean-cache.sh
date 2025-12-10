#!/bin/bash

# Script pour nettoyer le cache Next.js en cas de problème
# Usage: ./clean-cache.sh

set -e

echo "🧹 Nettoyage du cache Next.js..."

FRONTEND_DIR="/opt/novlearn/frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Répertoire frontend introuvable: $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"

echo "📁 Suppression du dossier .next..."
rm -rf .next

echo "📁 Suppression du cache node_modules..."
rm -rf node_modules/.cache

echo "📁 Suppression du cache npm..."
npm cache clean --force

echo "✅ Cache nettoyé avec succès!"
echo ""
echo "Pour reconstruire l'application, exécutez:"
echo "  cd $FRONTEND_DIR"
echo "  npm run build"
echo "  sudo systemctl restart novlearn-frontend"

