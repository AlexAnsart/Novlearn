"use client";

import "mathlive";
import React, { useEffect, useRef } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        ref?: React.RefObject<any>;
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

  // Maintenir le focus lors de l'utilisation du clavier virtuel MathLive
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    // Écouter les changements de visibilité du clavier virtuel via l'API MathLive
    const checkKeyboardVisibility = () => {
      const keyboard = (window as any).mathVirtualKeyboard;
      if (keyboard) {
        isKeyboardVisibleRef.current = keyboard.visible;
      }
    };

    // Restaurer le focus si le math-field le perd pendant que le clavier virtuel est visible
    const handleBlur = () => {
      checkKeyboardVisibility();
      if (isKeyboardVisibleRef.current) {
        // Petit délai pour laisser l'événement se terminer
        setTimeout(() => {
          checkKeyboardVisibility();
          if (isKeyboardVisibleRef.current && mf) {
            mf.focus();
          }
        }, 0);
      }
    };

    // Observer le clavier virtuel MathLive
    const keyboard = (window as any).mathVirtualKeyboard;
    if (keyboard) {
      keyboard.addEventListener?.("geometrychange", checkKeyboardVisibility);
    }

    mf.addEventListener("blur", handleBlur);

    // Empêcher la perte de focus sur les clics du clavier (si détectables)
    const handleGlobalPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const root = target.getRootNode();

      // Vérifier si le clic vient du shadow DOM du clavier ou d'éléments connus
      const isKeyboardClick =
        target.closest(".ML__keyboard") ||
        target.closest('[part="keyboard"]') ||
        target.closest('[part="virtual-keyboard-toggle"]') ||
        target.tagName?.includes("MATH") ||
        (root instanceof ShadowRoot && root.host?.tagName?.includes("MATH"));

      if (isKeyboardClick) {
        isKeyboardVisibleRef.current = true;
        e.preventDefault();
        requestAnimationFrame(() => mf?.focus());
      }
    };

    document.addEventListener("pointerdown", handleGlobalPointerDown, {
      capture: true,
    });

    return () => {
      document.removeEventListener("pointerdown", handleGlobalPointerDown, {
        capture: true,
      });
      mf.removeEventListener("blur", handleBlur);
      if (keyboard) {
        keyboard.removeEventListener?.(
          "geometrychange",
          checkKeyboardVisibility,
        );
      }
    };
  }, []);

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    // --- CONFIGURATION DU CLAVIER ---
    mf.setOptions({
      smartMode: true,
      virtualKeyboardMode: "manual", // ou 'onfocus' pour qu'il s'ouvre direct sur mobile

      // Définition des touches personnalisées
      virtualKeyboardLayout: {
        rows: [
          // Rangée 1 : Chiffres 7-9 et Opérations de base
          [
            { label: "7", key: "7" },
            { label: "8", key: "8" },
            { label: "9", key: "9" },
            { label: "÷", latex: "\\div" },
            { label: "×", latex: "\\times" },
            { class: "separator w-5" },
            { label: "x", key: "x", class: "font-bold text-blue-500" }, // Variable x mise en avant
            { label: "y", key: "y" },
          ],
          // Rangée 2 : Chiffres 4-6 et Fonctions usuelles
          [
            { label: "4", key: "4" },
            { label: "5", key: "5" },
            { label: "6", key: "6" },
            { label: "-", key: "-" },
            { label: "+", key: "+" },
            { class: "separator w-5" },
            { latex: "\\frac{#@}{#?}", label: "▢/▢" }, // Fraction
            { latex: "#@^{#?}", label: "▢^n" }, // Puissance
          ],
          // Rangée 3 : Chiffres 1-3 et Fonctions Lycée
          [
            { label: "1", key: "1" },
            { label: "2", key: "2" },
            { label: "3", key: "3" },
            { latex: "\\sqrt{#0}", label: "√" },
            { latex: "\\ln(#0)", label: "ln" },
            { class: "separator w-5" },
            { latex: "\\pi", label: "π" },
            { latex: "\\infty", label: "∞" },
          ],
          // Rangée 4 : 0, Virgule, Validation
          [
            { label: "0", key: "0" },
            { label: ",", key: "," },
            { label: "=", key: "=" },
            { latex: "e^{#0}", label: "e^x" },
            { latex: "\\lim_{x \\to \\infty}", label: "lim" }, // Raccourci limite
            { class: "separator w-5" },
            { command: 'performWithFeedback("deleteBackward")', label: "⌫" }, // Backspace
            {
              command: 'performWithFeedback("commit")',
              label: "OK",
              class: "action font-bold",
            },
          ],
        ],
      },
    });

    // Événements
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
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "0.5rem",
          border: disabled ? "1px solid #e2e8f0" : "1px solid #cbd5e1",
          backgroundColor: disabled ? "#f8fafc" : "white",
          fontSize: "1.2rem",
          outline: "none",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        }}
      >
        {value}
      </math-field>

      <style jsx global>{`
        math-field:focus-within {
          outline: 2px solid #6366f1;
          border-color: transparent;
        }
        /* Style des touches perso */
        .ML__keyboard {
          --keyboard-background: #f1f5f9;
          --key-background: white;
          --key-text: #334155;
        }
      `}</style>
    </div>
  );
};
