/**
 * ISSUE-5: Hook para manejar las notificaciones de bingo en tiempo real
 * Este hook escucha los eventos de bingo y gestiona las notificaciones visuales
 */

import { useState, useEffect, useCallback } from "react";
import {
  onBingoClaimedPending,
  onBingoConfirmed,
  onBingoRejected,
  type BingoNotificationData,
} from "../Services/socket.service";
import type { BingoNotificationType } from "../Components/BingoNotificationToast";

export interface BingoNotification {
  id: string;
  type: BingoNotificationType;
  playerName: string;
  cardCode?: string;
  message?: string;
  prizeAmount?: string;
  pattern?: string;
  timestamp: number;
}

interface UseBingoNotificationsOptions {
  roomId: string | undefined;
  currentUserId?: string;
  enabled?: boolean;
}

export function useBingoNotifications({
  roomId,
  currentUserId,
  enabled = true,
}: UseBingoNotificationsOptions) {
  const [notifications, setNotifications] = useState<BingoNotification[]>([]);

  // ISSUE-5 FIX: Tiempo de auto-dismiss para notificaciones (en ms)
  const AUTO_DISMISS_TIME = 5000; // 5 segundos

  // Función para agregar una notificación con auto-dismiss
  const addNotification = useCallback(
    (notification: Omit<BingoNotification, "id">) => {
      const id = `${notification.type}-${notification.timestamp}-${Math.random()
        .toString(36)
        .substring(7)}`;
      
      setNotifications((prev) => [...prev, { ...notification, id }]);

      // ISSUE-5 FIX: Auto-dismiss después del tiempo establecido
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, AUTO_DISMISS_TIME);
    },
    []
  );

  // Función para remover una notificación
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Función para limpiar todas las notificaciones
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Efectos para escuchar eventos de WebSocket
  useEffect(() => {
    if (!roomId || !enabled) return;

    // Escuchar bingo pendiente
    const unsubscribePending = onBingoClaimedPending((data: BingoNotificationData) => {
      if (data.room_id !== roomId) return;
      
      // No mostrar notificación si es el mismo usuario
      if (data.player.user_id === currentUserId) return;

      addNotification({
        type: "pending",
        playerName: data.player.user_name || "Un jugador",
        cardCode: data.player.card_code,
        message: data.message,
        timestamp: data.timestamp,
      });
    });

    // Escuchar bingo confirmado
    const unsubscribeConfirmed = onBingoConfirmed((data: BingoNotificationData) => {
      if (data.room_id !== roomId) return;
      
      // Siempre mostrar cuando es confirmado (aunque sea el mismo usuario)
      // Pero con mensaje diferente si es el usuario actual
      const isCurrentUser = data.player.user_id === currentUserId;
      
      addNotification({
        type: "confirmed",
        playerName: isCurrentUser ? "¡Tú" : data.player.user_name || "Un jugador",
        cardCode: data.player.card_code,
        message: isCurrentUser 
          ? "¡Tu bingo ha sido confirmado!" 
          : `¡${data.player.user_name || "Un jugador"} ha ganado!`,
        prizeAmount: data.prize_amount,
        pattern: data.pattern,
        timestamp: data.timestamp,
      });
    });

    // Escuchar bingo rechazado
    const unsubscribeRejected = onBingoRejected((data: BingoNotificationData) => {
      if (data.room_id !== roomId) return;
      
      // No mostrar notificación si es el mismo usuario (ya ve el error en su UI)
      if (data.player.user_id === currentUserId) return;

      addNotification({
        type: "rejected",
        playerName: data.player.user_name || "Un jugador",
        cardCode: data.player.card_code,
        message: data.message || "Bingo inválido",
        timestamp: data.timestamp,
      });
    });

    return () => {
      unsubscribePending();
      unsubscribeConfirmed();
      unsubscribeRejected();
    };
  }, [roomId, currentUserId, enabled, addNotification]);

  return {
    notifications,
    removeNotification,
    clearNotifications,
    hasNotifications: notifications.length > 0,
  };
}
