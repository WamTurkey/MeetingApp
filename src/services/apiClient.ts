import axios from "axios";
import { toast } from "sonner";
import { broadcastInvalidation, scopesForMutation } from "@/shared/lib/dataSync";
import { queryClient } from "@/shared/api/queryClient";

/** AuthProvider bu event'i dinleyerek kullanıcı state'ini temizler (SPA içi yönlendirme). */
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

/** Oturum gerektirmeyen uç noktalar — burada alınan 401, "süre doldu" anlamına gelmez (örn. hatalı şifre). */
const PUBLIC_AUTH_ENDPOINTS = ["/Auth/login", "/Auth/register"];

let isHandlingUnauthorized = false;

function handleUnauthorized() {
  if (isHandlingUnauthorized) return; // Aynı anda düşen paralel 401'lerde tek bildirim
  isHandlingUnauthorized = true;

  const hadSession = !!localStorage.getItem("auth_token");
  localStorage.removeItem("auth_token");
  // Önceki oturumun önbelleğe alınmış verisi bir sonraki kullanıcıya sızmasın
  queryClient.cancelQueries();
  queryClient.clear();

  if (hadSession) {
    toast.error("Oturumunuzun süresi doldu", {
      id: "session-expired",
      description: "Güvenliğiniz için lütfen tekrar giriş yapın.",
    });
  }

  // 1) React tarafına haber ver → AuthProvider user'ı null yapar → RequireAuth /login'e yönlendirir (toast korunur)
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));

  // 2) Güvenlik ağı: SPA yönlendirmesi gerçekleşmezse sert yönlendirme
  window.setTimeout(() => {
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    isHandlingUnauthorized = false;
  }, 1500);
}

/**
 * Merkezi Axios instance — tüm API çağrıları bu üzerinden yapılır.
 * Base URL: .env dosyasından VITE_API_BASE_URL okunur.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5180/api",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ──────────── Request Interceptor — JWT Token ────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

// ──────────── Response Interceptor — Sekmeler arası yayın + 401 Redirect ────────────
apiClient.interceptors.response.use(
  (response) => {
    // Bu sekmedeki tazeleme mutasyon hook'larında yapılır; burada yalnızca DİĞER sekmeler bilgilendirilir
    const method = (response.config.method ?? "get").toLowerCase();
    if (MUTATION_METHODS.has(method)) {
      broadcastInvalidation(scopesForMutation(response.config.url ?? ""));
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`[API ${status}]`, data);

      const url: string = error.config?.url ?? "";
      const isPublicAuthCall = PUBLIC_AUTH_ENDPOINTS.some((p) => url.includes(p));

      if (status === 401 && !isPublicAuthCall) {
        // Token geçersiz veya süresi dolmuş → oturumu temizle, bildir, Login'e yönlendir
        handleUnauthorized();
      } else if (status === 403) {
        toast.error("Bu işlem için yetkiniz bulunmuyor.", { id: "forbidden" });
      }
    } else if (error.request) {
      console.error("[API Network Error] Sunucuya ulaşılamıyor", error.message);
    } else {
      console.error("[API Error]", error.message);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
