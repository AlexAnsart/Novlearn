'use client';

import { useState } from "react";
import { Users, Swords } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  exercisesCompleted: number;
  level: string;
}

interface DuelRequest {
  id: string;
  from: string;
  fromId: string;
}

export function DuelPage() {
  const [friends] = useState<Friend[]>([
    {
      id: "1",
      name: "MathPro2024",
      email: "mathpro@novlearn.fr",
      memberSince: "Août 2024",
      exercisesCompleted: 58,
      level: "Terminale",
    },
    {
      id: "2",
      name: "Einstein42",
      email: "einstein42@novlearn.fr",
      memberSince: "Septembre 2024",
      exercisesCompleted: 35,
      level: "Terminale",
    },
  ]);

  const [duelRequests, setDuelRequests] = useState<DuelRequest[]>([
    {
      id: "1",
      from: "CalculGenius",
      fromId: "3",
    },
  ]);

  const [sentDuels, setSentDuels] = useState<string[]>([]);

  const handleSendDuelRequest = (friendId: string, friendName: string) => {
    if (!sentDuels.includes(friendId)) {
      setSentDuels([...sentDuels, friendId]);
      alert(`Demande de duel envoyée à ${friendName} !`);
    }
  };

  const handleAcceptDuel = (requestId: string, fromName: string) => {
    setDuelRequests(duelRequests.filter((r) => r.id !== requestId));
    alert(`Duel accepté avec ${fromName} !`);
  };

  const handleDeclineDuel = (requestId: string) => {
    setDuelRequests(duelRequests.filter((r) => r.id !== requestId));
  };

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
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                    >
                      {request.from} vous défie !
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptDuel(request.id, request.from)}
                      className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleDeclineDuel(request.id)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
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
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                    >
                      {friend.name}
                    </p>
                    <p
                      className="text-blue-200 text-sm"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 400 }}
                    >
                      {friend.exercisesCompleted} exercices
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
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  {sentDuels.includes(friend.id) ? "Demande envoyée" : "Envoyer une demande de duel"}
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
                Vous n'avez pas encore d'amis. Rejoignez une classe pour en rencontrer !
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

