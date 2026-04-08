"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import FriendsTab from "./account/FriendsTab";
import ProfileTab from "./account/ProfileTab";

export function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "friends">("profile");
  // Tracked here so the badge survives tab switches without a re-fetch
  const [pendingRequestCount, setPendingRequestCount] = useState<number>(0);
  const handlePendingCountChange = (count: number) => setPendingRequestCount(count);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-4xl w-full space-y-6">
        {/* Titre */}
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Mon compte
          </h2>
        </div>

        {/* Onglets */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 rounded-2xl transition-all ${
              activeTab === "profile"
                ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg"
                : "bg-slate-700/50 hover:bg-slate-600/60 text-blue-200"
            }`}
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Mon profil
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-6 py-3 rounded-2xl transition-all relative ${
              activeTab === "friends"
                ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg"
                : "bg-slate-700/50 hover:bg-slate-600/60 text-blue-200"
            }`}
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Mes amis
            {pendingRequestCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                {pendingRequestCount}
              </span>
            )}
          </button>
        </div>

        {/* Contenu */}
        {activeTab === "profile" ? (
          <ProfileTab />
        ) : (
          <FriendsTab onPendingCountChange={handlePendingCountChange} />
        )}
      </div>
    </div>
  );
}
