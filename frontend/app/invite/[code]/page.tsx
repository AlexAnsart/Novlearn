'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { friendsApi } from '../../lib/api';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function addFriend() {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const code = params.code as string;
      if (!code) {
        setStatus('error');
        setMessage('Code d\'invitation invalide');
        return;
      }

      try {
        const result = await friendsApi.addFriendByCode(code);
        setStatus('success');
        setMessage(result.message);
        
        // Redirect to friends page after 2 seconds
        setTimeout(() => {
          router.push('/compte?tab=friends');
        }, 2000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Erreur lors de l\'ajout de l\'ami');
      }
    }

    addFriend();
  }, [params.code, user, router]);

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-md w-full">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] text-center">
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <h2 
                  className="text-white text-2xl mb-2"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  Ajout en cours...
                </h2>
                <p 
                  className="text-blue-200"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  Patientez un instant
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 
                  className="text-white text-2xl mb-2"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  Succès !
                </h2>
                <p 
                  className="text-green-200"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  {message}
                </p>
                <p 
                  className="text-blue-200 mt-4 text-sm"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 400 }}
                >
                  Redirection vers votre profil...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 
                  className="text-white text-2xl mb-2"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  Erreur
                </h2>
                <p 
                  className="text-red-200 mb-6"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  {message}
                </p>
                <button
                  onClick={() => router.push('/compte')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white transition-all hover:scale-105"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  Retour au profil
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
