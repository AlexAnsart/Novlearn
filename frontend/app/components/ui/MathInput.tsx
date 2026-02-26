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
        inputMode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
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

  // === 1. LOGIQUE DE FOCUS (PC & VIRTUAL KEYBOARD) - INTACTE ===
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    const checkKeyboardVisibility = () => {
      const keyboard = (window as any).mathVirtualKeyboard;
      if (keyboard) {
        isKeyboardVisibleRef.current = keyboard.visible;
      }
    };

    const handleBlur = () => {
      checkKeyboardVisibility();
      if (isKeyboardVisibleRef.current) {
        setTimeout(() => {
          // IMPORTANT: On ne redonne le focus que si l'élément actif est toujours le clavier 
          // ou si aucun autre input n'a pris le focus entre temps
          if (isKeyboardVisibleRef.current && mf && document.activeElement?.tagName !== 'MATH-FIELD') {
            mf.focus();
          }
        }, 0);
      }
    };

    const keyboard = (window as any).mathVirtualKeyboard;
    if (keyboard) {
      keyboard.addEventListener?.("geometrychange", checkKeyboardVisibility);
    }

    mf.addEventListener("blur", handleBlur);

    const handleGlobalPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      
      // Vérifier si le clic est sur le clavier
      const isKeyboardClick = target.closest(".ML__keyboard") || 
                              target.closest('[part="keyboard"]');

      // IMPORTANT : On ne déclenche le refocus que si cet input précis est l'élément "actif"
      // ou si l'utilisateur clique sur le clavier virtuel
      if (isKeyboardClick && mf === (window as any).mathVirtualKeyboard.targetElement) {
        isKeyboardVisibleRef.current = true;
        e.preventDefault();
        requestAnimationFrame(() => mf?.focus());
      }
    };

    // On utilise l'option { capture: true } pour intercepter le clic avant les autres
    document.addEventListener("pointerdown", handleGlobalPointerDown, { capture: true });

    return () => {
      document.removeEventListener("pointerdown", handleGlobalPointerDown, { capture: true });
      mf.removeEventListener("blur", handleBlur);
      if (keyboard) {
        keyboard.removeEventListener?.("geometrychange", checkKeyboardVisibility);
      }
    };
  }, []);

  // === 2. CONFIGURATION DU CLAVIER ===
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    mf.setOptions({
      smartMode: true,
      virtualKeyboardMode: "manual", // On garde ton mode manuel

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
            { label: "x", key: "x", class: "font-bold text-blue-500" }, 
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
            { latex: "\\frac{#@}{#?}", label: "▢/▢" }, 
            { latex: "#@^{#?}", label: "▢^n" }, 
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
            { latex: "\\lim_{x \\to \\infty}", label: "lim" }, 
            { class: "separator w-5" },
            { command: 'performWithFeedback("deleteBackward")', label: "⌫" }, 
            {
              command: 'performWithFeedback("commit")',
              label: "OK",
              class: "action font-bold",
            },
          ],
        ],
      },
    });

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
        inputMode="none" // <--- LA MAGIE POUR MOBILE (bloque le clavier natif)
        math-virtual-keyboard-policy="manual" // <--- Confirme à MathLive ton mode manuel
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "0.5rem",
          border: disabled ? "1px solid #e2e8f0" : "1px solid #cbd5e1",
          backgroundColor: disabled ? "#f8fafc" : "white",
          fontSize: "1.2rem",
          outline: "none",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          touchAction: "manipulation", // <--- Empêche les bugs de défilement sur mobile
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