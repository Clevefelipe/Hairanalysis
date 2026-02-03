import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

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
  login(token: string): void;
  logout(): void;
}

const AuthContext = createContext<AuthContextData | null>(
  null
);

function parseJwt(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
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

  useEffect(() => {
    const storedToken =
      localStorage.getItem("token");

    if (storedToken) {
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

  function login(token: string) {
    const parsed = parseJwt(token);
    if (!parsed?.role) return;

    localStorage.setItem("token", token);
    setToken(token);
    setRole(parsed.role);
    setUser(parsed);
  }

  function logout() {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUser(null);
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
