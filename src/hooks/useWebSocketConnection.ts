import { useEffect } from "react";
import { connectSocket, joinRoom, leaveRoom } from "../Services/socket.service";

/**
 * Hook para manejar la conexión WebSocket y unirse/salir de una sala
 * Separado para evitar loops infinitos cuando otros estados cambian
 */
export function useWebSocketConnection(roomId: string | undefined, gameStarted: boolean) {
  useEffect(() => {
    if (!gameStarted || !roomId) {
      return;
    }

    const socket = connectSocket();
    
    if (socket.connected) {
      joinRoom(roomId);
    } else {
      socket.once("connect", () => {
        joinRoom(roomId);
      });
    }

    return () => {
      leaveRoom(roomId);
    };
  }, [gameStarted, roomId]);
}

