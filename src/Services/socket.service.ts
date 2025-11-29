import { io, Socket } from "socket.io-client";
import { getToken } from "./auth.service";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Estado de conexión
export type SocketConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

// Callbacks de estado
type ConnectionStateCallback = (state: SocketConnectionState) => void;

// Queue de eventos pendientes cuando está desconectado
type QueuedEvent = {
  event: string;
  data: unknown;
};

let socket: Socket | null = null;
let connectionState: SocketConnectionState = "disconnected";
const stateCallbacks: Set<ConnectionStateCallback> = new Set();
let queuedEvents: QueuedEvent[] = [];
let currentRoomId: string | null = null;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_BASE = 1000; // 1 segundo base

// Notificar cambios de estado
const notifyStateChange = (newState: SocketConnectionState) => {
  if (connectionState !== newState) {
    connectionState = newState;
    stateCallbacks.forEach((callback) => callback(newState));
  }
};

// Obtener token de autenticación
const getAuthToken = (): string | null => {
  try {
    return getToken();
  } catch {
    return null;
  }
};

// Inicializar conexión WebSocket con autenticación
export const connectSocket = (): Socket => {
  // Si ya está conectado, retornar la instancia existente
  if (socket?.connected) {
    return socket;
  }

  // Si existe pero no está conectado, desconectar primero para limpiar
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = getAuthToken();
  
  // Configuración optimizada para baja latencia
  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"], // Preferir websocket, fallback a polling
    upgrade: true,
    rememberUpgrade: true,
    reconnection: true,
    reconnectionDelay: RECONNECT_DELAY_BASE,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    timeout: 20000,
    forceNew: false,
    // Autenticación
    auth: token ? { token } : undefined,
    // Headers de autenticación (fallback)
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    // Opciones de rendimiento
    autoConnect: true,
  });

  // Evento: Conectado
  socket.on("connect", () => {
    console.log("✅ Socket conectado:", socket?.id);
    notifyStateChange("connected");
    
    // Re-join room si había una activa
    if (currentRoomId && socket) {
      socket.emit("join-room", currentRoomId);
    }
    
    // Procesar eventos en cola
    processQueuedEvents();
  });

  // Evento: Desconectado
  socket.on("disconnect", (reason) => {
    console.log("❌ Socket desconectado:", reason);
    
    if (reason === "io server disconnect") {
      // El servidor desconectó, intentar reconectar manualmente
      socket?.connect();
    } else if (reason === "io client disconnect") {
      // Cliente desconectó intencionalmente
      notifyStateChange("disconnected");
    } else {
      // Desconexión inesperada, intentar reconectar
      notifyStateChange("reconnecting");
    }
  });

  // Evento: Reconectando
  socket.on("reconnect_attempt", (attemptNumber: number) => {
    console.log(`🔄 Intentando reconectar (${attemptNumber}/${MAX_RECONNECT_ATTEMPTS})...`);
    notifyStateChange("reconnecting");
  });

  // Evento: Reconectado exitosamente
  socket.on("reconnect", (attemptNumber: number) => {
    console.log(`✅ Reconectado exitosamente después de ${attemptNumber} intentos`);
    notifyStateChange("connected");
    
    // Re-join room si había una activa
    if (currentRoomId && socket) {
      socket.emit("join-room", currentRoomId);
    }
    
    // Procesar eventos en cola
    processQueuedEvents();
  });

  // Evento: Error de conexión
  socket.on("connect_error", (error) => {
    console.error("❌ Error de conexión socket:", error.message);
    notifyStateChange("error");
    
    // Si el error es de autenticación, limpiar token
    if (error.message.includes("auth") || error.message.includes("401")) {
      console.warn("⚠️ Error de autenticación en socket, limpiando conexión");
      disconnectSocket();
    }
  });

  // Evento: Error general
  socket.on("error", (error) => {
    console.error("❌ Error en socket:", error);
  });

  notifyStateChange("connecting");
  return socket;
};

// Procesar eventos en cola
const processQueuedEvents = () => {
  if (!socket?.connected || queuedEvents.length === 0) return;
  
  console.log(`📤 Procesando ${queuedEvents.length} eventos en cola...`);
  const events = [...queuedEvents];
  queuedEvents = [];
  
  events.forEach(({ event, data }) => {
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      // Si se desconectó mientras procesábamos, volver a encolar
      queuedEvents.push({ event, data });
    }
  });
};


// Desconectar WebSocket
export const disconnectSocket = () => {
  if (socket) {
    currentRoomId = null;
    queuedEvents = [];
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    notifyStateChange("disconnected");
    console.log("🔌 Socket desconectado y limpiado");
  }
};

// Suscribirse a cambios de estado de conexión
export const onConnectionStateChange = (callback: ConnectionStateCallback): (() => void) => {
  stateCallbacks.add(callback);
  // Llamar inmediatamente con el estado actual
  callback(connectionState);
  
  // Retornar función de limpieza
  return () => {
    stateCallbacks.delete(callback);
  };
};

// Obtener estado actual de conexión
export const getConnectionState = (): SocketConnectionState => {
  return connectionState;
};

// Unirse a una room (con manejo robusto)
export const joinRoom = (roomId: string) => {
  if (!roomId) {
    console.warn("⚠️ Intento de unirse a room sin ID");
    return;
  }

  currentRoomId = roomId;
  
  if (socket?.connected) {
    socket.emit("join-room", roomId);
    console.log(`[socket.service] ✅ Unido a room: ${roomId} (socket conectado)`);
  } else {
    // Si no está conectado, encolar y conectar
    queuedEvents.push({ event: "join-room", data: roomId });
    console.log(`[socket.service] ⏳ Socket no conectado, encolando join-room para ${roomId}`);
    if (!socket || connectionState === "disconnected") {
      connectSocket();
    }
    // Si ya está conectando, el evento se procesará cuando se conecte
    socket?.once("connect", () => {
      socket?.emit("join-room", roomId);
      console.log(`[socket.service] ✅ Unido a room después de reconectar: ${roomId}`);
    });
  }
};

// Salir de una room
export const leaveRoom = (roomId: string) => {
  if (socket?.connected) {
    socket.emit("leave-room", roomId);
    console.log(`👋 Salido de room: ${roomId}`);
  }
  
  if (currentRoomId === roomId) {
    currentRoomId = null;
  }
};

// Escuchar evento de número llamado (optimizado)
export const onNumberCalled = (
  callback: (data: {
    number: string;
    called_at: string;
    round_number: number;
    room_id: string;
  }) => void
): (() => void) => {
  if (!socket) {
    console.log(`[socket.service] 🔌 Socket no existe, conectando...`);
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      console.log(`[socket.service] 📨 Evento 'number-called' recibido:`, data);
      // Validar datos antes de llamar callback
      if (
        data &&
        typeof data === "object" &&
        "number" in data &&
        "room_id" in data &&
        "round_number" in data &&
        "called_at" in data
      ) {
        console.log(`[socket.service] ✅ Datos válidos, llamando callback`);
        callback(data as {
          number: string;
          called_at: string;
          round_number: number;
          room_id: string;
        });
      } else {
        console.warn(`[socket.service] ⚠️ Datos inválidos en evento 'number-called':`, data);
      }
    };
    
    console.log(`[socket.service] 👂 Registrando listener para 'number-called'`);
    socket.on("number-called", handler);
    
    // También registrar el listener cuando se reconecte
    const reconnectHandler = () => {
      console.log(`[socket.service] 🔄 Reconectado, re-registrando listener 'number-called'`);
      socket?.on("number-called", handler);
    };
    socket.on("reconnect", reconnectHandler);
    
    return () => {
      console.log(`[socket.service] 🧹 Removiendo listener 'number-called'`);
      socket?.off("number-called", handler);
      socket?.off("reconnect", reconnectHandler);
    };
  }
  
  return () => {};
};

// Escuchar evento de sala en pending
export const onRoomPending = (
  callback: (data: {
    room_id: string;
    room_name: string;
    next_round_number?: number;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "room_id" in data &&
        "room_name" in data
      ) {
        callback(data as {
          room_id: string;
          room_name: string;
          next_round_number?: number;
        });
      }
    };
    
    socket.on("room-pending", handler);
    
    return () => {
      socket?.off("room-pending", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de round iniciado
export const onRoundStarted = (
  callback: (data: {
    round_number: number;
    room_id: string;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "round_number" in data &&
        "room_id" in data
      ) {
        callback(data as {
          round_number: number;
          room_id: string;
        });
      }
    };
    
    socket.on("round-started", handler);
    
    return () => {
      socket?.off("round-started", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de round finalizado
export const onRoundFinished = (
  callback: (data: {
    round_number: number;
    room_id: string;
    reason?: string;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "round_number" in data &&
        "room_id" in data
      ) {
        callback(data as {
          round_number: number;
          room_id: string;
          reason?: string;
        });
      }
    };
    
    socket.on("round-finished", handler);
    
    return () => {
      socket?.off("round-finished", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de countdown de inicio de sala (pending → in_progress)
export const onRoomStartCountdown = (
  callback: (data: {
    room_id: string;
    seconds_remaining: number;
    finish_timestamp?: number;
    finish_time?: string;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "room_id" in data &&
        "seconds_remaining" in data
      ) {
        callback(data as {
          room_id: string;
          seconds_remaining: number;
          finish_timestamp?: number;
          finish_time?: string;
        });
      }
    };
    
    socket.on("room-start-countdown", handler);
    
    return () => {
      socket?.off("room-start-countdown", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de countdown antes de empezar a llamar números en una nueva ronda
export const onRoundStartCountdown = (
  callback: (data: {
    round_number: number;
    room_id: string;
    seconds_remaining: number;
    finish_timestamp?: number;
    finish_time?: string;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "round_number" in data &&
        "room_id" in data &&
        "seconds_remaining" in data
      ) {
        callback(data as {
          round_number: number;
          room_id: string;
          seconds_remaining: number;
          finish_timestamp?: number;
          finish_time?: string;
        });
      }
    };
    
    socket.on("round-start-countdown", handler);
    
    return () => {
      socket?.off("round-start-countdown", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de actualización de premio en tiempo real
export const onRoomPrizeUpdated = (
  callback: (data: {
    room_id: string;
    room_name: string;
    total_prize: number;
    admin_fee: number;
    total_pot: number;
    enrolled_cards_count: number;
    enrolled_users_count?: number; // Número de usuarios únicos inscritos
    price_per_card: number;
    rewards: Array<{
      round_number: number | null;
      prize_percent: number;
      prize_amount: number;
    }>;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "room_id" in data &&
        "total_prize" in data
      ) {
        callback(data as {
          room_id: string;
          room_name: string;
          total_prize: number;
          admin_fee: number;
          total_pot: number;
          enrolled_cards_count: number;
          price_per_card: number;
          rewards: Array<{
            round_number: number | null;
            prize_percent: number;
            prize_amount: number;
          }>;
        });
      }
    };
    
    socket.on("room-prize-updated", handler);
    
    return () => {
      socket?.off("room-prize-updated", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de sincronización de estado de sala (cuando te unes a una sala con juego activo)
export const onRoomStateSync = (
  callback: (data: {
    room_id: string;
    round: {
      round_number: number;
      pattern: string | null;
      called_numbers: Array<{
        number: string;
        called_at: string;
      }>;
      last_called_at: string | null;
      called_count: number;
      status: string;
    } | null;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "room_id" in data &&
        "round" in data
      ) {
        callback(data as {
          room_id: string;
          round: {
            round_number: number;
            pattern: string | null;
            called_numbers: Array<{
              number: string;
              called_at: string;
            }>;
            last_called_at: string | null;
            called_count: number;
            status: string;
          } | null;
        });
      }
    };
    
    socket.on("room-state-sync", handler);
    
    return () => {
      socket?.off("room-state-sync", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de countdown de timeout
export const onTimeoutCountdown = (
  callback: (data: {
    round_number: number;
    room_id: string;
    seconds_remaining: number;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "seconds_remaining" in data &&
        typeof (data as { seconds_remaining: unknown }).seconds_remaining === "number"
      ) {
        callback(data as {
          round_number: number;
          room_id: string;
          seconds_remaining: number;
        });
      }
    };
    
    socket.on("timeout-countdown", handler);
    
    return () => {
      socket?.off("timeout-countdown", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de countdown de transición entre rondas
export const onRoundTransitionCountdown = (
  callback: (data: {
    round_number: number;
    room_id: string;
    seconds_remaining: number;
    next_round_number: number;
    has_winner?: boolean;
    finish_timestamp?: number;
    finish_time?: string;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "seconds_remaining" in data &&
        typeof (data as { seconds_remaining: unknown }).seconds_remaining === "number"
      ) {
        callback(data as {
          round_number: number;
          room_id: string;
          seconds_remaining: number;
          next_round_number: number;
          has_winner?: boolean;
          finish_timestamp?: number;
          finish_time?: string;
        });
      }
    };
    
    socket.on("round-transition-countdown", handler);
    
    return () => {
      socket?.off("round-transition-countdown", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de countdown de ventana de bingo
export const onBingoClaimCountdown = (
  callback: (data: {
    round_number: number;
    room_id: string;
    seconds_remaining: number;
    finish_timestamp?: number;
    finish_time?: string;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "seconds_remaining" in data &&
        typeof (data as { seconds_remaining: unknown }).seconds_remaining === "number"
      ) {
        callback(data as {
          round_number: number;
          room_id: string;
          seconds_remaining: number;
        });
      }
    };
    
    socket.on("bingo-claim-countdown", handler);
    
    return () => {
      socket?.off("bingo-claim-countdown", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de bingo reclamado
export const onBingoClaimed = (
  callback: (data: {
    round_number: number;
    room_id: string;
    winner: {
      card_id: string;
      user_id: string;
      winner_id: string;
      is_first: boolean;
    };
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "winner" in data &&
        data.winner &&
        typeof data.winner === "object" &&
        "user_id" in data.winner
      ) {
        callback(data as {
          round_number: number;
          room_id: string;
          winner: {
            card_id: string;
            user_id: string;
            winner_id: string;
            is_first: boolean;
          };
        });
      }
    };
    
    socket.on("bingo-claimed", handler);
    
    return () => {
      socket?.off("bingo-claimed", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de actualización de status de sala
export const onRoomStatusUpdated = (
  callback: (data: {
    room_id: string;
    room_name: string;
    status: string;
    status_id: string;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "room_id" in data &&
        "status" in data
      ) {
        callback(data as {
          room_id: string;
          room_name: string;
          status: string;
          status_id: string;
        });
      }
    };
    
    socket.on("room-status-updated", handler);
    
    return () => {
      socket?.off("room-status-updated", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de cambio de status de round
// Escuchar evento de que el countdown fue detenido (para limpiar countdowns obsoletos)
export const onRoundCountdownStopped = (
  callback: (data: {
    round_number: number;
    room_id: string;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "round_number" in data &&
        "room_id" in data
      ) {
        callback(data as {
          round_number: number;
          room_id: string;
        });
      }
    };
    
    socket.on("round-countdown-stopped", handler);
    
    return () => {
      socket?.off("round-countdown-stopped", handler);
    };
  }
  
  return () => {};
};

export const onRoundStatusChanged = (
  callback: (data: {
    round_number: number;
    room_id: string;
    previous_status: string;
    new_status: string;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "round_number" in data &&
        "room_id" in data &&
        "previous_status" in data &&
        "new_status" in data
      ) {
        callback(data as {
          round_number: number;
          room_id: string;
          previous_status: string;
          new_status: string;
        });
      }
    };
    
    socket.on("round-status-changed", handler);
    
    return () => {
      socket?.off("round-status-changed", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de sala finalizada
export const onRoomFinished = (
  callback: (data: {
    room_id: string;
    room_name: string;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "room_id" in data &&
        "room_name" in data
      ) {
        callback(data as {
          room_id: string;
          room_name: string;
        });
      }
    };
    
    socket.on("room-finished", handler);
    
    return () => {
      socket?.off("room-finished", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de cartones inscritos en tiempo real
export const onCardsEnrolled = (
  callback: (data: {
    room_id: string;
    enrolled_card_ids: string[];
    user_id: string;
    enrolled_count: number;
    enrolled_users_count?: number; // Número de usuarios únicos inscritos
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "room_id" in data &&
        "enrolled_card_ids" in data &&
        Array.isArray((data as any).enrolled_card_ids)
      ) {
        callback(data as {
          room_id: string;
          enrolled_card_ids: string[];
          user_id: string;
          enrolled_count: number;
        });
      }
    };
    
    socket.on("cards-enrolled", handler);
    
    return () => {
      socket?.off("cards-enrolled", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de reordenamiento de salas (cuando una sala termina y se crea una nueva)
export const onRoomsReordered = (
  callback: (data: {
    rooms: Array<{
      room_id: string;
      name: string;
      orderIndex: number | null;
    }>;
  }) => void
): (() => void) => {
  if (!socket) {
    connectSocket();
  }
  
  if (socket) {
    const handler = (data: unknown) => {
      if (
        data &&
        typeof data === "object" &&
        "rooms" in data &&
        Array.isArray((data as any).rooms)
      ) {
        callback(data as {
          rooms: Array<{
            room_id: string;
            name: string;
            orderIndex: number | null;
          }>;
        });
      }
    };
    
    socket.on("rooms-reordered", handler);
    
    return () => {
      socket?.off("rooms-reordered", handler);
    };
  }
  
  return () => {};
};

// Obtener instancia del socket
export const getSocket = (): Socket | null => {
  if (!socket) {
    connectSocket();
  }
  return socket;
};

// Verificar si está conectado
export const isConnected = (): boolean => {
  return socket?.connected ?? false;
};

// Limpiar todos los listeners de un evento específico
export const removeAllListeners = (event?: string) => {
  if (socket) {
    if (event) {
      socket.removeAllListeners(event);
    } else {
      socket.removeAllListeners();
    }
  }
};

// Reconectar manualmente
export const reconnect = () => {
  if (socket) {
    socket.disconnect();
    socket.connect();
  } else {
    connectSocket();
  }
};
