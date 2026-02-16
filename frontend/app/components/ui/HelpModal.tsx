import { HelpCircle, X } from "lucide-react";
import React from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* En-tête fixe */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-indigo-50/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-indigo-700">
            <HelpCircle className="w-5 h-5" />
            <h3 className="font-bold">Comment répondre ?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu avec scroll si nécessaire */}
        <div className="p-6 space-y-5 text-slate-600 text-sm overflow-y-auto">
          <p>
            Bienvenue dans l'interface d'exercice ! Voici quelques astuces pour
            saisir vos réponses mathématiques :
          </p>

          {/* Section 1 : Formats de réponses */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
              Format des réponses
            </h4>
            <ul className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-500 mt-0.5">•</span>
                <span><strong>Clavier virtuel :</strong> Un clavier scientifique apparaît en bas de l'écran lorsque vous cliquez sur un champ. Utilisez-le pour trouver tous les symboles mathématiques.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-500 mt-0.5">•</span>
                <span><strong>Intervalles :</strong> Utilisez les crochets <kbd className="bg-white border rounded px-1 text-xs">[</kbd> et <kbd className="bg-white border rounded px-1 text-xs">]</kbd>. Ex: <code className="text-xs bg-white border px-1 rounded">[1; +\infty[</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-500 mt-0.5">•</span>
                <span><strong>Plusieurs solutions :</strong> S'il y a plusieurs réponses à une équation, séparez-les par un point-virgule <kbd className="bg-white border rounded px-1 text-xs">;</kbd>. Ex: <code className="text-xs bg-white border px-1 rounded">-2 ; 5</code></span>
              </li>
            </ul>
          </div>
          
          {/* Section 2 : Raccourcis clavier */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
              Raccourcis clavier
            </h4>
            <ul className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-500 mt-0.5">•</span>
                <span><strong>Fractions :</strong> Utilisez la touche <kbd className="bg-white border rounded px-1 text-xs">/</kbd>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-500 mt-0.5">•</span>
                <span><strong>Puissances :</strong> Utilisez <kbd className="bg-white border rounded px-1 text-xs">^</kbd>. Ex: tapez <code>x^2</code> pour $x^2$.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-500 mt-0.5">•</span>
                <span><strong>Naviguer :</strong> Utilisez les flèches directionnelles <kbd className="bg-white border rounded px-1 text-xs">←</kbd> <kbd className="bg-white border rounded px-1 text-xs">→</kbd> pour sortir d'une fraction ou d'une puissance.</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="font-medium text-slate-800 mb-1">Un doute ?</p>
            <p>
              Vous avez <strong>deux essais</strong> pour les questions ouvertes. 
              Si vous vous trompez au premier essai, un indice pourrait apparaître !
            </p>
          </div>
        </div>

        {/* Pied de page fixe */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            J'ai compris !
          </button>
        </div>
      </div>
    </div>
  );
};