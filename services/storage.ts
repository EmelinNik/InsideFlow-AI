
import { AppState } from '../types';

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

export const saveUserData = (userId: number, data: AppState) => {
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
    localStorage.setItem(getUserKey(userId), JSON.stringify(payload));
  } catch (e) {
    console.error("Database Save Error:", e);
  }
};

export const loadUserData = (userId: number): any | null => {
  try {
    const raw = localStorage.getItem(getUserKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Database Load Error:", e);
    return null;
  }
};

// 3. UTILS
export const clearUserData = (userId: number) => {
    localStorage.removeItem(getUserKey(userId));
}
