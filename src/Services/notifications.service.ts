import { api } from "./api";
import { onNotification, offNotification } from "./socket.service";

export type NotificationType = 
  | 'transaction_approved'
  | 'transaction_rejected'
  | 'game_started'
  | 'bingo_claimed'
  | 'round_finished'
  | 'room_finished'
  | 'prize_received'
  | 'balance_low'
  | 'custom';

export interface Notification {
  _id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  limit?: number;
  skip?: number;
}

/**
 * Obtiene las notificaciones del usuario autenticado
 */
export const getNotifications = async (filters?: NotificationFilters): Promise<Notification[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.read !== undefined) {
      params.append('read', filters.read.toString());
    }
    if (filters?.type) {
      params.append('type', filters.type);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.skip) {
      params.append('skip', filters.skip.toString());
    }

    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data.data || [];
  } catch (error) {
    console.error("[NotificationsService] Error al obtener notificaciones:", error);
    throw error;
  }
};

/**
 * Cuenta las notificaciones no leídas del usuario
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await api.get("/notifications/unread");
    return response.data.count || 0;
  } catch (error) {
    console.error("[NotificationsService] Error al contar notificaciones no leídas:", error);
    throw error;
  }
};

/**
 * Marca una notificación como leída
 */
export const markAsRead = async (notificationId: string): Promise<Notification> => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data.data;
  } catch (error) {
    console.error("[NotificationsService] Error al marcar notificación como leída:", error);
    throw error;
  }
};

/**
 * Marca todas las notificaciones como leídas
 */
export const markAllAsRead = async (): Promise<number> => {
  try {
    const response = await api.put("/notifications/read-all");
    return response.data.modifiedCount || 0;
  } catch (error) {
    console.error("[NotificationsService] Error al marcar todas las notificaciones como leídas:", error);
    throw error;
  }
};

/**
 * Elimina una notificación
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    await api.delete(`/notifications/${notificationId}`);
    return true;
  } catch (error) {
    console.error("[NotificationsService] Error al eliminar notificación:", error);
    throw error;
  }
};

/**
 * Suscribe a notificaciones en tiempo real vía WebSocket
 */
export const subscribeToNotifications = (callback: (notification: Notification) => void): (() => void) => {
  // Usar onNotification directamente, que retorna la función de limpieza correcta
  const unsubscribe = onNotification((data) => {
    callback(data);
  });

  // Retornar función de limpieza
  return () => {
    unsubscribe();
  };
};

