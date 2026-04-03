"use client";

import { Trash2 } from "lucide-react";

interface DeleteAccountModalProps {
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteAccountModal({
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteAccountModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <h3
            className="text-white text-2xl font-bold mb-4"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Supprimer votre compte ?
          </h3>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Êtes-vous sûr de vouloir faire ça ? <br />
            <span className="text-red-400 font-semibold">
              Cette action est irréversible.
            </span>{" "}
            <br />
            Toutes vos données (progression, amis, statistiques) seront
            définitivement effacées.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Suppression en cours...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Oui, supprimer définitivement
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
