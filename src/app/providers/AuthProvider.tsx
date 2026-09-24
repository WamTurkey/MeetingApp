import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User, LoginCredentials } from "@/entities/user/model";
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
  logout as apiLogout,
  getStoredToken,
  type RegisterRequest,
} from "@/services/authService";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (creds: LoginCredentials) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true initially — checking token
  const [error, setError] = useState<string | null>(null);

  // ──────────── On mount: check stored token ────────────
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    getMe()
      .then((data) => {
        setUser({
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          isActive: data.isActive,
          isSuperuser: data.isSuperuser,
          role: (data.role as any) || "User",
          createdAt: "",
          updatedAt: "",
        });
      })
      .catch(() => {
        // Token geçersiz → temizle
        apiLogout();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ──────────── Login ────────────
  const login = useCallback(async (creds: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiLogin({
        email: creds.email,
        password: creds.password,
      });
      setUser({
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        isActive: true,
        isSuperuser: false,
        role: (data.role as any) || "User",
        createdAt: "",
        updatedAt: "",
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : "Giriş başarısız.");
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ──────────── Register ────────────
  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRegister(data);
      setUser({
        id: res.id,
        email: res.email,
        fullName: res.fullName,
        isActive: true,
        isSuperuser: false,
        role: (res.role as any) || "User",
        createdAt: "",
        updatedAt: "",
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : "Kayıt başarısız.");
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ──────────── Logout ────────────
  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      error,
    }),
    [user, isLoading, login, register, logout, error],
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
