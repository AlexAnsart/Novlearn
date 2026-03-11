"use client";

import { Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { DuelRequest, duelsApi } from "../lib/api";

export function DuelNotifications() {
  const router = useRouter();
  const { user } = useAuth();

  const [duelRequests, setDuelRequests] = useState<DuelRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!user || !hasMounted) return;

    let isCancelled = false;

    const loadPending = async () => {
      try {
        setLoading(true);
        const result = await duelsApi.getPendingDuels();
        if (isCancelled) return;

        const newRequests = result.duels || [];
        setDuelRequests(newRequests);
      } catch (error) {
        // Silently ignore errors here to avoid spamming the user if backend is down
        console.error("[DuelNotifications] Error loading pending duels", error);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    // Initial load
    loadPending();

    // Poll every 20 seconds to reduce load
    const intervalId = setInterval(loadPending, 20000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [user, hasMounted]);

  const handleAccept = async (request: DuelRequest) => {
    try {
      const result = await duelsApi.acceptDuel(request.id);
      setDuelRequests((current) => current.filter((r) => r.id !== request.id));
      toast.success(`Duel accepté avec ${request.from_user_name} !`);
      router.push(`/duel/active/${result.duel.id}`);
    } catch (error: any) {
      console.error("[DuelNotifications] Error accepting duel", error);
      toast.error(error.message || "Erreur lors de l'acceptation du duel");
    }
  };

  const handleDecline = async (request: DuelRequest) => {
    try {
      await duelsApi.declineDuel(request.id);
      setDuelRequests((current) => current.filter((r) => r.id !== request.id));
    } catch (error: any) {
      console.error("[DuelNotifications] Error declining duel", error);
      toast.error(error.message || "Erreur lors du refus du duel");
    }
  };

  if (!user || duelRequests.length === 0) {
    return null;
  }

  const latestRequest = duelRequests[0];

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.65)] px-5 py-4 max-w-xs flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p
              className="text-xs uppercase tracking-wide text-orange-300/80"
              style={{ fontWeight: 700 }}
            >
              Défi reçu
            </p>
            <p className="text-sm text-white" style={{ fontWeight: 600 }}>
              {latestRequest.from_user_name} vous provoque en duel !
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => handleDecline(latestRequest)}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/90 transition-colors border border-slate-600/70"
          >
            Refuser
          </button>
          <button
            onClick={() => handleAccept(latestRequest)}
            disabled={loading}
            className="flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 transition-colors shadow-lg"
          >
            Accepter le duel
          </button>
        </div>

        {duelRequests.length > 1 && (
          <p className="text-[11px] text-slate-400 text-right">
            +{duelRequests.length - 1} autre(s) en attente
          </p>
        )}
      </div>
    </div>
  );
}
