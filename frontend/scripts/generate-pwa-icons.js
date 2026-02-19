/**
 * Script pour générer les icônes PWA à partir de logo_seul.png
 *
 * Installation: npm install sharp
 * Utilisation: node scripts/generate-pwa-icons.js
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = path.join(__dirname, "../public/logo_seul.png");
const outputDir = path.join(__dirname, "../public/icons");

async function generateIcons() {
  // Créer le dossier icons s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Génération des icônes PWA...");

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    await sharp(inputImage)
      .resize(size, size, {
        fit: "contain",
        background: { r: 15, g: 23, b: 42, alpha: 1 }, // bg-slate-900
      })
      .png()
      .toFile(outputPath);

    console.log(`✓ Créé: icon-${size}x${size}.png`);
  }

  console.log("\n✅ Toutes les icônes ont été générées dans public/icons/");
}

generateIcons().catch(console.error);
