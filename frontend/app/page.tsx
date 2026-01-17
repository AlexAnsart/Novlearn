'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from './components/Layout';
import { ActionButton } from './components/ActionButton';
import { MathExercise } from './components/MathExercise';
import { useAuth } from './contexts/AuthContext';
import { FeedbackModal } from './components/ui/FeedbackModal'; // <--- IMPORT 1
import { MessageSquare } from 'lucide-react'; // <--- IMPORT 2

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // État pour la modale de feedback
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false); // <--- AJOUT STATE

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleStartTraining = () => {
    router.push('/exercices'); 
  };

  return (
    <Layout>
      {/* 1. La Modale (Invisible par défaut) */}
      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        // On ne passe pas d'exerciseId ni de titre -> Feedback Général
      />

      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <div className="max-w-4xl w-full space-y-8">
          
          {/* Math Exercise with S'entraîner button */}
          <div
            onClick={handleStartTraining}
            className="cursor-pointer transform transition-transform hover:scale-105"
          >
            <MathExercise />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <ActionButton variant="primary" icon="⚔️" onClick={() => router.push('/duel')}>
              1VS1
            </ActionButton>

            <ActionButton variant="secondary" icon="📚" onClick={() => router.push('/cours')}>
              Réviser le cours
            </ActionButton>
          </div>
        </div>
      </div>

      {/* 2. Bouton Flottant "Feedback" (En bas à droite) */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-white text-indigo-600 rounded-full shadow-xl hover:bg-indigo-50 hover:shadow-2xl hover:scale-110 transition-all duration-300 z-40 border border-indigo-100 group"
        title="Donner votre avis ou signaler un bug"
      >
        <MessageSquare className="w-6 h-6" />
        
        {/* Tooltip au survol (Optionnel, pour le style) */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Un avis ? Un bug ?
        </span>
      </button>

    </Layout>
  );
}