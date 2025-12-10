import { useState, useEffect } from "react";
import { Logo } from "./components/Logo";
import { ActionButton } from "./components/ActionButton";
import { SidebarIcon } from "./components/SidebarIcon";
import { MathExercise } from "./components/MathExercise";
import { ProgressPage } from "./components/ProgressPage";
import { AccountPage } from "./components/AccountPage";
import { CoursePage } from "./components/CoursePage";
import { TableVariationExercise } from "./components/TableVariationExercise";
import { ExponentialExercise } from "./components/ExponentialExercise";
import { ValidationResult } from "./components/ValidationResult";
import { User, Home } from "lucide-react";

type Tab = "home" | "progress" | "training" | "settings" | "account" | "course";
type ExerciseType = "table" | "exponential";
type ValidationStatus = "correct" | "partial" | "incorrect" | null;

export default function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<ExerciseType>("table");
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleStartTraining = () => {
    setActiveTab("training");
    setIsFullScreen(true);
    setCurrentExercise("table");
    setValidationStatus(null);
  };

  const handleValidate = (answers: string[], isCorrect: boolean, isPartial: boolean) => {
    if (isCorrect) {
      setValidationStatus("correct");
    } else if (isPartial) {
      setValidationStatus("partial");
    } else {
      setValidationStatus("incorrect");
    }
  };

  const handleSkip = () => {
    setCurrentExercise((prev) => (prev === "table" ? "exponential" : "table"));
    setValidationStatus(null);
  };

  const handleNewExercise = () => {
    setCurrentExercise((prev) => (prev === "table" ? "exponential" : "table"));
    setValidationStatus(null);
  };

  const sidebarContent = (
    <>
      <SidebarIcon
        emoji={<Home className="w-6 h-6" />}
        active={activeTab === "home"}
        onClick={() => {
          setActiveTab("home");
          setIsFullScreen(false);
          setValidationStatus(null);
        }}
      />
      <SidebarIcon
        emoji="📊"
        active={activeTab === "progress"}
        onClick={() => {
          setActiveTab("progress");
          setIsFullScreen(false);
          setValidationStatus(null);
        }}
      />
      <SidebarIcon
        emoji="🏋️"
        active={activeTab === "training"}
        onClick={() => {
          setActiveTab("training");
          setIsFullScreen(false);
          setValidationStatus(null);
        }}
      />
      <div className="flex-1" />
      <SidebarIcon
        emoji="⚙️"
        active={activeTab === "settings"}
        onClick={() => {
          setActiveTab("settings");
          setIsFullScreen(false);
          setValidationStatus(null);
        }}
      />
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
            <div className="w-24 bg-slate-900/60 backdrop-blur-sm p-4 flex flex-col items-center gap-6 pt-64">
              {sidebarContent}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Header - Masqué en mode plein écran */}
              {!isFullScreen && (
                <div className="p-8 flex items-center justify-between">
                  {/* Logo plus petit pour la page de progression */}
                  <div className={activeTab === "progress" ? "scale-75 origin-left" : ""}>
                    <Logo />
                  </div>

                  {/* User Profile */}
                  <button
                    onClick={() => setActiveTab("account")}
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
                      GOTAGA
                    </span>
                  </button>
                </div>
              )}

              {/* Central Area - Contenu dynamique selon l'onglet */}
              {activeTab === "home" && (
                <div className="flex-1 flex items-center justify-center px-8 pb-8">
                  <div className="max-w-4xl w-full space-y-8">
                    {/* Math Exercise with S'entraîner button */}
                    <div
                      onClick={handleStartTraining}
                      className="cursor-pointer transform transition-transform hover:scale-105"
                    >
                      <MathExercise />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-8 flex-wrap">
                      <ActionButton variant="primary" icon="⚔️">
                        1VS1
                      </ActionButton>

                      <ActionButton variant="secondary" icon="📚" onClick={() => setActiveTab("course")}>
                        Réviser le cours
                      </ActionButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode plein écran pour les exercices (Section Training) */}
              {activeTab === "training" && isFullScreen && (
                <div className="flex-1 flex flex-col">
                  {/* Header avec Logo et bouton "Vérifier le cours" */}
                  <div className="p-8 flex items-center justify-between">
                    <Logo />

                    <button
                      onClick={() => {
                        setActiveTab("course");
                        setIsFullScreen(false);
                      }}
                      className="relative px-8 py-4 rounded-3xl bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-[0_8px_0_0_rgb(109,40,217),0_13px_20px_rgba(147,51,234,0.3)] transform transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-[0_4px_0_0_rgb(109,40,217),0_6px_15px_rgba(147,51,234,0.3)] active:translate-y-1"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.125rem" }}
                    >
                      📚 Vérifier le cours
                    </button>
                  </div>

                  {/* Exercice */}
                  <div className="flex-1 flex items-center justify-center px-8 pb-8">
                    <div className="max-w-4xl w-full">
                      {currentExercise === "table" && (
                        <TableVariationExercise onValidate={handleValidate} onSkip={handleSkip} />
                      )}
                      {currentExercise === "exponential" && (
                        <ExponentialExercise onValidate={handleValidate} onSkip={handleSkip} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "progress" && <ProgressPage />}

              {activeTab === "account" && <AccountPage />}

              {activeTab === "course" && <CoursePage />}

              {activeTab === "training" && !isFullScreen && (
                <div className="flex-1 flex items-center justify-center">
                  <p
                    className="text-white"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.5rem" }}
                  >
                    🏋️ Section Entraînement - À venir
                  </p>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="flex-1 flex items-center justify-center">
                  <p
                    className="text-white"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.5rem" }}
                  >
                    ⚙️ Paramètres - À venir
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Layout (iPhone 16) */}
        {isMobile && (
          <div className="flex flex-col flex-1">
            {/* Header - Logo only */}
            {!isFullScreen && (
              <div className="p-6 flex items-center justify-center">
                <div className={activeTab === "progress" ? "scale-75" : ""}>
                  <Logo />
                </div>
              </div>
            )}

            {/* Central Area - Contenu dynamique selon l'onglet */}
            {activeTab === "home" && !isFullScreen && (
              <div className="flex-1 flex items-center justify-center px-4 pb-24">
                <div className="w-full max-w-md space-y-6">
                  {/* Math Exercise with S'entraîner button */}
                  <div onClick={handleStartTraining} className="cursor-pointer">
                    <MathExercise />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col items-center justify-center gap-4">
                    <ActionButton variant="primary" icon="⚔️">
                      1VS1
                    </ActionButton>

                    <ActionButton variant="secondary" icon="📚" onClick={() => setActiveTab("course")}>
                      Réviser le cours
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}

            {/* Mode plein écran pour les exercices (Section Training) */}
            {activeTab === "training" && isFullScreen && (
              <div className="flex-1 flex flex-col pb-24">
                {/* Header avec Logo et bouton "Vérifier le cours" */}
                <div className="p-4 flex items-center justify-between">
                  <Logo />

                  <button
                    onClick={() => {
                      setActiveTab("course");
                      setIsFullScreen(false);
                    }}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-lg"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                  >
                    📚 Vérifier le cours
                  </button>
                </div>

                {/* Exercice */}
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="w-full max-w-md">
                    {currentExercise === "table" && (
                      <TableVariationExercise onValidate={handleValidate} onSkip={handleSkip} />
                    )}
                    {currentExercise === "exponential" && (
                      <ExponentialExercise onValidate={handleValidate} onSkip={handleSkip} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "progress" && <ProgressPage />}

            {activeTab === "account" && <AccountPage />}

            {activeTab === "course" && <CoursePage />}

            {activeTab === "training" && !isFullScreen && (
              <div className="flex-1 flex items-center justify-center pb-24">
                <p
                  className="text-white"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.25rem" }}
                >
                  🏋️ Section Entraînement - À venir
                </p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="flex-1 flex items-center justify-center pb-24">
                <p
                  className="text-white"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.25rem" }}
                >
                  ⚙️ Paramètres - À venir
                </p>
              </div>
            )}

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md p-4 flex items-center justify-around gap-4 border-t border-slate-800/50">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Validation Result Overlay */}
        {validationStatus && <ValidationResult status={validationStatus} onNewExercise={handleNewExercise} />}
      </div>
    </>
  );
}