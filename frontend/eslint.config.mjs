import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Désactiver pour les pages avec du contenu textuel français (apostrophes fréquentes)
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
