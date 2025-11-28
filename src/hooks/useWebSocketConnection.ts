import { useEffect } from "react";
import { connectSocket, joinRoom, leaveRoom } from "../Services/socket.service";

/**
 * Hook para manejar la conexión WebSocket y unirse/salir de una sala
 * Separado para evitar loops infinitos cuando otros estados cambian
 */
export function useWebSocketConnection(roomId: string | undefined, gameStarted: boolean) {
  useEffect(() => {
    if (!gameStarted || !roomId) {
      console.log(`[useWebSocketConnection] ⏸️ No uniendo a room: gameStarted=${gameStarted}, roomId=${roomId}`);
      return;
    }

    console.log(`[useWebSocketConnection] 🔌 Uniendo a room ${roomId}...`);
    const socket = connectSocket();
    
    if (socket.connected) {
      console.log(`[useWebSocketConnection] ✅ Socket ya conectado, uniendo a room ${roomId}`);
      joinRoom(roomId);
    } else {
      console.log(`[useWebSocketConnection] ⏳ Socket no conectado, esperando conexión...`);
      socket.once("connect", () => {
        console.log(`[useWebSocketConnection] ✅ Socket conectado, uniendo a room ${roomId}`);
        joinRoom(roomId);
      });
    }

    return () => {
      console.log(`[useWebSocketConnection] 👋 Saliendo de room ${roomId}`);
      leaveRoom(roomId);
    };
  }, [gameStarted, roomId]);
}

