import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: { username: string; email: string; password: string; password_confirm: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadUser = async () => {
    if (!localStorage.getItem('recycleiq.access')) {
      setUser(null);
      return;
    }
    try {
      setUser(await api.get<User>('/auth/me/'));
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    void reloadUser().finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(username, password) {
      const tokens = await api.post<{ access: string; refresh: string }>('/auth/token/', { username, password });
      localStorage.setItem('recycleiq.access', tokens.access);
      localStorage.setItem('recycleiq.refresh', tokens.refresh);
      await reloadUser();
    },
    async register(input) {
      await api.post('/auth/register/', input);
      const tokens = await api.post<{ access: string; refresh: string }>('/auth/token/', {
        username: input.username,
        password: input.password,
      });
      localStorage.setItem('recycleiq.access', tokens.access);
      localStorage.setItem('recycleiq.refresh', tokens.refresh);
      await reloadUser();
    },
    logout() {
      localStorage.removeItem('recycleiq.access');
      localStorage.removeItem('recycleiq.refresh');
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}