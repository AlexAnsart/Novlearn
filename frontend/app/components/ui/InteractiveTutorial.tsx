"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { supabase } from "../../lib/supabase";

export const InteractiveTutorial = () => {
  const [run, setRun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Détection du mobile
  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Bloquer le scroll pendant le tutoriel
  useEffect(() => {
    if (run) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [run]);

  useEffect(() => {
    // Ne rien faire tant que le composant n'est pas monté sur le navigateur
    if (!isMounted) return;

    // On ne lance ce tutoriel que si on est sur la page d'accueil
    if (pathname !== "/") return;

    const checkTutorialStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("has_seen_tutorial")
        .eq("id", user.id)
        .single();

      if (data && data.has_seen_tutorial === false) {
        // Petit délai pour s'assurer que toutes les classes CSS (les cibles) sont bien rendues
        setTimeout(() => setRun(true), 1500);
      }
    };

    checkTutorialStatus();
  }, [pathname, isMounted]);

  // Définition des étapes avec placements responsives
  const steps: Step[] = [
    {
      target: "body",
      content:
        "Bienvenue sur Novlearn ! 👋 Faisons un petit tour rapide de l'interface pour te montrer comment tout fonctionne.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: ".tour-account",
      content:
        "Voici ton Compte. C'est ici que tu retrouveras tes informations, et surtout que tu pourras ajouter tes amis pour comparer vos scores !",
      placement: isMobile ? "top" : "left",
    },
    {
      target: ".tour-progress",
      content:
        "La page Progression te permet de suivre ton évolution chapitre par chapitre, tes séries de victoires et tes points de compétence.",
      placement: isMobile ? "top" : "right",
    },
    {
      target: ".tour-training",
      content:
        "Dans l'Entraînement, tu peux chercher des exercices à la carte. 💡 Astuce : tu pourras y sélectionner uniquement les chapitres que tu as déjà vus en cours, ou ceux qu'il te reste à découvrir !",
      placement: isMobile ? "top" : "right",
    },
    {
      target: ".tour-leaderboard",
      content:
        "Le Classement te montre la compétition mensuelle ! Accumule des points en t'entraînant et en gagnant des duels pour grimper dans le classement et devenir le meilleur du mois. 🏆",
      placement: isMobile ? "top" : "right",
    },
    {
      target: ".tour-settings",
      content:
        "Un petit tour dans les Paramètres si tu as besoin d'ajuster tes préférences ou de changer de mot de passe.",
      placement: "top",
    },
    {
      target: ".tour-duels",
      content:
        "Envie d'un défi ? La zone 1V1 te permet de lancer des duels mathématiques en temps réel contre tes amis. Que le meilleur gagne !",
      placement: isMobile ? "bottom" : "right",
    },
    {
      target: ".tour-start-test",
      content:
        "Maintenant, à toi de jouer ! Clique ici pour lancer ton premier exercice. Il s'agit d'un test de positionnement qui nous aidera à adapter la difficulté rien que pour toi. 🚀 Tu trouveras un bouton ? d'aide pour comprendre comment répondre.",
      placement: "bottom",
    },
    // Étape PWA (mobile uniquement)
    ...(isMobile
      ? [
          {
            target: "body",
            content:
              "Astuce : Tu peux installer Novlearn comme une vraie application sur ton téléphone ! Clique sur le bouton 'Partager' ou le menu de ton navigateur, puis choisis 'Ajouter à l'écran d'accueil' pour profiter du mode plein écran et des notifications.",
            placement: "center" as const,
          },
        ]
      : []),
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Si le tuto est fini ou passé
    if (finishedStatuses.includes(status)) {
      setRun(false);

      // On sauvegarde dans la base de données pour ne plus jamais l'afficher
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ has_seen_tutorial: true })
          .eq("id", user.id);
      }
    }
  };

  // 3. Sécurité d'affichage : On ne rend rien tant qu'on n'est pas côté client ou hors de la page d'accueil
  if (!isMounted || pathname !== "/") return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true} // Affiche un bouton "Suivant"
      showSkipButton={true}
      showProgress={true}
      disableOverlayClose={true} // Empêche de fermer en cliquant à côté
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#4f46e5", // Indigo-600
          textColor: "#334155", // Slate-700
          zIndex: 1000,
        },
        tooltip: {
          maxWidth: isMobile ? "90vw" : "400px",
          padding: isMobile ? "12px" : "15px",
          fontSize: isMobile ? "14px" : "16px",
        },
        tooltipContent: {
          padding: isMobile ? "8px 0" : "10px 0",
        },
        buttonNext: {
          backgroundColor: "#4f46e5",
          borderRadius: "8px",
          fontWeight: "bold",
          padding: isMobile ? "8px 12px" : "10px 16px",
          fontSize: isMobile ? "13px" : "14px",
        },
        buttonBack: {
          color: "#64748b",
          padding: isMobile ? "8px 12px" : "10px 16px",
          fontSize: isMobile ? "13px" : "14px",
        },
        buttonSkip: {
          fontSize: isMobile ? "12px" : "14px",
        },
      }}
      locale={{
        back: "Précédent",
        close: "Fermer",
        last: "C'est parti !",
        next: "Suivant",
        skip: "Passer le tutoriel",
        nextLabelWithProgress: "Suivant ({step}/8)",
      }}
    />
  );
};
