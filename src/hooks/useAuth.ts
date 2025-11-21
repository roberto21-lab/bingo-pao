/**
 * Hook para obtener información del usuario autenticado
 */

import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, getUserId, isAuthenticated, type User } from "../Services/auth.service";

// Evento personalizado para notificar cambios en la autenticación
const AUTH_CHANGE_EVENT = "auth-change";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Cargar usuario inicial
    refreshUser();

    // Escuchar cambios en localStorage (cuando se hace login/logout en otra pestaña)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_user" || e.key === "auth_token" || e.key === "userId") {
        refreshUser();
      }
    };

    // Escuchar evento personalizado de cambio de autenticación
    const handleAuthChange = () => {
      refreshUser();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, [refreshUser]);

  return {
    user,
    userId: getUserId(),
    isAuthenticated: isAuthenticated(),
    loading,
    refreshUser, // Exponer función para refrescar manualmente
  };
}

/**
 * Dispara un evento para notificar que la autenticación ha cambiado
 * Útil para actualizar el estado en todos los componentes que usan useAuth
 */
export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

