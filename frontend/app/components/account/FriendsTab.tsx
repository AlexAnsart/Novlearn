"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { friendsApi } from "../../lib/api";
import FriendCard from "./FriendCard";
import FriendDetail, { Friend } from "./FriendDetail";
import FriendRequestCard, { FriendRequest } from "./FriendRequestCard";

interface FriendsTabProps {
  onPendingCountChange?: (count: number) => void;
}

export default function FriendsTab({ onPendingCountChange }: FriendsTabProps) {
  const { user } = useAuth();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [addFriendCode, setAddFriendCode] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

  const [friendCodeError, setFriendCodeError] = useState<string | null>(null);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [friendRequestsError, setFriendRequestsError] = useState<string | null>(null);
  const [friendCodeLoading, setFriendCodeLoading] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    onPendingCountChange?.(friendRequests.length);
  }, [friendRequests.length, onPendingCountChange]);

  const loadFriends = useCallback(async () => {
    if (!isMountedRef.current) return;
    setFriendsError(null);
    try {
      const { friends: friendsData } = await friendsApi.getFriends();
      if (!isMountedRef.current) return;
      setFriends(
        friendsData.map((f) => ({
          id: f.id,
          name: f.name,
          memberSince: f.created_at ?? "",
          exercisesCompleted: f.exercises_completed ?? 0,
          level: "Terminale",
          avatarId: f.avatar_id,
          avatarColor: f.avatar_color,
        })),
      );
    } catch (error: any) {
      if (!isMountedRef.current) return;
      const msg = error?.message || String(error);
      setFriendsError(
        msg.includes("fetch") || msg.includes("Failed to fetch")
          ? "Backend non disponible"
          : msg,
      );
      setFriends([]);
    }
  }, []);

  const loadFriendRequests = useCallback(async () => {
    if (!isMountedRef.current) return;
    setFriendRequestsError(null);
    try {
      const { requests } = await friendsApi.getFriendRequests();
      if (!isMountedRef.current) return;
      setFriendRequests(
        requests.map((r) => ({
          id: r.id,
          from: r.from_user_name,
          fromId: r.from_user_id,
        })),
      );
    } catch (error: any) {
      if (!isMountedRef.current) return;
      const msg = error?.message || String(error);
      setFriendRequestsError(
        msg.includes("fetch") || msg.includes("Failed to fetch")
          ? "Backend non disponible"
          : msg,
      );
      setFriendRequests([]);
    }
  }, []);

  const loadFriendCode = useCallback(async () => {
    if (!isMountedRef.current) return;
    setFriendCodeError(null);
    setFriendCodeLoading(true);
    try {
      const result = await friendsApi.getFriendCode();
      if (!isMountedRef.current) return;
      setFriendCode(result.code);
      setFriendCodeError(null);
    } catch (error: any) {
      if (!isMountedRef.current) return;
      const msg = error?.message || String(error);
      setFriendCodeError(
        msg.includes("fetch") ? "Backend non disponible." : msg,
      );
      setFriendCode(null);
    } finally {
      if (isMountedRef.current) setFriendCodeLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadFriends();
    loadFriendRequests();
    loadFriendCode();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadFriends, loadFriendRequests, loadFriendCode]);

  const handleAcceptFriendRequest = async (request: FriendRequest) => {
    try {
      await friendsApi.acceptFriendRequest(request.id);
      await loadFriends();
      setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
      toast.success("Demande d'ami acceptée !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'acceptation de la demande");
    }
  };

  const handleDeclineFriendRequest = async (requestId: number) => {
    try {
      await friendsApi.declineFriendRequest(requestId);
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Demande refusée.");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du refus de la demande");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (removingFriendId) return;
    setRemovingFriendId(friendId);
    try {
      await friendsApi.removeFriend(friendId);
      await loadFriends();
      if (selectedFriend?.id === friendId) setSelectedFriend(null);
    } catch (error: any) {
      alert(error.message || "Erreur lors de la suppression de l'ami");
    } finally {
      setRemovingFriendId(null);
    }
  };

  const handleCopyFriendCode = () => {
    if (friendCode) {
      navigator.clipboard.writeText(friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddFriend = async () => {
    if (!addFriendCode.trim()) return;
    setAddingFriend(true);
    try {
      await friendsApi.addFriendByCode(addFriendCode.trim());
      setAddFriendCode("");
      toast.success("Demande d'ami envoyée !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout de l'ami");
    } finally {
      setAddingFriend(false);
    }
  };

  if (selectedFriend) {
    return (
      <FriendDetail
        friend={selectedFriend}
        removingFriendId={removingFriendId}
        onBack={() => setSelectedFriend(null)}
        onRemove={handleRemoveFriend}
      />
    );
  }

  return (
    <>
      {/* Mon code d'ami */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] mb-6">
        <h3
          className="text-white text-xl mb-4"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
        >
          Mon code d&apos;ami
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-900/40 rounded-xl p-3 md:p-4 min-w-0">
            <p
              className="text-blue-200 text-sm mb-1 truncate"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Code :
            </p>
            {friendCodeError ? (
              <p className="text-red-400 text-sm truncate">{friendCodeError}</p>
            ) : friendCodeLoading || !friendCode ? (
              <p className="text-white text-xl md:text-2xl font-bold">...</p>
            ) : (
              <p
                className="text-white text-xl md:text-2xl font-bold truncate"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {friendCode}
              </p>
            )}
          </div>
          <button
            onClick={handleCopyFriendCode}
            disabled={!friendCode}
            className="p-4 md:px-6 md:py-4 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {copied ? (
              <Check className="w-5 h-5 md:w-6 md:h-6" />
            ) : (
              <Copy className="w-5 h-5 md:w-6 md:h-6" />
            )}
            <span
              className="hidden md:block"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              {copied ? "Copié !" : "Copier le code"}
            </span>
          </button>
        </div>
      </div>

      {/* Ajouter un ami */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] mb-6">
        <h3
          className="text-white text-xl mb-4"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
        >
          Ajouter un ami
        </h3>
        <div className="flex items-center gap-2 md:gap-3">
          <input
            type="text"
            value={addFriendCode}
            onChange={(e) => setAddFriendCode(e.target.value)}
            placeholder="Code d'ami"
            className="flex-1 px-3 py-3 md:px-4 rounded-xl bg-slate-900/40 text-white border-2 border-slate-700 focus:border-blue-500 outline-none min-w-0"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          />
          <button
            onClick={handleAddFriend}
            disabled={addingFriend || !addFriendCode.trim()}
            className="px-4 py-3 md:px-6 rounded-xl bg-gradient-to-b from-purple-500 to-purple-700 text-white transition-all hover:scale-105 disabled:opacity-50 shrink-0"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            {addingFriend ? "..." : "Ajouter"}
          </button>
        </div>
      </div>

      {/* Demandes d'amis en attente */}
      {(friendRequests.length > 0 || friendRequestsError) && (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] mb-6">
          <h3
            className="text-white text-xl mb-4"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Demandes d&apos;amis ({friendRequests.length})
          </h3>
          {friendRequestsError && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
              <p
                className="text-red-400 text-sm"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {friendRequestsError}
              </p>
            </div>
          )}
          <div className="space-y-3">
            {friendRequests.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                onAccept={handleAcceptFriendRequest}
                onDecline={handleDeclineFriendRequest}
              />
            ))}
          </div>
        </div>
      )}

      {/* Liste des amis */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
        <h3
          className="text-white text-xl mb-4"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
        >
          Amis ({friends.length})
        </h3>
        {friendsError && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
            <p
              className="text-red-400 text-sm"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              {friendsError}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              removingFriendId={removingFriendId}
              onClick={() => setSelectedFriend(friend)}
              onRemove={(e, id) => {
                e.stopPropagation();
                handleRemoveFriend(id);
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
