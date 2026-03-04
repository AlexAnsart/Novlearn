"use client";

import { Swords, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  DuelRequest as ApiDuelRequest,
  DuelHistoryItem,
  duelsApi,
  Friend,
  friendsApi,
} from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface LocalDuelRequest {
  id: string;
  from: string;
  fromId: string;
}

export function DuelPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [duelRequests, setDuelRequests] = useState<LocalDuelRequest[]>([]);
  const [sentDuels, setSentDuels] = useState<string[]>([]);
  const [history, setHistory] = useState<DuelHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [friendsData, duelsData, historyData] = await Promise.all([
        friendsApi.getFriends(),
        duelsApi.getPendingDuels(),
        duelsApi.getHistory(),
      ]);

      setFriends(friendsData.friends);
      setDuelRequests(
        duelsData.duels.map((d: ApiDuelRequest) => ({
          id: d.id.toString(),
          from: d.from_user_name,
          fromId: d.from_user_id,
        })),
      );
      setHistory(historyData.history || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, loadData]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  const handleSendDuelRequest = async (
    friendId: string,
    friendName: string,
  ) => {
    if (sentDuels.includes(friendId)) return;

    try {
      await duelsApi.createDuel(friendId);
      setSentDuels([...sentDuels, friendId]);
      alert(`Demande de duel envoyée à ${friendName} !`);
    } catch (error: any) {
      console.error("Error sending duel:", error);
      alert(error.message || "Erreur lors de l'envoi de la demande");
    }
  };

  const handleAcceptDuel = async (requestId: string, fromName: string) => {
    try {
      const result = await duelsApi.acceptDuel(parseInt(requestId));
      setDuelRequests(duelRequests.filter((r) => r.id !== requestId));
      alert(`Duel accepté avec ${fromName} !`);

      // Redirect to active duel
      router.push(`/duel/active/${result.duel.id}`);
    } catch (error: any) {
      console.error("Error accepting duel:", error);
      alert(error.message || "Erreur lors de l'acceptation du duel");
    }
  };

  const handleDeclineDuel = async (requestId: string) => {
    try {
      await duelsApi.declineDuel(parseInt(requestId));
      setDuelRequests(duelRequests.filter((r) => r.id !== requestId));
    } catch (error: any) {
      console.error("Error declining duel:", error);
      alert(error.message || "Erreur lors du refus du duel");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            ⚔️ 1VS1
          </h2>
          <p
            className="text-blue-200 mt-2 drop-shadow-md"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            Défiez vos amis !
          </p>
        </div>

        {duelRequests.length > 0 && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <h3
              className="text-white text-xl mb-4"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Demandes de duel reçues ({duelRequests.length})
            </h3>
            <div className="space-y-3">
              {duelRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                      <Swords className="w-6 h-6 text-white" />
                    </div>
                    <span
                      className="text-white"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {request.from} vous défie !
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptDuel(request.id, request.from)}
                      className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleDeclineDuel(request.id)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <h3
            className="text-white text-xl mb-4"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Mes amis ({friends.length})
          </h3>
          <div className="space-y-3">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p
                      className="text-white"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {friend.name}
                    </p>
                    <p
                      className="text-blue-200 text-sm"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 400,
                      }}
                    >
                      {friend.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSendDuelRequest(friend.id, friend.name)}
                  disabled={sentDuels.includes(friend.id)}
                  className={`px-6 py-3 rounded-xl transition-all ${
                    sentDuels.includes(friend.id)
                      ? "bg-slate-700/50 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-b from-purple-500 to-purple-700 text-white hover:scale-105 shadow-lg"
                  }`}
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {sentDuels.includes(friend.id)
                    ? "Demande envoyée"
                    : "Envoyer une demande de duel"}
                </button>
              </div>
            ))}
          </div>

          {friends.length === 0 && (
            <div className="text-center py-8">
              <p
                className="text-gray-400"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
              >
                Vous n'avez pas encore d'amis. Rejoignez une classe pour en
                rencontrer !
              </p>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <h3
              className="text-white text-xl mb-4"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Historique des duels
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {history.map((item) => {
                const isWin = item.result === "win";
                const isLoss = item.result === "loss";
                const resultLabel = isWin
                  ? "Victoire"
                  : isLoss
                    ? "Défaite"
                    : "Égalité";
                const resultColor = isWin
                  ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/30"
                  : isLoss
                    ? "text-rose-300 bg-rose-500/15 border-rose-500/30"
                    : "text-sky-300 bg-sky-500/15 border-sky-500/30";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-slate-950/40 rounded-2xl px-4 py-3 border border-slate-800/80"
                  >
                    <div>
                      <p
                        className="text-sm text-white"
                        style={{
                          fontFamily: "'Fredoka', sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        vs {item.opponent_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Score : {item.my_score} - {item.opponent_score}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full border ${resultColor}`}
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                    >
                      {resultLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
