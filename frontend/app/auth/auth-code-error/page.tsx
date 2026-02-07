'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/60 backdrop-blur-md p-8 rounded-3xl border border-red-500/30 text-center">
        
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
          <AlertTriangle size={32} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Fredoka', sans-serif" }}>
          Lien invalide ou expiré
        </h1>
        
        <p className="text-slate-400 mb-8">
          Le lien de connexion que vous avez utilisé ne fonctionne plus. Cela arrive si :
        </p>
        
        <ul className="text-left text-slate-300 space-y-2 mb-8 bg-slate-900/50 p-4 rounded-xl text-sm">
          <li>• Le lien a déjà été utilisé.</li>
          <li>• Le lien a expiré (il est valable 1h).</li>
          <li>• Vous avez demandé un nouveau lien entre temps.</li>
        </ul>

        <Link 
          href="/auth/login" 
          className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          Retour à la connexion <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}