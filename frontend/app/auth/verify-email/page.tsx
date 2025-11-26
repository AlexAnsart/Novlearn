'use client';

import { Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-blue-400" />
          </div>
          
          <h2
            className="text-3xl md:text-4xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent mb-4"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Vérifiez votre email
          </h2>
          
          <p
            className="text-blue-200 mb-6"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            Nous avons envoyé un lien de confirmation à votre adresse email.
            Cliquez sur le lien pour activer votre compte.
          </p>
          
          <div className="bg-blue-900/20 rounded-xl p-4 mb-6">
            <p
              className="text-blue-300 text-sm"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              💡 Vérifiez aussi votre dossier spam si vous ne recevez pas l'email.
            </p>
          </div>
          
          <Link
            href="/auth/login"
            className="inline-block px-8 py-4 rounded-3xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_8px_0_0_rgb(29,78,216),0_13px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_10px_0_0_rgb(29,78,216),0_15px_25px_rgba(37,99,235,0.4)] transform transition-all duration-200 hover:scale-105"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.125rem' }}
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

