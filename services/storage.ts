
import { AppState } from '../types';
import { supabase } from './supabase';

// Keys for LocalStorage
const SESSION_KEY = 'scriptflow_session_user_id';
const DB_PREFIX = 'scriptflow_db_';

/**
 * Simulates a Database connection.
 * In a real app, these methods would call Supabase/Firebase/PostgreSQL.
 */

// 1. SESSION MANAGEMENT
export const getSessionUserId = (): number | null => {
  const stored = localStorage.getItem(SESSION_KEY);
  return stored ? parseInt(stored, 10) : null;
};

export const setSessionUserId = (id: number) => {
  localStorage.setItem(SESSION_KEY, id.toString());
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

// 2. USER DATA MANAGEMENT
const getUserKey = (userId: number) => `${DB_PREFIX}${userId}`;

export const saveUserData = async (userId: number, data: AppState) => {
  try {
    // We save the entire state structure, now including projects
    const payload = {
      authorProfile: data.authorProfile,
      subscriptionPlan: data.subscriptionPlan,
      hasOnboarded: data.hasOnboarded,
      hasSeenGuide: data.hasSeenGuide,
      projects: data.projects,
      currentProjectId: data.currentProjectId
    };

    if (supabase) {
      const { error } = await supabase
        .from('user_data')
        .upsert({ user_id: userId, data: payload }, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }
      return;
    }

    localStorage.setItem(getUserKey(userId), JSON.stringify(payload));
  } catch (e) {
    console.error("Database Save Error:", e);
  }
};

export const loadUserData = async (userId: number): Promise<any | null> => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data?.data ?? null;
    }

    const raw = localStorage.getItem(getUserKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Database Load Error:", e);
    return null;
  }
};

// 3. UTILS
export const clearUserData = async (userId: number) => {
  if (supabase) {
    await supabase.from('user_data').delete().eq('user_id', userId);
    return;
  }

  localStorage.removeItem(getUserKey(userId));
};
