import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("glyph_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Access tokens expire in 15 minutes by design (see backend/src/lib/jwt.ts).
// On a 401, try exchanging the refresh token for a new one exactly once
// before giving up and forcing a re-login — this is what keeps a session
// alive for days without keeping a long-lived token sitting in the browser.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("glyph_refresh_token");
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/auth/refresh`,
      { refreshToken }
    );
    localStorage.setItem("glyph_token", data.token);
    localStorage.setItem("glyph_refresh_token", data.refreshToken);
    return data.token;
  } catch {
    localStorage.removeItem("glyph_token");
    localStorage.removeItem("glyph_refresh_token");
    localStorage.removeItem("glyph_user");
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshing = refreshing || refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export interface Job {
  id: string;
  prompt: string;
  enhancedPrompt?: string | null;
  model: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "FLAGGED";
  resultUrl?: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  cost: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  credits: number;
  role: "USER" | "ADMIN";
  theme: string;
}
