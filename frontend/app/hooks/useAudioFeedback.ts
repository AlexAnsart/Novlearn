import { useCallback, useRef } from "react";

// Précharge un fichier audio pour éviter le délai au premier lancement
function preload(src: string, volume = 0.5): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const a = new Audio(src);
  a.volume = volume;
  return a;
}

export const useAudioFeedback = () => {
  const successAudio = useRef<HTMLAudioElement | null>(
    preload("/sounds/Correct.mp3"),
  );
  const errorAudio = useRef<HTMLAudioElement | null>(
    preload("/sounds/Fail.mp3"),
  );
  const slideAudio = useRef<HTMLAudioElement | null>(
    preload("/sounds/Slide.mp3"),
  );

  const isSoundEnabled = () =>
    localStorage.getItem("novlearn-sound") !== "false";

  const playAudio = useCallback((audio: HTMLAudioElement | null) => {
    if (!isSoundEnabled() || !audio) return;
    try {
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.warn("Audio bloqué par le navigateur :", err);
      });
    } catch (error) {
      console.error("Erreur lors de la lecture du son :", error);
    }
  }, []);

  const playSuccess = useCallback(
    () => playAudio(successAudio.current),
    [playAudio],
  );
  const playError = useCallback(
    () => playAudio(errorAudio.current),
    [playAudio],
  );
  const playSlide = useCallback(
    () => playAudio(slideAudio.current),
    [playAudio],
  );

  return { playSuccess, playError, playSlide };
};
