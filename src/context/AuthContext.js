import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('cabinetAuthUser');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem('cabinetAuthUser');
      }
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('cabinetAuthUser', JSON.stringify(user));
    else localStorage.removeItem('cabinetAuthUser');
  }, [user]);

  const login = ({ username, password }) => {
    if (!username || !password) return;

    const normalized = username.trim().toLowerCase();
    let role = 'secretary';
    if (normalized.includes('doctor') || normalized.includes('doc') || normalized.includes('dr')) {
      role = 'doctor';
    }

    const loginUser = {
      id: Date.now(),
      name: username.trim(),
      username: username.trim(),
      role,
      token: `token-${Date.now()}`,
    };
    setUser(loginUser);
  };

  const logout = () => setUser(null);

  const isAuthenticated = Boolean(user);
  const hasRole = (roles = []) => roles.includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
