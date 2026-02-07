'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { Mail, ArrowLeft, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectTo = `${origin}/auth/callback?next=/auth/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo, });

      if (error) throw error;
      toast.success("Email envoyé ! Vérifiez votre boîte de réception.");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/60 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            Récupération
          </h1>
          <p className="text-slate-400 font-medium">
            Entrez votre email pour recevoir le lien de réinitialisation.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label className="block text-blue-200 mb-2 font-semibold">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900/40 backdrop-blur-sm rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-3xl bg-gradient-to-b from-blue-500 to-blue-700 text-white font-bold text-lg shadow-[0_8px_0_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            Envoyer le lien
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/auth/login" className="text-blue-300 hover:text-white flex items-center justify-center gap-2 transition-colors font-medium">
            <ArrowLeft size={18} /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}