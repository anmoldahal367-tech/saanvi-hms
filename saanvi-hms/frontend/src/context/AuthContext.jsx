import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // isLoading covers the initial "check if a token already exists" pass,
  // so routes don't flash a login screen before the session restores.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('saanvi_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await authApi.getMe();
        setUser(data.user);
      } catch {
        localStorage.removeItem('saanvi_token');
        localStorage.removeItem('saanvi_user');
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('saanvi_token', data.token);
    localStorage.setItem('saanvi_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData);
    localStorage.setItem('saanvi_token', data.token);
    localStorage.setItem('saanvi_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('saanvi_token');
    localStorage.removeItem('saanvi_user');
    setUser(null);
  }, []);

  // Convenience helper for RBAC checks in components:
  // hasRole('admin') or hasRole(['admin', 'doctor'])
  const hasRole = useCallback(
    (roles) => {
      if (!user) return false;
      const list = Array.isArray(roles) ? roles : [roles];
      return list.includes(user.role);
    },
    [user]
  );

  const value = { user, isLoading, login, register, logout, hasRole };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
