const PROFILE_CACHE_KEY = 'lynq_profile_cache';

interface ProfileCache {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const profileCache = {
  get: (userId: string): ProfileCache | null => {
    try {
      const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
      if (!cached) return null;
      
      const data: ProfileCache = JSON.parse(cached);
      // Only return if cache is for same user and less than TTL old
      if (data.userId === userId && Date.now() - data.timestamp < CACHE_TTL_MS) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },
  
  set: (userId: string, username: string | null, avatarUrl: string | null) => {
    try {
      const data: ProfileCache = {
        userId,
        username,
        avatarUrl,
        timestamp: Date.now()
      };
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  },
  
  clear: () => {
    try {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {
      // Ignore errors
    }
  }
};
