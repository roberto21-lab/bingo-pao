/**
 * ISSUE-6: Hook para manejar la notificación de inicio de sala
 * Escucha el evento room-started y gestiona el estado de la notificación
 */

import { useState, useEffect, useCallback } from "react";
import { onGameStarted } from "../Services/socket.service";

interface RoomStartedNotificationState {
  show: boolean;
  roomName?: string;
}

interface UseRoomStartedNotificationOptions {
  roomId: string | undefined;
  enabled?: boolean;
}

export function useRoomStartedNotification({
  roomId,
  enabled = true,
}: UseRoomStartedNotificationOptions) {
  const [notification, setNotification] = useState<RoomStartedNotificationState>({
    show: false,
    roomName: undefined,
  });

  // Función para cerrar la notificación
  const hideNotification = useCallback(() => {
    setNotification({ show: false, roomName: undefined });
  }, []);

  // Función para mostrar la notificación manualmente (útil para testing)
  const showNotification = useCallback((roomName?: string) => {
    setNotification({ show: true, roomName });
  }, []);

  // Efecto para escuchar el evento de inicio de sala
  useEffect(() => {
    if (!roomId || !enabled) return;

    const unsubscribe = onGameStarted((data) => {
      // Verificar que el evento es para esta sala
      if (data.room_id === roomId) {
        console.log(`[useRoomStartedNotification] Sala ${data.room_name} ha iniciado`);
        setNotification({
          show: true,
          roomName: data.room_name,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, enabled]);

  return {
    showNotification: notification.show,
    roomName: notification.roomName,
    hideNotification,
    triggerNotification: showNotification,
  };
}
