"use client";

import { Award, Calendar, Trash2 } from "lucide-react";
import AvatarDisplay from "./AvatarDisplay";

export interface Friend {
  id: string;
  name: string;
  memberSince: string;
  exercisesCompleted: number;
  level: string;
  avatarId?: string;
  avatarColor?: string;
}

interface FriendDetailProps {
  friend: Friend;
  removingFriendId: string | null;
  onBack: () => void;
  onRemove: (friendId: string) => void;
}

function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function FriendDetail({
  friend,
  removingFriendId,
  onBack,
  onRemove,
}: FriendDetailProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-4xl w-full space-y-6">
        <button
          onClick={onBack}
          className="bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-3 transition-all"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
        >
          <span className="text-white">← Retour</span>
        </button>

        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Profil de {friend.name}
          </h2>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <AvatarDisplay avatarId={friend.avatarId} avatarColor={friend.avatarColor} size="lg" />
            </div>
            <h3
              className="text-white text-3xl"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              {friend.name}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span
                  className="text-blue-200"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  Membre depuis
                </span>
              </div>
              <p
                className="text-white ml-8"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              >
                {formatDate(friend.memberSince)}
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-blue-400" />
                <span
                  className="text-blue-200"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  Exercices réalisés
                </span>
              </div>
              <p
                className="text-white ml-8"
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 500,
                  fontSize: "1.5rem",
                }}
              >
                {friend.exercisesCompleted}
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <span
                  className="text-blue-200"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  Niveau
                </span>
              </div>
              <p
                className="text-white ml-8"
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 500,
                  fontSize: "1.5rem",
                }}
              >
                {friend.level}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => onRemove(friend.id)}
              disabled={removingFriendId === friend.id}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/40 transition-all disabled:opacity-50"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              {removingFriendId === friend.id ? (
                <>
                  <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Remove friend
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
