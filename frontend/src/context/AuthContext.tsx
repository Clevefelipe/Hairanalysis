import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type UserRole = "ADMIN" | "PROFESSIONAL";

interface AuthContextData {
  token: string | null;
  role: UserRole | null;
  isReady: boolean;
  login(token: string): void;
  logout(): void;
}

const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData
);

function parseJwt(token: string): any {
  try {
    const payload = atob(token.split(".")[1]);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken && storedToken.split(".").length === 3) {
      const parsed = parseJwt(storedToken);
      setToken(storedToken);
      setRole(parsed?.role ?? null);
    }

    setIsReady(true);
  }, []);

  function login(token: string) {
    const parsed = parseJwt(token);
    localStorage.setItem("token", token);
    setToken(token);
    setRole(parsed?.role ?? null);
  }

  function logout() {
    localStorage.clear();
    setToken(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        isReady,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
