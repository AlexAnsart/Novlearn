'use client';

import React, { useState } from 'react';
import { X, Send, Loader2, AlertTriangle, Lightbulb, MessageSquare, Bug } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId?: number; // Optionnel : si lié à un exercice précis
  exerciseTitle?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isOpen, 
  onClose, 
  exerciseId,
  exerciseTitle 
}) => {
  const [category, setCategory] = useState('content_error');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      // Récupération de l'utilisateur courant (si connecté)
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('feedbacks').insert({
        exercise_id: exerciseId,
        user_id: user?.id,
        category,
        message,
      });

      if (error) throw error;

      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setMessage('');
        onClose();
      }, 2000); // Fermeture auto après 2s

    } catch (err) {
      console.error('Erreur feedback:', err);
      alert("Erreur lors de l'envoi du feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Merci !</h3>
          <p className="text-slate-500">Votre retour a bien été envoyé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Un problème ?</h3>
            {exerciseTitle && (
              <p className="text-xs text-slate-500 truncate max-w-[200px]">
                Sur : {exerciseTitle}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Choix Catégorie */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCategory('content_error')}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all
                ${category === 'content_error' 
                  ? 'bg-red-50 border-red-200 text-red-600' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <AlertTriangle className="w-5 h-5 mb-1" />
              Erreur
            </button>
            <button
              type="button"
              onClick={() => setCategory('suggestion')}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all
                ${category === 'suggestion' 
                  ? 'bg-amber-50 border-amber-200 text-amber-600' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <Lightbulb className="w-5 h-5 mb-1" />
              Idée
            </button>
            <button
              type="button"
              onClick={() => setCategory('other')}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all
                ${category === 'other' 
                  ? 'bg-blue-50 border-blue-200 text-blue-600' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <Bug className="w-5 h-5 mb-1" />
              Bug
            </button>
          </div>

          {/* Message */}
          <div>
            <textarea
              className="w-full h-32 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-none text-sm text-slate-700 placeholder:text-slate-400"
              placeholder={category === 'content_error' ? "Ex: La réponse à la question 2 est fausse..." : "Dites-nous tout..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  Envoyer
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};