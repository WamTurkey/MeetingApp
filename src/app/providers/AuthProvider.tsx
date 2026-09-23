import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User, LoginCredentials } from "@/entities/user/model";
import { MOCK_CURRENT_USER } from "@/entities/user/mock";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (creds: LoginCredentials) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (creds: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock: simulate API delay
      await new Promise((r) => setTimeout(r, 800));

      if (
        creds.email === "admin@example.com" &&
        creds.password === "password123"
      ) {
        setUser(MOCK_CURRENT_USER);
        localStorage.setItem("auth_token", "mock-jwt-token");
      } else {
        throw new Error("E-posta veya şifre hatalı.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Giriş başarısız.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem("auth_token");
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      error,
    }),
    [user, isLoading, login, logout, error],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
