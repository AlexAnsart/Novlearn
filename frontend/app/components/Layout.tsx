'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { SidebarIcon } from './SidebarIcon';
import { User, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  isFullScreen?: boolean;
}

export function Layout({ children, isFullScreen = false }: LayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isHome = pathname === '/';
  const isProgress = pathname === '/progression';
  const isClasses = pathname === '/classes';
  const isTraining = pathname === '/entrainement';
  const isSettings = pathname === '/parametres';
  const isAccount = pathname === '/compte';

  const sidebarContent = (
    <>
      <SidebarIcon
        emoji={<Home className="w-6 h-6" />}
        active={isHome}
        onClick={() => router.push('/')}
      />
      <SidebarIcon
        emoji="📊"
        active={isProgress}
        onClick={() => router.push('/progression')}
      />
      <SidebarIcon
        emoji="📚"
        active={isClasses}
        onClick={() => router.push('/classes')}
      />
      <SidebarIcon
        emoji="🏋️"
        active={isTraining}
        onClick={() => router.push('/entrainement')}
      />
      <div className="flex-1" />
      <SidebarIcon
        emoji="⚙️"
        active={isSettings}
        onClick={() => router.push('/parametres')}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col">
      {/* Desktop Layout */}
      {!isMobile && (
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-24 bg-slate-900/60 backdrop-blur-sm p-4 flex flex-col items-center gap-6 pt-8">
            {sidebarContent}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header - Masqué en mode plein écran */}
            {!isFullScreen && (
              <div className="p-8 flex items-center justify-between">
                {/* Logo plus petit pour la page de progression */}
                <div className={isProgress ? "scale-75 origin-left" : ""}>
                  <Logo />
                </div>

                {/* User Profile */}
                {user ? (
                  <button
                    onClick={() => router.push('/compte')}
                    className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg hover:bg-slate-700/60 transition-all cursor-pointer relative"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    {/* Badge de notification pour demandes d'amis - à implémenter avec les données réelles */}
                    <span
                      className="text-white"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                        fontSize: "1.125rem",
                      }}
                    >
                      {profile?.first_name && profile?.last_name
                        ? `${profile.first_name.toUpperCase()} ${profile.last_name.toUpperCase()}`
                        : profile?.first_name?.toUpperCase() || user.email?.split('@')[0].toUpperCase() || 'UTILISATEUR'}
                    </span>
                  </button>
                ) : !loading ? (
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg hover:bg-slate-700/60 transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <span
                      className="text-white"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                        fontSize: "1.125rem",
                      }}
                    >
                      Se connecter
                    </span>
                  </button>
                ) : null}
              </div>
            )}

            {/* Central Area */}
            {children}
          </div>
        </div>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <div className="flex flex-col flex-1">
          {/* Header - Logo only */}
          {!isFullScreen && (
            <div className="p-6 flex items-center justify-center">
              <div className={isProgress ? "scale-75" : ""}>
                <Logo />
              </div>
            </div>
          )}

          {/* Central Area */}
          <div className={`flex-1 ${!isFullScreen ? 'pb-24' : ''}`}>
            {children}
          </div>

          {/* Bottom Navigation Bar */}
          {!isFullScreen && (
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md p-4 flex items-center justify-around gap-4 border-t border-slate-800/50">
              {sidebarContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

