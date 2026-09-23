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

// ──────────── Request Interceptor ────────────
apiClient.interceptors.request.use(
  (config) => {
    // TODO: JWT token ekle
    // const token = localStorage.getItem("auth_token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

// ──────────── Response Interceptor ────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`[API ${status}]`, data);

      if (status === 401) {
        // TODO: Token expire → login sayfasına yönlendir
        // window.location.href = "/login";
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
