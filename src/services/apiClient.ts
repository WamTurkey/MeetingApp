import axios from "axios";

/**
 * Merkezi Axios instance — tüm API çağrıları bu üzerinden yapılır.
 * Base URL: .env dosyasından VITE_API_BASE_URL okunur.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
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

// ──────────── Response Interceptor — 401 Redirect ────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`[API ${status}]`, data);

      if (status === 401) {
        // Token geçersiz veya expire olmuş → oturumu temizle
        localStorage.removeItem("auth_token");
        // Login sayfasına yönlendir (Router dışında olduğumuz için window.location kullanıyoruz)
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
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
