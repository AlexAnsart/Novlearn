"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { supabase } from "../../lib/supabase";

export const InteractiveTutorial = () => {
  const [run, setRun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
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
    if (!isMounted) return;
    if (pathname !== "/") return;

    const checkTutorialStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const anonymous = user.is_anonymous === true;
      setIsGuest(anonymous);

      if (anonymous) {
        const seen = localStorage.getItem("novlearn-guest-tutorial-seen");
        if (!seen) setTimeout(() => setRun(true), 1500);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("has_seen_tutorial")
        .eq("id", user.id)
        .single();

      if (data && data.has_seen_tutorial === false) {
        setTimeout(() => setRun(true), 1500);
      }
    };

    checkTutorialStatus();
  }, [pathname, isMounted]);

  // Textes selon statut invité
  const steps: Step[] = [
    {
      target: "body",
      content: isGuest
        ? "Bienvenue sur NovLearn ! 👋 Voici un tour rapide de la plateforme. Certaines fonctionnalités sont réservées aux membres — tu pourras les débloquer en créant ton compte gratuit !"
        : "Bienvenue sur Novlearn ! 👋 Faisons un petit tour rapide de l'interface pour te montrer comment tout fonctionne.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: ".tour-account",
      content: isGuest
        ? "🔒 Ton profil — crée ton compte pour accéder à ta page personnelle, ajouter des amis et comparer vos scores !"
        : "Voici ton Compte. C'est ici que tu retrouveras tes informations, et surtout que tu pourras ajouter tes amis pour comparer vos scores !",
      placement: isMobile ? "top" : "left",
    },
    {
      target: ".tour-progress",
      content: isGuest
        ? "🔒 Progression — avec un compte, tu peux suivre ton évolution chapitre par chapitre, tes séries de victoires et tes points de compétence."
        : "La page Progression te permet de suivre ton évolution chapitre par chapitre, tes séries de victoires et tes points de compétence.",
      placement: isMobile ? "top" : "right",
    },
    {
      target: ".tour-training",
      content:
        "Dans l'Entraînement, tu peux chercher des exercices à la carte. 💡 Sélectionne les chapitres que tu as déjà vus en cours ou ceux qu'il te reste à découvrir !",
      placement: isMobile ? "top" : "right",
    },
    {
      target: ".tour-leaderboard",
      content: isGuest
        ? "🔒 Classement — crée un compte pour apparaître dans le classement de la semaine et rivaliser avec les autres élèves. 🏆"
        : "Le Classement te montre la compétition de la semaine ! Accumule des points en t'entraînant et en gagnant des duels pour grimper dans le classement et devenir le meilleur de la semaine. 🏆",
      placement: isMobile ? "top" : "right",
    },
    {
      target: ".tour-settings",
      content: isGuest
        ? "🔒 Paramètres — disponible après inscription pour personnaliser ton expérience et gérer ton mot de passe."
        : "Un petit tour dans les Paramètres si tu as besoin d'ajuster tes préférences ou de changer de mot de passe.",
      placement: "top",
    },
    {
      target: ".tour-duels",
      content: isGuest
        ? "🔒 Duels 1V1 — affronte tes amis en mathématiques en temps réel ! Disponible en créant ton compte gratuit. ⚔️"
        : "Envie d'un défi ? La zone 1V1 te permet de lancer des duels mathématiques en temps réel contre tes amis. Que le meilleur gagne !",
      placement: isMobile ? "bottom" : "right",
    },
    {
      target: ".tour-start-test",
      content: isGuest
        ? "C'est parti ! Tu as 5 exercices gratuits pour tester la plateforme. Clique ici pour commencer — et si tu aimes, crée ton compte pour continuer sans limite ! 🚀"
        : "Maintenant, à toi de jouer ! Clique ici pour lancer ton premier exercice. Il s'agit d'un test de positionnement qui nous aidera à adapter la difficulté rien que pour toi. 🚀 Tu trouveras un bouton ? d'aide pour comprendre comment répondre.",
      placement: "bottom",
    },
    // Étape finale pour les invités : invitation à créer un compte
    ...(isGuest
      ? [
          {
            target: "body",
            content:
              "Tu peux commencer tout de suite ! Et quand tu es prêt, clique sur « Créer mon compte » en haut de la page pour débloquer tout NovLearn — c'est gratuit et ta progression est conservée. 🎯",
            placement: "center" as const,
          },
        ]
      : []),
    // Étape PWA (mobile, non-invité uniquement)
    ...(!isGuest && isMobile
      ? [
          {
            target: "body",
            content:
              "Astuce : Tu peux installer Novlearn comme une vraie application sur ton téléphone ! Clique sur 'Partager' ou le menu de ton navigateur, puis choisis 'Ajouter à l'écran d'accueil'.",
            placement: "center" as const,
          },
        ]
      : []),
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        if (user.is_anonymous) {
          localStorage.setItem("novlearn-guest-tutorial-seen", "true");
        } else {
          await supabase
            .from("profiles")
            .update({ has_seen_tutorial: true })
            .eq("id", user.id);
        }
      }
    }
  };

  if (!isMounted || pathname !== "/") return null;

  const stepCount = steps.length;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      disableOverlayClose={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#4f46e5",
          textColor: "#334155",
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
        nextLabelWithProgress: `Suivant ({step}/${stepCount})`,
      }}
    />
  );
};
