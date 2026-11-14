import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { setAccessToken, setAuthExpiredHandler } from "../lib/apiClient";
import { authService } from "../services/authService";

const SESSION_HINT_KEY = "borroll_has_session";

function hasSessionHint() {
  try {
    return typeof window !== "undefined" &&
      window.localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function setSessionHint(enabled) {
  try {
    if (typeof window === "undefined") return;
    if (enabled) {
      window.localStorage.setItem(SESSION_HINT_KEY, "1");
    } else {
      window.localStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(hasSessionHint);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setSessionHint(false);
  }, []);

  useEffect(() => {
    setAuthExpiredHandler(clearSession);
    return () => setAuthExpiredHandler(null);
  }, [clearSession]);

  const refreshSession = useCallback(async () => {
    try {
      await authService.refresh();
      setSessionHint(true);
      const me = await authService.getMe();
      setUser(me);
      return me;
    } catch {
      clearSession();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    if (!hasSessionHint()) {
      setIsLoading(false);
      return;
    }

    let active = true;

    authService
      .refresh()
      .then(() => {
        setSessionHint(true);
        return authService.getMe();
      })
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setSessionHint(true);
    if (data?.user) {
      setUser(data.user);
    }
    try {
      const me = await authService.getMe();
      if (me) setUser(me);
      return me;
    } catch {
      return data?.user;
    }
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    setSessionHint(true);
    if (data?.user) {
      setUser(data.user);
    }
    try {
      const me = await authService.getMe();
      if (me) setUser(me);
      return me;
    } catch {
      return data?.user;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateProfile = useCallback(async (payload) => {
    const me = await authService.updateMe(payload);
    setUser(me);
    return me;
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    const me = await authService.uploadAvatar(file);
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshSession,
      updateProfile,
      uploadAvatar,
    }),
    [
      user,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
      updateProfile,
      uploadAvatar,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
