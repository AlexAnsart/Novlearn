import { useState, useEffect } from "react";
import { Logo } from "./components/Logo";
import { ActionButton } from "./components/ActionButton";
import { SidebarIcon } from "./components/SidebarIcon";
import { MathExercise } from "./components/MathExercise";
import { User } from "lucide-react";

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () =>
      window.removeEventListener("resize", checkMobile);
  }, []);

  const sidebarContent = (
    <>
      <SidebarIcon emoji="📚" active />
      <SidebarIcon emoji="📊" />
      <SidebarIcon emoji="🏋️" />
      <div className="flex-1" />
      <SidebarIcon emoji="⚙️" />
    </>
  );

  return (
    <>
      {/* Police Fredoka de Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col">
        {/* Desktop Layout */}
        {!isMobile && (
          <div className="flex flex-1">
            {/* Sidebar */}
            <div className="w-24 bg-slate-900/60 backdrop-blur-sm p-4 flex flex-col items-center gap-6 pt-32">
              {sidebarContent}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-8 flex items-center justify-between">
                <Logo />

                {/* User Profile */}
                <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
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
                    GOTAGA
                  </span>
                </div>
              </div>

              {/* Central Area */}
              <div className="flex-1 flex items-center justify-center px-8 pb-8">
                <div className="max-w-4xl w-full space-y-8">
                  {/* Math Exercise with S'entraîner button */}
                  <MathExercise />

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-8 flex-wrap">
                    <ActionButton variant="primary" icon="⚔️">
                      1VS1
                    </ActionButton>

                    <ActionButton variant="secondary" icon="📚">
                      Réviser le cours
                    </ActionButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Layout (iPhone 16) */}
        {isMobile && (
          <div className="flex flex-col flex-1">
            {/* Header - Logo only */}
            <div className="p-6 flex items-center justify-center">
              <Logo />
            </div>

            {/* Central Area */}
            <div className="flex-1 flex items-center justify-center px-4 pb-24">
              <div className="w-full max-w-md space-y-6">
                {/* Math Exercise with S'entraîner button */}
                <MathExercise />

                {/* Action Buttons */}
                <div className="flex flex-col items-center justify-center gap-4">
                  <ActionButton variant="primary" icon="⚔️">
                    1VS1
                  </ActionButton>

                  <ActionButton variant="secondary" icon="📚">
                    Réviser le cours
                  </ActionButton>
                </div>
              </div>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md p-4 flex items-center justify-around gap-4 border-t border-slate-800/50">
              {sidebarContent}
            </div>
          </div>
        )}
      </div>
    </>
  );
}