import { useState, useEffect, useCallback, useRef } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
  type Notification,
  type NotificationFilters,
} from "../Services/notifications.service";
import { useAuth } from "./useAuth";
import { connectSocket } from "../Services/socket.service";

export const useNotifications = (autoFetch: boolean = true) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Cargar notificaciones desde la API
  const fetchNotifications = useCallback(async (filters?: NotificationFilters) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [notificationsData, unreadCountData] = await Promise.all([
        getNotifications(filters),
        getUnreadCount(),
      ]);

      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (err) {
      console.error("[useNotifications] Error al cargar notificaciones:", err);
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Cargar contador de no leídas
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getUnreadCount();
      console.log("[useNotifications] 📊 Contador de no leídas desde API:", count);
      setUnreadCount(count);
    } catch (err) {
      console.error("[useNotifications] Error al cargar contador de no leídas:", err);
    }
  }, [isAuthenticated]);

  // Marcar notificación como leída
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      // Encontrar la notificación antes de actualizarla para verificar si estaba no leída
      const previousNotification = notifications.find(n => n._id === notificationId);
      const wasUnread = previousNotification && !previousNotification.read;
      
      const updatedNotification = await markAsRead(notificationId);
      
      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? updatedNotification : notif
        )
      );
      
      // Actualizar contador: si estaba no leída y ahora está leída, decrementar
      if (wasUnread && updatedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("[useNotifications] Error al marcar notificación como leída:", err);
      throw err;
    }
  }, [notifications]);

  // Marcar todas como leídas
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const modifiedCount = await markAllAsRead();
      
      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          read: true,
          read_at: new Date().toISOString(),
        }))
      );
      
      // Actualizar contador
      setUnreadCount(0);
      
      return modifiedCount;
    } catch (err) {
      console.error("[useNotifications] Error al marcar todas como leídas:", err);
      throw err;
    }
  }, []);

  // Eliminar notificación
  const removeNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      
      // Actualizar estado local
      setNotifications((prev) => {
        const notification = prev.find((n) => n._id === notificationId);
        // Actualizar contador si era no leída
        if (notification && !notification.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((notif) => notif._id !== notificationId);
      });
    } catch (err) {
      console.error("[useNotifications] Error al eliminar notificación:", err);
      throw err;
    }
  }, []);

  // Agregar nueva notificación (desde WebSocket) - INMEDIATAMENTE
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      // Evitar duplicados
      const exists = prev.find(n => n._id === notification._id);
      if (exists) {
        return prev;
      }
      return [notification, ...prev];
    });
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Cargar notificaciones al montar y cuando cambie la autenticación
  // OPTIMIZACIÓN: Usar ref para evitar dependencia circular
  const fetchNotificationsRef = useRef(fetchNotifications);
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    if (autoFetch && isAuthenticated) {
      fetchNotificationsRef.current();
    }
  }, [autoFetch, isAuthenticated]); // Removido fetchNotifications de dependencias

  // Suscribirse a notificaciones en tiempo real
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Asegurar que el socket esté conectado
    const socket = connectSocket();
    
    // Limpiar suscripción anterior si existe
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Función para suscribirse cuando el socket esté listo
    const setupSubscription = () => {
      unsubscribeRef.current = subscribeToNotifications((notification) => {
        // Agregar inmediatamente a la lista (esto disparará el useEffect en Header)
        addNotification(notification);
      });
    };

    // Si el socket ya está conectado, suscribirse inmediatamente
    if (socket.connected) {
      setupSubscription();
    } else {
      // Esperar a que se conecte
      socket.once("connect", () => {
        setupSubscription();
      });
    }

    // Limpiar al desmontar
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isAuthenticated, addNotification]);

  // NO sincronizar contador periódicamente - el WebSocket actualiza inmediatamente
  // El contador se actualiza automáticamente cuando llega una notificación por WebSocket

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    addNotification,
  };
};

