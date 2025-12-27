'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from './components/Layout';
import { ActionButton } from './components/ActionButton';
import { MathExercise } from './components/MathExercise';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase'; // Important : Import de Supabase

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // On stocke l'ID de l'exercice pour savoir où rediriger
  const [exerciseId, setExerciseId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Récupérer un exercice valide pour le bouton "S'entraîner"
  useEffect(() => {
    const fetchExerciseId = async () => {
      // On prend le dernier exercice créé
      const { data } = await supabase
        .from('exercises')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (data) {
        setExerciseId(data.id);
      }
    };

    if (user) fetchExerciseId();
  }, [user]);

  const handleStartTraining = () => {
    if (exerciseId) {
      // Si on a trouvé un exercice, on charge celui-là précisément
      router.push(`/exercices?id=${exerciseId}`);
    } else {
      // Sinon on va sur la page par défaut (qui essaiera d'en trouver un)
      router.push('/exercices');
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Math Exercise with S'entraîner button */}
          <div
            onClick={handleStartTraining}
            className="cursor-pointer transform transition-transform hover:scale-105"
          >
            {/* Note: Pour l'instant on affiche la carte statique sur l'accueil
                car tu n'as pas demandé de charger le contenu ici, juste que ça marche. */}
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
    </Layout>
  );
}