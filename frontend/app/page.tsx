'use client';

import { useRouter } from 'next/navigation';
import { Layout } from './components/Layout';
import { ActionButton } from './components/ActionButton';
import { MathExercise } from './components/MathExercise';

export default function Home() {
  const router = useRouter();

  const handleStartTraining = () => {
    router.push('/entrainement');
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
            <MathExercise />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <ActionButton variant="primary" icon="⚔️">
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
