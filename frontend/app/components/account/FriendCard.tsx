"use client";

import { Trash2, Users } from "lucide-react";
import { Friend } from "./FriendDetail";

interface FriendCardProps {
  friend: Friend;
  removingFriendId: string | null;
  onClick: () => void;
  onRemove: (e: React.MouseEvent, friendId: string) => void;
}

export default function FriendCard({
  friend,
  removingFriendId,
  onClick,
  onRemove,
}: FriendCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/60 transition-all"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shrink-0">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <p
            className="text-white truncate"
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
        type="button"
        onClick={(e) => onRemove(e, friend.id)}
        disabled={removingFriendId === friend.id}
        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all disabled:opacity-50 shrink-0"
        title="Retirer cet ami"
        aria-label={`Retirer ${friend.name} de mes amis`}
      >
        {removingFriendId === friend.id ? (
          <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
        ) : (
          <Trash2 className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
