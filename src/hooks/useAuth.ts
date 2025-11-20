/**
 * Hook para obtener información del usuario autenticado
 * 
 * NOTA: Este hook es temporal para simular autenticación.
 * Cuando el equipo de autenticación implemente la lógica real,
 * este hook debe ser actualizado para usar su contexto/proveedor.
 */

import { useState, useEffect } from "react";
import { getCurrentUser, getUserId, isAuthenticated, type User } from "../Services/auth.service";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  return {
    user,
    userId: getUserId(),
    isAuthenticated: isAuthenticated(),
    loading,
  };
}

