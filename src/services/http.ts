import axios from "axios";

// 🔹 Base URL dinámica
// - En producción usa VITE_API_URL (Railway)
// - En desarrollo usa /api (lo atiende el proxy de Vite)
const API_URL = import.meta.env.VITE_API_URL || "";

export const http = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔹 Interceptor de request → agrega token si existe
http.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("vf_token") ||
    localStorage.getItem("vf_token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🔹 Interceptor de response → maneja 401 global
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("vf_token");
      localStorage.removeItem("vf_token");
      sessionStorage.removeItem("vf_user");
      localStorage.removeItem("vf_user");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);