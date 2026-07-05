import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('vc_token');
    const savedUser = localStorage.getItem('vc_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('vc_token', data.token);
    localStorage.setItem('vc_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vc_token');
    localStorage.removeItem('vc_user');
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        logout();
        throw new Error('Session expired');
      }
      return res;
    },
    [token, logout]
  );

  const getMediaUrl = useCallback(
    (url) => {
      if (!token) return url;
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}token=${token}`;
    },
    [token]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch, getMediaUrl, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
