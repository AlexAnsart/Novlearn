"use client";

import { Check, Users, X } from "lucide-react";

export interface FriendRequest {
  id: number;
  from: string;
  fromId: string;
}

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (request: FriendRequest) => void;
  onDecline: (requestId: number) => void;
}

export default function FriendRequestCard({
  request,
  onAccept,
  onDecline,
}: FriendRequestCardProps) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <span
          className="text-white"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
        >
          {request.from}
        </span>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <button
          onClick={() => onAccept(request)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all text-sm sm:text-base"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
        >
          <Check className="w-4 h-4" />
          Accepter
        </button>
        <button
          onClick={() => onDecline(request.id)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all text-sm sm:text-base"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
        >
          <X className="w-4 h-4" />
          Refuser
        </button>
      </div>
    </div>
  );
}
