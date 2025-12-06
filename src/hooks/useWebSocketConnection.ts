import { useEffect } from "react";
import { connectSocket, joinRoom, leaveRoom } from "../Services/socket.service";

/**
 * Hook para manejar la conexión WebSocket y unirse/salir de una sala
 * Separado para evitar loops infinitos cuando otros estados cambian
 * 
 * IMPORTANTE: Se une a la sala siempre que haya roomId, independientemente de gameStarted
 * Esto permite recibir actualizaciones de premio en tiempo real mientras se espera
 */
export function useWebSocketConnection(roomId: string | undefined, _gameStarted: boolean) {
  useEffect(() => {
    // Solo necesitamos roomId para unirse a la sala
    // gameStarted ya no es requerido para poder recibir eventos como room-prize-updated
    if (!roomId) {
      console.log(`[useWebSocketConnection] ⏸️ No uniendo a room: roomId=${roomId}`);
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
  }, [roomId]); // Solo depende de roomId, no de gameStarted
}

