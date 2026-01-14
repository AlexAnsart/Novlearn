'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  birth_date: string;
  created_at: string;
  consent_date: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, birthDate: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] fetchProfile error:', error.message);
        setProfile(null);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('[AuthContext] fetchProfile exception:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Timeout de sécurité pour l'initialisation
    const initTimeout = setTimeout(() => {
      console.warn('[AuthContext] Initialization timeout, forcing loading to false');
      setLoading(false);
    }, 10000);
    
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      clearTimeout(initTimeout);
      
      if (error) {
        console.error('[AuthContext] getSession error:', error.message);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Si c'est une connexion Google OAuth, récupérer le prénom/nom depuis les metadata
        if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
          const fullName = session.user.user_metadata?.full_name || '';
          const firstName = session.user.user_metadata?.given_name || session.user.user_metadata?.name?.split(' ')[0] || '';
          const lastName = session.user.user_metadata?.family_name || session.user.user_metadata?.name?.split(' ').slice(1).join(' ') || '';
          
          // Mettre à jour le profil avec les données Google si disponibles
          if (firstName || lastName) {
            await supabase
              .from('profiles')
              .update({
                first_name: firstName || fullName.split(' ')[0] || '',
                last_name: lastName || fullName.split(' ').slice(1).join(' ') || null,
              })
              .eq('id', session.user.id);
          }
        }
        
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, birthDate: string) => {
    // Vérifier l'âge
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (age < 15) {
      return { error: { message: 'Vous devez avoir au moins 15 ans pour créer un compte.' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate,
        },
      },
    });

    if (!error && data.user) {
      // Mettre à jour le profil avec les données complètes
      await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName || null,
          birth_date: birthDate,
          consent_date: new Date().toISOString(),
        })
        .eq('id', data.user.id);
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

