import axios from "axios";
import { getToken } from "./auth.service";

// URL base del backend
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor opcional para token (si usas JWT)
api.interceptors.request.use((config) => {
  // Intentar obtener token del servicio de autenticación simulado
  const token = getToken() || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

