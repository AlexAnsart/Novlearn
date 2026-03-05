/**
 * API client for Novlearn backend
 *
 * In production, API_URL should be empty so requests go through Apache proxy.
 * In development, set NEXT_PUBLIC_API_URL=http://localhost:8010
 */

import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Get authorization header with Supabase token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("[api.ts] Session error:", error.message);
      throw new Error("Not authenticated");
    }

    if (!session?.access_token) {
      console.error("[api.ts] No session or access token");
      throw new Error("Not authenticated");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  } catch (error) {
    console.error("[api.ts] getAuthHeaders error:", error);
    throw error;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const requestId = `${endpoint}_${Date.now()}`;
  console.log(`[api.ts] apiRequest: Starting ${endpoint}`, {
    requestId,
    method: options.method || "GET",
  });

  try {
    console.log(`[api.ts] apiRequest: Getting auth headers for ${endpoint}`);
    const headers = await getAuthHeaders();
    console.log(`[api.ts] apiRequest: Auth headers obtained for ${endpoint}`, {
      hasAuth: !!(headers as any)["Authorization"],
    });

    const url = `${API_URL}${endpoint}`;
    console.log(`[api.ts] apiRequest: Making fetch request to ${endpoint}`, {
      url,
      apiUrl: API_URL,
    });

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[api.ts] apiRequest: Timeout triggered for ${endpoint}`);
      controller.abort();
    }, 10000); // 10 second timeout

    let response: Response;
    const fetchStartTime = Date.now();
    try {
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...headers,
          ...options.headers,
        },
      });
      const fetchDuration = Date.now() - fetchStartTime;
      console.log(`[api.ts] apiRequest: Fetch completed for ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${fetchDuration}ms`,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      const fetchDuration = Date.now() - fetchStartTime;
      console.error(`[api.ts] apiRequest: Fetch error for ${endpoint}`, {
        error: fetchError.message,
        name: fetchError.name,
        duration: `${fetchDuration}ms`,
      });

      if (fetchError.name === "AbortError") {
        console.error(`[api.ts] Timeout on ${endpoint}`);
        throw new Error(
          "Request timeout: Le serveur ne répond pas. Vérifiez que le backend est lancé sur http://localhost:8010",
        );
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(
        `[api.ts] apiRequest: Response not OK for ${endpoint}, parsing error`,
      );
      const error = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      console.error(`[api.ts] ${endpoint} error:`, error);
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    console.log(`[api.ts] apiRequest: Parsing JSON response for ${endpoint}`);
    const jsonStartTime = Date.now();
    const result = await response.json();
    const jsonDuration = Date.now() - jsonStartTime;
    console.log(`[api.ts] apiRequest: Success for ${endpoint}`, {
      hasResult: !!result,
      jsonDuration: `${jsonDuration}ms`,
      resultKeys: result ? Object.keys(result) : [],
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[api.ts] apiRequest: Error for ${endpoint}`, {
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    // Provide more helpful error messages
    if (
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("NetworkError") ||
      errorMessage.includes("Network request failed")
    ) {
      console.error(`[api.ts] Network error on ${endpoint}`);
      throw new Error(
        "Impossible de se connecter au backend. Vérifiez que le serveur est lancé sur http://localhost:8010",
      );
    }

    throw error;
  }
}

// ============================================
// RECOMMENDATION API
// ============================================

export interface RecommendExerciseResponse {
  exercise_id: number;
  competence_id: string | null; // Keep for backward compatibility
  competences?: string[]; // Array of competences (preferred)
  difficulty_level: number;
  difficulty: string;
  mode?: 'test' | 'recommendation';
  chapter?: string;
}

/**
 * Recommande un exercice pour l'utilisateur connecté.
 * chapter (optionnel) : limiter au chapitre (streak et exos de ce chapitre).
 * Retourne null si non connecté, 404 ou erreur (fallback = exercice aléatoire côté Loader).
 * Si test de placement non complété, retourne un exo de test (mode: "test").
 */
export async function getRecommendedExercise(
  chapter?: string | null,
): Promise<RecommendExerciseResponse | null> {
  try {
    const endpoint = chapter
      ? `/api/recommend-exercise?chapter=${encodeURIComponent(chapter)}`
      : '/api/recommend-exercise';
    const res = await apiRequest<RecommendExerciseResponse>(endpoint);
    if (res?.mode) {
      console.log(`[Exercise] Recommendation: mode=${res.mode}${res.chapter ? ` chapter=${res.chapter}` : ''} exo=${res.exercise_id}`);
    }
    return res;
  } catch {
    return null;
  }
}

export interface ChapterTestNextResponse {
  exercise_id?: number;
  competence_id?: string;
  competences?: string[];
  difficulty_level?: number;
  difficulty?: string;
  mode?: 'test';
  chapter?: string;
  completed?: boolean;
}

/**
 * Récupère le prochain exercice du test de placement après complétion.
 * Body: { chapter, last_success }.
 */
export async function postChapterTestNext(
  chapter: string,
  lastSuccess: boolean
): Promise<ChapterTestNextResponse | null> {
  try {
    const res = await apiRequest<ChapterTestNextResponse>('/api/chapter-test/next', {
      method: 'POST',
      body: JSON.stringify({ chapter, last_success: lastSuccess }),
    });
    if (res?.completed) {
      console.log(`[Exercise] Chapter test completed for chapter=${chapter}`);
    } else if (res?.exercise_id) {
      console.log(`[Exercise] Chapter test next: exo=${res.exercise_id} (lastSuccess=${lastSuccess})`);
    }
    return res;
  } catch {
    return null;
  }
}

// ============================================
// FRIENDS API
// ============================================

export interface FriendCode {
  code: string;
  invite_link: string;
}

export interface Friend {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
}

export interface FriendRequest {
  id: number;
  from_user_id: string;
  from_user_name: string;
  created_at: string;
}

export const friendsApi = {
  /**
   * Get or generate friend code for current user
   */
  async getFriendCode(): Promise<FriendCode> {
    console.log("[friendsApi] getFriendCode: Starting");
    try {
      const result = await apiRequest<FriendCode>("/api/friends/code");
      console.log("[friendsApi] getFriendCode: Success", {
        hasCode: !!result?.code,
        hasInviteLink: !!result?.invite_link,
      });
      return result;
    } catch (error) {
      console.error("[friendsApi] getFriendCode: Error", error);
      throw error;
    }
  },

  /**
   * Add friend using their invite code
   */
  async addFriendByCode(code: string): Promise<{ message: string }> {
    return apiRequest("/api/friends/add-by-code", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  /**
   * Get list of friends
   */
  async getFriends(): Promise<{ friends: Friend[] }> {
    const result = await apiRequest<{ friends: Friend[] }>("/api/friends");
    console.log("[friendsApi] getFriends: count=", result?.friends?.length ?? 0);
    return result;
  },

  /**
   * Get pending friend requests
   */
  async getFriendRequests(): Promise<{ requests: FriendRequest[] }> {
    return apiRequest("/api/friends/requests");
  },

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId: number): Promise<{ message: string }> {
    return apiRequest(`/api/friends/requests/${requestId}/accept`, {
      method: "POST",
    });
  },

  /**
   * Decline friend request
   */
  async declineFriendRequest(requestId: number): Promise<{ message: string }> {
    return apiRequest(`/api/friends/requests/${requestId}/decline`, {
      method: "POST",
    });
  },

  /**
   * Remove a friend
   */
  async removeFriend(friendId: string): Promise<{ message: string }> {
    return apiRequest(`/api/friends/${encodeURIComponent(friendId)}`, {
      method: "DELETE",
    });
  },
};

// ============================================
// DUELS API
// ============================================

export interface Duel {
  id: number;
  player1_id: string;
  player2_id: string;
  exercise_id: number;
  status: "waiting" | "active" | "finished";
  player1_score: number;
  player2_score: number;
  player1_time: number | null;
  player2_time: number | null;
  winner_id: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  exercise_data: any;
  exercise?: any;
  player1?: any;
  player2?: any;
}

export interface DuelRequest {
  id: number;
  from_user_id: string;
  from_user_name: string;
  exercise_title: string;
  created_at: string;
}

export interface DuelHistoryItem {
  id: number;
  opponent_id: string;
  opponent_name: string;
  my_score: number;
  opponent_score: number;
  result: "win" | "loss" | "draw";
  created_at: string | null;
  finished_at: string | null;
}

export const duelsApi = {
  /**
   * Create a new duel
   */
  async createDuel(
    friendId: string,
    exerciseId?: number,
  ): Promise<{ message: string; duel_id: number; duel: Duel }> {
    return apiRequest("/api/duels/create", {
      method: "POST",
      body: JSON.stringify({ friend_id: friendId, exercise_id: exerciseId }),
    });
  },

  /**
   * Accept a duel
   */
  async acceptDuel(duelId: number): Promise<{ message: string; duel: Duel }> {
    return apiRequest(`/api/duels/${duelId}/accept`, {
      method: "POST",
    });
  },

  /**
   * Decline a duel
   */
  async declineDuel(duelId: number): Promise<{ message: string }> {
    return apiRequest(`/api/duels/${duelId}/decline`, {
      method: "POST",
    });
  },

  /**
   * Get duel config (duration, exercise timeout). Single source of truth from backend.
   */
  async getDuelConfig(): Promise<{
    duelDurationSeconds: number;
    exerciseTimeoutSeconds: number;
    correctionDisplaySeconds: number;
  }> {
    return apiRequest("/api/duels/config");
  },

  /**
   * Get pending duels (waiting for acceptance)
   */
  async getPendingDuels(): Promise<{ duels: DuelRequest[] }> {
    return apiRequest("/api/duels/pending");
  },

  /**
   * Get active duels
   */
  async getActiveDuels(): Promise<{ duels: Duel[] }> {
    return apiRequest("/api/duels/active");
  },

  /**
   * Get specific duel details
   */
  async getDuel(duelId: number): Promise<{ duel: Duel }> {
    return apiRequest(`/api/duels/${duelId}`);
  },

  /**
   * Submit answer in a duel
   */
  async submitAnswer(
    duelId: number,
    elementId: number,
    answer: string,
    isCorrect: boolean,
    timeSpent: number,
  ): Promise<{
    message: string;
    correct: boolean;
    new_score?: number;
    duel?: Duel;
  }> {
    return apiRequest(`/api/duels/${duelId}/submit`, {
      method: "POST",
      body: JSON.stringify({
        duel_id: duelId,
        element_id: elementId,
        answer,
        is_correct: isCorrect,
        time_spent: timeSpent,
      }),
    });
  },

  /**
   * Get duel history (finished duels) for current user
   */
  async getHistory(): Promise<{ history: DuelHistoryItem[] }> {
    return apiRequest("/api/duels/history");
  },
};
