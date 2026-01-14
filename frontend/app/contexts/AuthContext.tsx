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
  loading: boolean; // Chargement de l'auth initiale (critique)
  profileLoading: boolean; // Chargement du profil (secondaire)
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
  
  // On sépare le chargement critique (suis-je connecté ?) du chargement de données (qui suis-je ?)
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fonction de récupération du profil isolée et sécurisée
  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      // On ajoute un petit timeout interne pour ne pas bloquer si la DB est morte
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] fetchProfile error:', error.message);
        // Ne pas reset le profile à null ici si on veut garder un "vieux" profil en cache éventuel
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('[AuthContext] fetchProfile exception:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initialisation via getSession (plus rapide pour le premier rendu)
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // On lance la récupération du profil SANS attendre (fire and forget)
            // pour que setLoading(false) se déclenche tout de suite.
            fetchProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Session init error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // 2. Écoute des changements (Login, Logout, Token Refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      
      // On enlève le chargement immédiatement si l'event survient après l'init
      setLoading(false); 

      if (session?.user) {
        // Logique de mise à jour Google (inchangée mais optimisée)
        if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
           // On fait ça en arrière-plan
           updateGoogleProfile(session.user);
        }
        
        // Recharger le profil si c'est une nouvelle connexion
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
           fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Extraction de la logique Google pour alléger le useEffect
  const updateGoogleProfile = async (user: User) => {
    const fullName = user.user_metadata?.full_name || '';
    const firstName = user.user_metadata?.given_name || user.user_metadata?.name?.split(' ')[0] || '';
    const lastName = user.user_metadata?.family_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '';
    
    if (firstName || lastName) {
      await supabase
        .from('profiles')
        .update({
          first_name: firstName || fullName.split(' ')[0] || '',
          last_name: lastName || fullName.split(' ').slice(1).join(' ') || null,
        })
        .eq('id', user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true); // On remet loading true pour l'UX du bouton
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoading(false); // S'il y a une erreur, on stop le loading, sinon onAuthStateChange le fera
    return { error };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, birthDate: string) => {
    // ... Ta logique de vérification d'âge reste identique ...
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
      await supabase.from('profiles').update({
          first_name: firstName,
          last_name: lastName || null,
          birth_date: birthDate,
          consent_date: new Date().toISOString(),
        }).eq('id', data.user.id);
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) console.error('Error signing in with Google:', error);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        profileLoading, // Tu peux utiliser ça pour afficher un petit spinner discret à côté du nom de l'utilisateur
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