import type { Metadata } from 'next';
import { LoginForm } from '@/app/components/LoginForm'; 

export const metadata: Metadata = {
  title: 'Connexion | NovLearn',
  description: 'Connectez-vous pour accéder à vos exercices et suivre votre progression.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      {/* On appelle le composant Client qui contient toute la logique */}
      <LoginForm />
    </div>
  );
}