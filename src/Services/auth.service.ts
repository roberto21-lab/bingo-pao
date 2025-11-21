/**
 * Servicio de autenticación SIMULADO
 * 
 * NOTA: Este es un servicio temporal para simular autenticación.
 * Cuando el equipo de autenticación implemente la lógica real,
 * este archivo debe ser reemplazado o adaptado para usar su implementación.
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
 * Simula el login de un usuario
 * En producción, esto debería hacer una llamada al backend
 */
export function simulateLogin(userData: {
  id: string;
  email: string;
  full_name: string;
}): User {
  const expiredDate = new Date();
  expiredDate.setHours(expiredDate.getHours() + 6); // Token expira en 6 horas

  const user: User = {
    id: userData.id,
    email: userData.email,
    full_name: userData.full_name,
    token: "is_loging",
    expired_token_date: expiredDate,
  };

  // Guardar en localStorage
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, user.token);
  localStorage.setItem("userId", user.id); // Para compatibilidad con código existente

  return user;
}

/**
 * Obtiene el usuario logueado desde localStorage
 * En producción, esto debería validar el token con el backend
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
  // Aquí se haría la llamada real al backend
  const response = await api.post('/auth/login', { email, password });
  
  // Suponiendo que el backend devuelve los datos del usuario y el token
  const data = response.data;

  const user: User = {
    id: data.user.id,
    email: data.user.email,
    full_name: data.user.full_name,
    token: data.token,
    expired_token_date: new Date(data.expired_token_date),
  };

  // Guardar en localStorage
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, user.token);
  localStorage.setItem("userId", user.id); // Para compatibilidad con código existente

  return { user, token: data.token };
}
