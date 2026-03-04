"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { duelsApi } from "../lib/api";
import { supabase } from "../lib/supabase";

/**
 * When the current user (player1) has created a duel and the opponent accepts it,
 * redirect them to the active duel page. Uses Realtime + polling fallback.
 * Does not poll when already on an active duel page to avoid request storm.
 */
export function DuelAcceptedRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const redirectedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const isOnActiveDuelPage = pathname?.startsWith("/duel/active/");

    const redirectToActiveDuel = (duelId: number) => {
      if (redirectedRef.current === duelId) return;
      const activePath = `/duel/active/${duelId}`;
      if (typeof window !== "undefined" && window.location.pathname === activePath) return;
      redirectedRef.current = duelId;
      router.push(activePath);
    };

    const channel = supabase
      .channel(`duel-accepted:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duels",
          filter: `player1_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { id: number; status: string };
          if (row.status !== "active") return;
          redirectToActiveDuel(row.id);
        }
      )
      .subscribe();

    if (isOnActiveDuelPage) {
      return () => supabase.removeChannel(channel);
    }

    const pollInterval = setInterval(async () => {
      try {
        const { duels } = await duelsApi.getActiveDuels();
        const active = duels?.[0];
        if (active?.id) redirectToActiveDuel(active.id);
      } catch {
        // ignore
      }
    }, 12000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user?.id, router, pathname]);

  return null;
}
