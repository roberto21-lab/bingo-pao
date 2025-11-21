/**
 * Servicio de autenticación
 * Integrado con el backend para autenticación real mediante JWT
 */

import { api } from "./api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  token: string;
  expired_token_date: Date;
}

const AUTH_STORAGE_KEY = "auth_user";
const TOKEN_STORAGE_KEY = "auth_token";

/**
 * Obtiene el usuario logueado desde localStorage
 * Valida que el token no haya expirado
 */
export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!userStr) return null;

    const user: User = JSON.parse(userStr);
    
    // Verificar si el token ha expirado
    const now = new Date();
    const expiredDate = new Date(user.expired_token_date);
    
    if (now > expiredDate) {
      // Token expirado, limpiar
      logout();
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene el token del usuario logueado
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Verifica si el usuario está logueado
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Cierra la sesión del usuario
 */
export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem("userId");
  
  // Notificar cambio de autenticación
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-change"));
  }
}

/**
 * Obtiene el ID del usuario logueado
 * Compatible con el código existente que usa localStorage.getItem("userId")
 */
export function getUserId(): string | null {
  const user = getCurrentUser();
  return user?.id || localStorage.getItem("userId");
}

export async function loginService(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await api.post('/auth/login', { email, password });
  
  const data = response.data;

  // Mapear la respuesta del backend al formato esperado
  const user: User = {
    id: data.user.id,
    email: data.user.email,
    full_name: data.user.full_name || data.user.name, // Usar name como fallback
    token: data.token,
    expired_token_date: new Date(data.expired_token_date),
  };

  // Guardar en localStorage
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, user.token);
  localStorage.setItem("userId", user.id); // Para compatibilidad con código existente

  // Notificar cambio de autenticación
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-change"));
  }

  return { user, token: data.token };
}
