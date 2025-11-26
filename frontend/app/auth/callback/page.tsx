'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          router.push('/auth/login?error=callback_error');
          return;
        }

        if (data.session) {
          router.push('/');
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/auth/login?error=callback_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2
          className="text-2xl text-white mb-4"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
        >
          Connexion en cours...
        </h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}

