import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

type UserRole = "ADMIN" | "PROFESSIONAL";

type JwtPayload = {
  role?: UserRole;
  salonId?: string;
  organizationId?: string;
  professionalId?: string;
  name?: string;
  fullName?: string;
  email?: string;
  [key: string]: unknown;
};

interface AuthContextData {
  token: string | null;
  role: UserRole | null;
  user: JwtPayload | null;
  isReady: boolean;
  login(token: string, refreshToken?: string | null): void;
  logout(): void;
}

const AuthContext = createContext<AuthContextData | null>(
  null
);

function parseJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(
    null
  );
  const [role, setRole] =
    useState<UserRole | null>(null);
  const [user, setUser] =
    useState<JwtPayload | null>(null);
  const [isReady, setIsReady] = useState(false);

  /* =========================
     🔐 BOOTSTRAP AUTH
     ========================= */
  useEffect(() => {
    const storedToken =
      localStorage.getItem("token");

    if (storedToken && storedToken.split(".").length === 3) {
      const parsed = parseJwt(storedToken);

      if (parsed?.role) {
        setToken(storedToken);
        setRole(parsed.role);
        setUser(parsed);
      } else {
        localStorage.clear();
      }
    }

    setIsReady(true);
  }, []);

  /* =========================
     🚨 INTERCEPTADOR GLOBAL 401
     ========================= */
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const originalRequest = error?.config as any;
        const requestUrl = String(originalRequest?.url || "");

        if (status === 401 && !originalRequest?._retry && !requestUrl.includes("/auth/refresh")) {
          const refreshToken = localStorage.getItem("refresh_token");

          if (!refreshToken) {
            logout();
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            const refreshResponse = await api.post("/auth/refresh", {
              refresh_token: refreshToken,
            });

            const nextAccessToken =
              refreshResponse?.data?.access_token ||
              refreshResponse?.data?.accessToken ||
              refreshResponse?.data?.token;
            const nextRefreshToken =
              refreshResponse?.data?.refresh_token ||
              refreshResponse?.data?.refreshToken ||
              refreshToken;

            if (!nextAccessToken) {
              throw new Error("refresh sem access_token");
            }

            login(nextAccessToken, nextRefreshToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

            return api(originalRequest);
          } catch {
            logout();
            return Promise.reject(error);
          }
        }

        if (status === 401) {
          logout();
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     🔑 LOGIN
     ========================= */
  function login(newToken: string, refreshToken?: string | null) {
    const parsed = parseJwt(newToken);
    if (!parsed?.role) return;

    localStorage.setItem("token", newToken);
    if (typeof refreshToken === "string" && refreshToken.trim()) {
      localStorage.setItem("refresh_token", refreshToken);
    }
    setToken(newToken);
    setRole(parsed.role);
    setUser(parsed);
  }

  /* =========================
     🚪 LOGOUT DEFINITIVO
     ========================= */
  function logout() {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    setRole(null);
    setUser(null);

    // força reset total da aplicação
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        isReady,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }
  return ctx;
}
