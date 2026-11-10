import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { setAccessToken, setAuthExpiredHandler } from "../lib/apiClient";
import { authService } from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setAuthExpiredHandler(clearSession);
    return () => setAuthExpiredHandler(null);
  }, [clearSession]);

  const refreshSession = useCallback(async () => {
    try {
      await authService.refresh();
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
    let active = true;

    authService
      .refresh()
      .then(() => authService.getMe())
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
    await authService.login(credentials);
    const me = await authService.getMe();
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    await authService.register(payload);
    const me = await authService.getMe();
    setUser(me);
    return me;
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
