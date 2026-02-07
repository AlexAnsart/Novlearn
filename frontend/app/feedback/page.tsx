'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase'; // Vérifie que le chemin est bon selon ton projet
import { useAuth } from '@/app/contexts/AuthContext';
import { Layout } from '@/app/components/Layout';
import { Loader2, Trash2, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  created_at: string;
  message: string;
  category: string;
  difficulty_rating?: number;
  user_id: string | null;
  profiles?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export default function FeedbackDashboard() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      fetchFeedbacks();
    }
  }, [user, authLoading, router]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      // On récupère les feedbacks + les infos du profil lié
      const { data, error } = await supabase
        .from('feedbacks')
        .select(`
          *,
          profiles:user_id (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Erreur chargement feedbacks:', error);
      toast.error("Impossible de charger les feedbacks. Vérifiez vos droits RLS.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce feedback ?')) return;

    try {
      const { error } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedbacks(prev => prev.filter(f => f.id !== id));
      toast.success('Feedback supprimé');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'feature': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'content': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  if (authLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <Layout>
      <div className="flex-1 px-4 md:px-8 pb-8 overflow-y-auto bg-slate-900">
        <div className="max-w-6xl mx-auto pt-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <MessageSquare className="text-indigo-500" />
                Dashboard Feedbacks
              </h1>
              <p className="text-slate-400 mt-1">Gestion des retours utilisateurs</p>
            </div>
            <button 
              onClick={fetchFeedbacks}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Liste */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">Aucun feedback pour le moment.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {feedbacks.map((item) => (
                <div key={item.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm hover:border-slate-600 transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-slate-500 text-sm">
                        {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-200 text-lg mb-4 whitespace-pre-wrap">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-700/50 pt-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                        {item.profiles?.first_name?.[0] || '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-medium">
                          {item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Anonyme'}
                        </span>
                        {item.profiles?.email && (
                          <span className="text-slate-500 text-xs">{item.profiles.email}</span>
                        )}
                      </div>
                    </div>
                    
                    {item.difficulty_rating && (
                      <div className="text-slate-400 text-sm">
                        Difficulté notée : <span className="text-white font-bold">{item.difficulty_rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}