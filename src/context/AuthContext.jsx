import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getItem, setItem, removeItem } from '../services/storage.js';
import { unregisterPushNotifications } from '../services/push.js';

const AuthContext = createContext(null);

const SESSION_KEY = 'dssk_leave_session';
const TOKEN_KEY = 'token';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // Loading is true until we've checked persistent storage for an existing
  // session. Screens (ProtectedRoute in particular) must wait for this
  // before deciding whether to redirect to /login — otherwise a real,
  // still-valid session gets bounced to the login page for a flash while
  // storage is still being read.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await getItem(SESSION_KEY);
        if (active) setSession(raw ? JSON.parse(raw) : null);
      } catch {
        if (active) setSession(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // `token` is the JWT returned at login (see services/api.js) — stored here
  // too so login/logout have one place that owns the whole session.
  const login = useCallback((role, user, token) => {
    const next = { role, user };
    setSession(next);
    setItem(SESSION_KEY, JSON.stringify(next));
    if (token) setItem(TOKEN_KEY, token);
  }, []);

  const updateUser = useCallback((patch) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, user: { ...prev.user, ...patch } };
      setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    // Update UI state immediately so the person isn't stuck looking logged
    // in while background cleanup runs.
    setSession(null);
    (async () => {
      // Unregister the push token with the backend first — it still needs
      // the JWT (removed just below) to authenticate that call.
      await unregisterPushNotifications();
      await removeItem(SESSION_KEY);
      await removeItem(TOKEN_KEY);
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
