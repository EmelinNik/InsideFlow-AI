
import { AppState, AuthorProfile, Project, SubscriptionPlan } from '../types';
import { supabase } from './supabaseClient';

// Keys for LocalStorage
const SESSION_KEY = 'scriptflow_session_user_id';
const DB_PREFIX = 'scriptflow_db_';
const STORAGE_TABLE = 'app_users';
const STORAGE_SCHEMA_VERSION = 2;

export interface StoredUserData {
  schemaVersion?: number;
  authorProfile?: AuthorProfile | null;
  subscriptionPlan?: SubscriptionPlan;
  hasOnboarded?: boolean;
  hasSeenGuide?: boolean;
  projects?: Project[];
  currentProjectId?: string | null;
  contentPlan?: unknown;
  languageProfile?: unknown;
  writingSamples?: unknown;
  scripts?: unknown;
  strategy?: unknown;
}

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

const getLocalUserData = (userId: number): StoredUserData | null => {
  try {
    const raw = localStorage.getItem(getUserKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Database Load Error:", e);
    return null;
  }
};

export const saveUserData = async (userId: number, data: AppState) => {
  const payload: StoredUserData = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    authorProfile: data.authorProfile,
    subscriptionPlan: data.subscriptionPlan,
    hasOnboarded: data.hasOnboarded,
    hasSeenGuide: data.hasSeenGuide,
    projects: data.projects,
    currentProjectId: data.currentProjectId
  };

  try {
    if (supabase) {
      const { error } = await supabase
        .from(STORAGE_TABLE)
        .upsert({
          user_id: userId,
          data: payload,
          updated_at: new Date().toISOString()
        });
      if (error) {
        throw error;
      }
      return;
    }

    localStorage.setItem(getUserKey(userId), JSON.stringify(payload));
  } catch (e) {
    console.error("Database Save Error:", e);
    try {
      localStorage.setItem(getUserKey(userId), JSON.stringify(payload));
    } catch (storageError) {
      console.error("LocalStorage Save Error:", storageError);
    }
  }
};

export const loadUserData = async (userId: number): Promise<StoredUserData | null> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(STORAGE_TABLE)
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data?.data) {
        return data.data as StoredUserData;
      }

      return getLocalUserData(userId);
    } catch (e) {
      console.error("Database Load Error:", e);
      return getLocalUserData(userId);
    }
  }

  return getLocalUserData(userId);
};

// 3. UTILS
export const clearUserData = async (userId: number) => {
  if (supabase) {
    try {
      const { error } = await supabase
        .from(STORAGE_TABLE)
        .delete()
        .eq('user_id', userId);
      if (error) {
        throw error;
      }
      return;
    } catch (e) {
      console.error("Database Clear Error:", e);
    }
  }
  localStorage.removeItem(getUserKey(userId));
};
