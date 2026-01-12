/**
 * API client for Novlearn backend
 * 
 * In production, API_URL should be empty so requests go through Apache proxy.
 * In development, set NEXT_PUBLIC_API_URL=http://localhost:8010
 */

import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get authorization header with Supabase token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
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
    return apiRequest<FriendCode>('/api/friends/code');
  },

  /**
   * Add friend using their invite code
   */
  async addFriendByCode(code: string): Promise<{ message: string }> {
    return apiRequest('/api/friends/add-by-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  /**
   * Get list of friends
   */
  async getFriends(): Promise<{ friends: Friend[] }> {
    return apiRequest('/api/friends');
  },

  /**
   * Get pending friend requests
   */
  async getFriendRequests(): Promise<{ requests: FriendRequest[] }> {
    return apiRequest('/api/friends/requests');
  },

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId: number): Promise<{ message: string }> {
    return apiRequest(`/api/friends/requests/${requestId}/accept`, {
      method: 'POST',
    });
  },

  /**
   * Decline friend request
   */
  async declineFriendRequest(requestId: number): Promise<{ message: string }> {
    return apiRequest(`/api/friends/requests/${requestId}/decline`, {
      method: 'POST',
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
  status: 'waiting' | 'active' | 'finished';
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

export const duelsApi = {
  /**
   * Create a new duel
   */
  async createDuel(friendId: string, exerciseId?: number): Promise<{ message: string; duel_id: number; duel: Duel }> {
    return apiRequest('/api/duels/create', {
      method: 'POST',
      body: JSON.stringify({ friend_id: friendId, exercise_id: exerciseId }),
    });
  },

  /**
   * Accept a duel
   */
  async acceptDuel(duelId: number): Promise<{ message: string; duel: Duel }> {
    return apiRequest(`/api/duels/${duelId}/accept`, {
      method: 'POST',
    });
  },

  /**
   * Decline a duel
   */
  async declineDuel(duelId: number): Promise<{ message: string }> {
    return apiRequest(`/api/duels/${duelId}/decline`, {
      method: 'POST',
    });
  },

  /**
   * Get pending duels (waiting for acceptance)
   */
  async getPendingDuels(): Promise<{ duels: DuelRequest[] }> {
    return apiRequest('/api/duels/pending');
  },

  /**
   * Get active duels
   */
  async getActiveDuels(): Promise<{ duels: Duel[] }> {
    return apiRequest('/api/duels/active');
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
    timeSpent: number
  ): Promise<{ message: string; correct: boolean; new_score?: number; duel?: Duel }> {
    return apiRequest(`/api/duels/${duelId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        duel_id: duelId,
        element_id: elementId,
        answer,
        is_correct: isCorrect,
        time_spent: timeSpent,
      }),
    });
  },
};
