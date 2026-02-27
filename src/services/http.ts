import axios from "axios";

const RAW_API_URL = import.meta.env.VITE_API_URL || "";
const API_URL = RAW_API_URL.replace(/\/+$/, ""); 
const BASE_API = API_URL
  ? API_URL.endsWith("/api")
    ? API_URL
    : `${API_URL}/api`
  : "/api";

export const http = axios.create({
  baseURL: BASE_API,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("vf_token") || localStorage.getItem("vf_token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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