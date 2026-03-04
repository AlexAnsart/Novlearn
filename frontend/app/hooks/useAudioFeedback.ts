import { useCallback } from "react";

export const useAudioFeedback = () => {
  const playSound = useCallback((soundPath: string) => {
    try {
      const audio = new Audio(soundPath);
      // On baisse un peu le volume pour que ça ne soit pas agressif
      audio.volume = 0.5; 
      // Le .catch est VITAL pour éviter les erreurs "Autoplay prevented" du navigateur
      audio.play().catch((err) => {
        console.warn("Audio bloqué par le navigateur :", err);
      });
    } catch (error) {
      console.error("Erreur lors du chargement du son :", error);
    }
  }, []);

  const playClick = () => playSound("/sounds/click.mp3");
  const playSuccess = () => playSound("/sounds/success.mp3");
  const playError = () => playSound("/sounds/error.mp3");

  return { playClick, playSuccess, playError };
};