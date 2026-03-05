"use client";

import "mathlive";
import React, { useEffect, useRef } from "react";

// On ajoute inputMode et les attributs MathLive au typage pour éviter les erreurs TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        ref?: React.RefObject<any>;
        inputMode?:
          | "none"
          | "text"
          | "decimal"
          | "numeric"
          | "tel"
          | "search"
          | "email"
          | "url";
        "math-virtual-keyboard-policy"?: "auto" | "manual";
      };
    }
  }
}

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
}) => {
  const mfRef = useRef<any>(null);
  const isKeyboardVisibleRef = useRef(false);

  // === 1. LOGIQUE DE FOCUS (PC & VIRTUAL KEYBOARD) ===
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    const checkKeyboardVisibility = () => {
      const keyboard = (window as any).mathVirtualKeyboard;
      if (keyboard) {
        isKeyboardVisibleRef.current = keyboard.visible;
      }
    };

    const handleFocus = () => {
      const keyboard = (window as any).mathVirtualKeyboard;
      // N'afficher le clavier que s'il n'est pas déjà visible
      // pour éviter un reset interne qui "avale" le prochain keystroke physique
      if (keyboard && !keyboard.visible) {
        keyboard.show({ animate: true });
      }
    };

    const handleBlur = () => {
      checkKeyboardVisibility();
      if (isKeyboardVisibleRef.current) {
        setTimeout(() => {
          if (
            isKeyboardVisibleRef.current &&
            mf &&
            document.activeElement?.tagName !== "MATH-FIELD"
          ) {
            mf.focus();
          }
        }, 0);
      }
    };

    const keyboard = (window as any).mathVirtualKeyboard;
    if (keyboard) {
      keyboard.addEventListener?.("geometrychange", checkKeyboardVisibility);
    }

    mf.addEventListener("focus", handleFocus);
    mf.addEventListener("blur", handleBlur);

    const handleGlobalPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;

      const isKeyboardClick =
        target.closest(".ML__keyboard") || target.closest('[part="keyboard"]');

      if (
        isKeyboardClick &&
        mf === (window as any).mathVirtualKeyboard.targetElement
      ) {
        isKeyboardVisibleRef.current = true;
        e.preventDefault();
        // Ne refocus que si le champ n'est pas déjà actif pour éviter
        // le cycle focus → keyboard.show() qui "avale" le prochain keystroke physique
        if (document.activeElement !== mf) {
          requestAnimationFrame(() => mf?.focus());
        }
      }
    };

    document.addEventListener("pointerdown", handleGlobalPointerDown, {
      capture: true,
    });

    return () => {
      document.removeEventListener("pointerdown", handleGlobalPointerDown, {
        capture: true,
      });
      mf.removeEventListener("focus", handleFocus);
      mf.removeEventListener("blur", handleBlur);
      if (keyboard) {
        keyboard.removeEventListener?.(
          "geometrychange",
          checkKeyboardVisibility,
        );
        // === LA MAGIE ANTI-FANTÔME EST ICI ===
        keyboard.hide();
      }
    };
  }, []);

  // === 2. CONFIGURATION DU CLAVIER (CORRIGÉE POUR NOUVELLE API MATHLIVE) ===
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    // Options générales du champ de saisie
    mf.setOptions({
      smartMode: true,
      smartFence: true,
    });

    // Configuration globale du clavier virtuel
    const keyboard = (window as any).mathVirtualKeyboard;
    if (keyboard) {
      // On écrase les onglets par défaut (123, abc, etc.) avec NOTRE clavier personnalisé
      keyboard.layouts = [
        {
          label: "Maths",
          rows: [
            // Rangée 1 : 7-9, opérations, parenthèses, suppr
            [
              { label: "7", key: "7" },
              { label: "8", key: "8" },
              { label: "9", key: "9" },
              { latex: "\\frac{#@}{#?}", label: "/" },
              { latex: "e^{#0}", label: "eˣ" },
              { label: "(", key: "(" },
              { label: ")", key: ")" },
              {
                command: 'performWithFeedback("deleteBackward")',
                label: "⌫",
                class: "action",
              },
            ],
            // Rangée 2 : 4-6, +/-, fraction, puissance, racine
            [
              { label: "4", key: "4" },
              { label: "5", key: "5" },
              { label: "6", key: "6" },
              { label: "×", latex: "\\times" },
              { latex: "\\ln(#0)", label: "ln" },
              { latex: "[", label: "[" },
              { latex: "]", label: "]" },
              { latex: "\\lim_{x \\to #?}", label: "lim" },
            ],
            // Rangée 3 : 1-3, point, égal, constantes
            [
              { label: "1", key: "1" },
              { label: "2", key: "2" },
              { label: "3", key: "3" },
              { label: "+", key: "+" },
              { latex: "\\sqrt{#0}", label: "√" },
              { latex: "#0^{#?}", label: "xⁿ" },
              { latex: "\\pi", label: "π" },
              { latex: "\\left|#0\\right|", label: "|x|" },
            ],
            // Rangée 4 : 0, variables, fonctions, fermer clavier
            [
              { label: "0", key: "0" },
              { label: ".", key: "." },
              { latex: "\\infty", label: "∞" },
              { label: "-", key: "-" },
              { label: "x", key: "x" },
              { label: "y", key: "y" },
              { label: "n", key: "n" },

              {
                command: ["hideVirtualKeyboard"],
                label: "🔽",
                class: "action",
              },
            ],
          ],
        },
      ];
    }

    const handleInput = (evt: Event) => {
      onChange((evt.target as any).value);
    };

    mf.addEventListener("input", handleInput);

    return () => {
      mf.removeEventListener("input", handleInput);
    };
  }, [onChange]);

  // Synchronisation valeur externe -> interne
  useEffect(() => {
    const mf = mfRef.current;
    if (mf && mf.value !== value) {
      mf.value = value;
    }
  }, [value]);

  useEffect(() => {
    const mf = mfRef.current;
    if (mf) mf.readOnly = disabled;
  }, [disabled]);

  return (
    <div className={className}>
      <math-field
        ref={mfRef}
        inputMode="none"
        math-virtual-keyboard-policy="manual"
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "0.5rem",
          border: disabled ? "1px solid #e2e8f0" : "1px solid #cbd5e1",
          backgroundColor: disabled ? "#f8fafc" : "white",
          fontSize: "1.2rem",
          outline: "none",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          touchAction: "manipulation",
        }}
      >
        {value}
      </math-field>

      <style jsx global>{`
        /* 1. Couleur du texte DANS la zone de saisie */
        math-field {
          color: #0f172a; /* Texte foncé */
        }

        math-field:focus-within {
          outline: 2px solid #6366f1;
          border-color: transparent;
        }

        /* 2. Couleurs DU CLAVIER VIRTUEL (Forcé sur la racine du document) */
        :root {
          --keyboard-background: #f1f5f9;
          --keycap-background: #ffffff;
          --keycap-text: #1e293b; /* Forcer le texte des touches en foncé */
          --keycap-text-hover: #000000;
          --keycap-secondary-text: #64748b;
        }
      `}</style>
    </div>
  );
};
