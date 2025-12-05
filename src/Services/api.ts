import axios from "axios";
import { getToken, logout } from "./auth.service";

// URL base del backend
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token JWT a las peticiones
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación y traducir errores de red
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token es inválido o expirado, hacer logout
    if (error.response?.status === 401) {
      logout();
      // Redirigir al login si estamos en el navegador
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    
    // Traducir errores de red comunes al español
    if (!error.response) {
      // Error de red (sin respuesta del servidor)
      if (error.message === "Network Error" || error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        error.message = "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
      } else if (error.message && !error.message.includes("Error") && !error.message.includes("error")) {
        error.message = "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
      }
    }
    
    return Promise.reject(error);
  }
);

