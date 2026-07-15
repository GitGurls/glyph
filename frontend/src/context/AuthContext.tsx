import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, User } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setCredits: (n: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("glyph_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  function persist(u: User | null) {
    setUser(u);
    if (u) localStorage.setItem("glyph_user", JSON.stringify(u));
    else localStorage.removeItem("glyph_user");
  }

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("glyph_token", data.token);
      localStorage.setItem("glyph_refresh_token", data.refreshToken);
      persist(data.user);
    } finally {
      setLoading(false);
    }
  }

  async function register(email: string, password: string, name: string) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { email, password, name });
      localStorage.setItem("glyph_token", data.token);
      localStorage.setItem("glyph_refresh_token", data.refreshToken);
      persist(data.user);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    const refreshToken = localStorage.getItem("glyph_refresh_token");
    if (refreshToken) {
      // Best-effort — revokes the refresh token server-side so it can't be
      // replayed even if it leaked. Not awaited: logout should feel instant.
      api.post("/auth/logout", { refreshToken }).catch(() => {});
    }
    localStorage.removeItem("glyph_token");
    localStorage.removeItem("glyph_refresh_token");
    persist(null);
  }

  async function refreshUser() {
    if (!user) return;
    const { data } = await api.get("/credits/balance");
    persist({ ...user, credits: data.credits });
  }

  function setCredits(n: number) {
    if (!user) return;
    persist({ ...user, credits: n });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
