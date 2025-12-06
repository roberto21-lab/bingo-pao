/**
 * ISSUE-7: Hook para manejar la sincronización al reconectar el WebSocket
 * Este hook escucha el evento de reconexión y sincroniza el estado del juego
 */

import { useEffect, useCallback, useRef } from "react";
import { 
  onConnectionStateChange, 
  type SocketConnectionState,
  getConnectionState,
} from "../Services/socket.service";
import { getRoomState, type RoomStateData } from "../Services/rooms.service";

interface UseReconnectSyncOptions {
  roomId: string | undefined;
  enabled?: boolean;
  onStateSync?: (state: RoomStateData) => void;
  onReconnect?: () => void;
  onDisconnect?: () => void;
}

export function useReconnectSync({
  roomId,
  enabled = true,
  onStateSync,
  onReconnect,
  onDisconnect,
}: UseReconnectSyncOptions) {
  const lastConnectionState = useRef<SocketConnectionState>(getConnectionState());
  const isSyncing = useRef(false);

  // Función para sincronizar el estado
  const syncState = useCallback(async () => {
    if (!roomId || isSyncing.current) return;
    
    isSyncing.current = true;
    console.log(`[useReconnectSync] Sincronizando estado de sala ${roomId}...`);
    
    try {
      const state = await getRoomState(roomId);
      
      if (state) {
        console.log(`[useReconnectSync] Estado sincronizado:`, {
          currentRound: state.currentRound,
          calledNumbers: state.calledNumbers.length,
          hasWinner: state.bingoState.hasWinner,
          claims: state.bingoState.claims.length,
        });
        
        onStateSync?.(state);
      }
    } catch (error) {
      console.error("[useReconnectSync] Error al sincronizar estado:", error);
    } finally {
      isSyncing.current = false;
    }
  }, [roomId, onStateSync]);

  // Efecto para escuchar cambios de estado de conexión
  useEffect(() => {
    if (!roomId || !enabled) return;

    const unsubscribe = onConnectionStateChange((newState: SocketConnectionState) => {
      const previousState = lastConnectionState.current;
      lastConnectionState.current = newState;

      console.log(`[useReconnectSync] Estado de conexión: ${previousState} -> ${newState}`);

      // Detectar reconexión (de "reconnecting" o "disconnected" a "connected")
      if (
        newState === "connected" &&
        (previousState === "reconnecting" || previousState === "disconnected")
      ) {
        console.log("[useReconnectSync] ¡Reconexión detectada! Sincronizando estado...");
        onReconnect?.();
        
        // Sincronizar estado después de un pequeño delay para asegurar que el socket esté estable
        setTimeout(() => {
          syncState();
        }, 500);
      }

      // Detectar desconexión
      if (newState === "disconnected" && previousState === "connected") {
        console.log("[useReconnectSync] Desconexión detectada");
        onDisconnect?.();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, enabled, syncState, onReconnect, onDisconnect]);

  // Función para forzar sincronización manual
  const forceSync = useCallback(() => {
    syncState();
  }, [syncState]);

  return {
    forceSync,
    isSyncing: isSyncing.current,
    connectionState: lastConnectionState.current,
  };
}
