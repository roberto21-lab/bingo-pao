import { io, Socket } from "socket.io-client";
import { getToken } from "./auth.service";
import { logger } from "../utils/logger";

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
  // OPTIMIZACIÓN: Si ya está conectado, retornar la instancia existente
  if (socket?.connected) {
    logger.socket("✅ Socket ya conectado, reutilizando instancia existente");
    return socket;
  }

  // OPTIMIZACIÓN: Si existe pero no está conectado, reutilizar la instancia
  if (socket && !socket.connected) {
    logger.socket("🔄 Socket existe pero no conectado, reconectando...");
    socket.connect();
    return socket;
  }

  // Si no existe, crear nueva conexión
  if (socket) {
    // Limpiar instancia anterior si existe
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = getAuthToken();
  
  // Configuración optimizada para baja latencia y reconexión robusta
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
    // CRÍTICO: Configuraciones mejoradas para prevenir desconexiones inesperadas
    // Aumentar timeouts para conexiones lentas
    // pingTimeout: 60000, // 60 segundos - tiempo máximo sin respuesta (no disponible en socket.io-client v4)
    // pingInterval: 25000, // 25 segundos - intervalo entre pings del cliente (no disponible en socket.io-client v4)
    // Autenticación
    auth: token ? { token } : undefined,
    // Headers de autenticación (fallback)
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    // Opciones de rendimiento
    autoConnect: true,
  });

  // Evento: Conectado
  socket.on("connect", () => {
    logger.socket("✅ Socket conectado:", socket?.id);
    notifyStateChange("connected");
    
    // Re-join room si había una activa
    if (currentRoomId && socket) {
      socket.emit("join-room", currentRoomId);
    }
    
    // Re-registrar listeners de wallet-updated después de reconexión
    registerWalletUpdatedListeners();
    
    // Re-registrar listeners de notification después de reconexión
    registerNotificationListeners();
    
    // Procesar eventos en cola
    processQueuedEvents();
  });

  // Evento: Desconectado
  socket.on("disconnect", (reason) => {
    logger.socket("❌ Socket desconectado:", reason);
    
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
    logger.socket(`🔄 Intentando reconectar (${attemptNumber}/${MAX_RECONNECT_ATTEMPTS})...`);
    notifyStateChange("reconnecting");
  });

  // Evento: Reconectado exitosamente
  socket.on("reconnect", (attemptNumber: number) => {
    logger.socket(`✅ Reconectado exitosamente después de ${attemptNumber} intentos`);
    notifyStateChange("connected");
    
    // Re-join room si había una activa
    if (currentRoomId && socket) {
      socket.emit("join-room", currentRoomId);
    }
    
    // Re-registrar listeners de wallet-updated después de reconexión
    registerWalletUpdatedListeners();
    
    // Re-registrar listeners de notification después de reconexión
    registerNotificationListeners();
    
    // Procesar eventos en cola
    processQueuedEvents();
  });

  // Evento: Error de conexión
  socket.on("connect_error", (error) => {
    logger.error("❌ Error de conexión socket:", error.message);
    notifyStateChange("error");
    
    // Si el error es de autenticación, limpiar token
    if (error.message.includes("auth") || error.message.includes("401")) {
      logger.warn("⚠️ Error de autenticación en socket, limpiando conexión");
      disconnectSocket();
    }
  });

  // Evento: Error general
  socket.on("error", (error) => {
    logger.error("❌ Error en socket:", error);
  });

  notifyStateChange("connecting");
  return socket;
};

// Procesar eventos en cola
const processQueuedEvents = () => {
  if (!socket?.connected || queuedEvents.length === 0) return;
  
  logger.socket(`📤 Procesando ${queuedEvents.length} eventos en cola...`);
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
    logger.socket("🔌 Socket desconectado y limpiado");
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
    logger.warn("⚠️ Intento de unirse a room sin ID");
    return;
  }

  currentRoomId = roomId;
  
  if (socket?.connected) {
    socket.emit("join-room", roomId);
    logger.socket(`✅ Unido a room: ${roomId} (socket conectado)`);
  } else {
    // Si no está conectado, encolar y conectar
    queuedEvents.push({ event: "join-room", data: roomId });
    logger.socket(`⏳ Socket no conectado, encolando join-room para ${roomId}`);
    if (!socket || connectionState === "disconnected") {
      connectSocket();
    }
    // Si ya está conectando, el evento se procesará cuando se conecte
    socket?.once("connect", () => {
      socket?.emit("join-room", roomId);
      logger.socket(`✅ Unido a room después de reconectar: ${roomId}`);
    });
  }
};

// Salir de una room
export const leaveRoom = (roomId: string) => {
  if (socket?.connected) {
    socket.emit("leave-room", roomId);
    logger.socket(`👋 Salido de room: ${roomId}`);
  }
  
  if (currentRoomId === roomId) {
    currentRoomId = null;
  }
};

// P5-FIX: Map para trackear handlers activos y evitar duplicados
const activeNumberCalledHandlers = new Set<(data: unknown) => void>();
const activeReconnectHandlers = new Set<() => void>();

// Escuchar evento de número llamado (optimizado)
// P5-FIX: Mejorado para evitar listeners duplicados en reconexión
export const onNumberCalled = (
  callback: (data: {
    number: string;
    called_at: string;
    round_number: number;
    room_id: string;
    server_time?: number; // Timestamp del servidor para sincronización
    next_call_at?: number; // Timestamp del próximo número
    last_three_numbers?: string[]; // Últimos 3 números llamados para sincronización
  }) => void
): (() => void) => {
  if (!socket) {
    logger.socket("🔌 Socket no existe, conectando...");
    connectSocket();
  }
  
  if (socket) {
    // P5-FIX: Crear handler único para este callback
    const handler = (data: unknown) => {
      // Validar datos antes de llamar callback
      if (
        data &&
        typeof data === "object" &&
        "number" in data &&
        "room_id" in data &&
        "round_number" in data &&
        "called_at" in data
      ) {
        callback(data as {
          number: string;
          called_at: string;
          round_number: number;
          room_id: string;
        });
      } else {
        logger.warn("⚠️ Datos inválidos en evento 'number-called':", data);
      }
    };
    
    // P5-FIX: Handler de reconexión único
    const reconnectHandler = () => {
      logger.socket("🔄 Reconectado, verificando listener 'number-called'");
      // P5-FIX: Solo re-registrar si el handler aún está activo
      if (activeNumberCalledHandlers.has(handler)) {
        socket?.off("number-called", handler);
        socket?.on("number-called", handler);
      }
    };
    
    // P5-FIX: Limpiar listeners anteriores ANTES de agregar nuevos
    activeNumberCalledHandlers.forEach(h => socket?.off("number-called", h));
    activeReconnectHandlers.forEach(h => socket?.off("reconnect", h));
    
    // P5-FIX: Registrar nuevos handlers
    activeNumberCalledHandlers.add(handler);
    activeReconnectHandlers.add(reconnectHandler);
    
    socket.on("number-called", handler);
    socket.on("reconnect", reconnectHandler);
    
    logger.socket("👂 P5-FIX: Listener 'number-called' registrado (sin duplicados)");
    
    return () => {
      logger.socket("🧹 P5-FIX: Removiendo listener 'number-called'");
      socket?.off("number-called", handler);
      socket?.off("reconnect", reconnectHandler);
      activeNumberCalledHandlers.delete(handler);
      activeReconnectHandlers.delete(reconnectHandler);
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
// FIX-PATTERN: Ahora incluye el pattern para que el frontend pueda actualizar inmediatamente
export const onRoundStarted = (
  callback: (data: {
    round_number: number;
    room_id: string;
    pattern?: string | null;
    orderIndex?: number | null;
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
          pattern?: string | null;
          orderIndex?: number | null;
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
// SYNC-FIX: Incluye server_time para sincronización entre clientes
export const onRoomStartCountdown = (
  callback: (data: {
    room_id: string;
    seconds_remaining: number;
    finish_timestamp?: number;
    finish_time?: string;
    server_time?: number; // SYNC-FIX: Tiempo del servidor
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
  // Asegurar que el socket esté conectado
  const currentSocket = socket || connectSocket();
  
  if (currentSocket) {
    const handler = (data: unknown) => {
      logger.socket("📥 Evento room-prize-updated recibido", data);
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
    
    currentSocket.on("room-prize-updated", handler);
    
    return () => {
      currentSocket?.off("room-prize-updated", handler);
    };
  }
  
  return () => {};
};

// ISSUE-4: Escuchar evento de actualización de precio de sala
// Este evento se emite cuando el precio de una sala cambia
export const onRoomPriceUpdated = (
  callback: (data: {
    room_id: string;
    room_name: string;
    price_per_card: number;
    currency_id: string;
    total_prize: number;
    admin_fee: number;
    timestamp: number;
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
        "price_per_card" in data
      ) {
        logger.socket("📨 Evento 'room-price-updated' recibido:", data);
        callback(data as {
          room_id: string;
          room_name: string;
          price_per_card: number;
          currency_id: string;
          total_prize: number;
          admin_fee: number;
          timestamp: number;
        });
      }
    };
    
    socket.on("room-price-updated", handler);
    
    return () => {
      socket?.off("room-price-updated", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de sincronización de estado de sala (cuando te unes a una sala con juego activo)
// ISSUE-4: Ahora también incluye datos de la sala para sincronizar precio al reconectar
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
    // ISSUE-4: Datos de la sala para sincronizar precio
    room?: {
      price_per_card: number;
      total_prize: number;
      admin_fee: number;
      name: string;
      currency_id: string;
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
        logger.socket("📨 Evento 'room-state-sync' recibido:", data);
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
          // ISSUE-4: Datos de la sala
          room?: {
            price_per_card: number;
            total_prize: number;
            admin_fee: number;
            name: string;
            currency_id: string;
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
// SYNC-FIX: Incluye server_time para sincronización entre clientes
export const onRoundTransitionCountdown = (
  callback: (data: {
    round_number: number;
    room_id: string;
    seconds_remaining: number;
    next_round_number: number;
    has_winner?: boolean;
    finish_timestamp?: number;
    finish_time?: string;
    server_time?: number; // SYNC-FIX: Tiempo del servidor
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
// SYNC-FIX: Incluye server_time para sincronización entre clientes
export const onBingoClaimCountdown = (
  callback: (data: {
    round_number: number;
    room_id: string;
    seconds_remaining: number;
    finish_timestamp?: number;
    finish_time?: string;
    server_time?: number; // SYNC-FIX: Tiempo del servidor
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
      card_code?: string;
      user_id: string;
      user_name?: string;
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
            card_code?: string;
            user_id: string;
            user_name?: string;
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

// ISSUE-5: Tipos para eventos de notificación de bingo
export interface BingoNotificationPlayer {
  user_id: string;
  user_name?: string;
  card_id: string;
  card_code?: string;
}

export interface BingoNotificationData {
  room_id: string;
  round_number: number;
  player: BingoNotificationPlayer;
  status: "pending" | "confirmed" | "rejected";
  timestamp: number;
  message?: string;
  pattern?: string;
  prize_amount?: string;
  winner_id?: string;
  is_first?: boolean;
}

// ISSUE-5: Escuchar evento de bingo pendiente de validación
export const onBingoClaimedPending = (
  callback: (data: BingoNotificationData) => void
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
        "player" in data &&
        "status" in data
      ) {
        logger.socket("📨 Evento 'bingo_claimed_pending' recibido:", data);
        callback(data as BingoNotificationData);
      }
    };
    
    socket.on("bingo_claimed_pending", handler);
    
    return () => {
      socket?.off("bingo_claimed_pending", handler);
    };
  }
  
  return () => {};
};

// ISSUE-5: Escuchar evento de bingo confirmado
export const onBingoConfirmed = (
  callback: (data: BingoNotificationData) => void
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
        "player" in data &&
        "status" in data
      ) {
        logger.socket("📨 Evento 'bingo_confirmed' recibido:", data);
        callback(data as BingoNotificationData);
      }
    };
    
    socket.on("bingo_confirmed", handler);
    
    return () => {
      socket?.off("bingo_confirmed", handler);
    };
  }
  
  return () => {};
};

// ISSUE-5: Escuchar evento de bingo rechazado
export const onBingoRejected = (
  callback: (data: BingoNotificationData) => void
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
        "player" in data &&
        "status" in data
      ) {
        logger.socket("📨 Evento 'bingo_rejected' recibido:", data);
        callback(data as BingoNotificationData);
      }
    };
    
    socket.on("bingo_rejected", handler);
    
    return () => {
      socket?.off("bingo_rejected", handler);
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

// Escuchar evento de limpieza entre rondas
export const onRoundCleanup = (
  callback: (data: {
    room_id: string;
    previous_round_number: number;
    next_round_number: number;
    cleanup_type: string;
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
        "previous_round_number" in data &&
        "next_round_number" in data
      ) {
        callback(data as {
          room_id: string;
          previous_round_number: number;
          next_round_number: number;
          cleanup_type: string;
        });
      }
    };
    
    socket.on("round-cleanup", handler);
    
    return () => {
      socket?.off("round-cleanup", handler);
    };
  }
  
  return () => {};
};

// ISSUE-3: Escuchar evento de sincronización completa de ronda
// Este evento se emite cuando una nueva ronda está lista para comenzar
// y contiene toda la información necesaria para actualizar la UI
// FASE 4/5: También se emite cada 10 números para recalibrar progress bar
export const onRoundSync = (
  callback: (data: {
    round_number: number;
    room_id: string;
    status: string;
    pattern?: string | null;
    called_numbers?: Array<{ number: string; called_at: string }>;
    called_count: number;
    total_rounds?: number;
    previous_round_finished?: boolean;
    timestamp?: number;
    // FASE 4/5: Nuevos campos para sincronización de progress bar
    server_time?: number;
    next_call_at?: number;
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
        "status" in data
      ) {
        logger.socket("📨 Evento 'round-sync' recibido:", data);
        callback(data as {
          round_number: number;
          room_id: string;
          status: string;
          pattern?: string | null;
          called_numbers?: Array<{ number: string; called_at: string }>;
          called_count: number;
          total_rounds?: number;
          previous_round_finished?: boolean;
          timestamp?: number;
          server_time?: number;
          next_call_at?: number;
        });
      }
    };
    
    socket.on("round-sync", handler);
    
    return () => {
      socket?.off("round-sync", handler);
    };
  }
  
  return () => {};
};

// Escuchar evento de partida iniciada
export const onGameStarted = (
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
    
    socket.on("room-started", handler);
    
    return () => {
      socket?.off("room-started", handler);
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

// Lista de callbacks para notification (para re-registrarlos en reconexión)
const notificationCallbacks = new Set<(notification: {
  _id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
  expires_at?: string;
}) => void>();

// Función para registrar todos los listeners de notification
const registerNotificationListeners = () => {
  if (!socket || !socket.connected) {
    console.log(`[SocketService] ⏸️ No se pueden re-registrar listeners de notification: socket=${!!socket}, connected=${socket?.connected}`);
    return;
  }

  console.log(`[SocketService] 🔄 Re-registrando ${notificationCallbacks.size} listener(s) de notification...`, {
    socketId: socket.id,
    connected: socket.connected
  });
  
  // Remover todos los listeners anteriores para evitar duplicados
  socket.removeAllListeners("notification");
  
  notificationCallbacks.forEach((callback) => {
    const handler = (data: unknown) => {
      console.log("[SocketService] 📥 Evento 'notification' recibido:", data);
      if (
        data &&
        typeof data === "object" &&
        "_id" in data &&
        "type" in data &&
        "title" in data &&
        "message" in data
      ) {
        console.log("[SocketService] ✅ Datos de notificación válidos, ejecutando callback");
        callback(data as {
          _id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data?: Record<string, any>;
          read: boolean;
          read_at?: string;
          created_at: string;
          expires_at?: string;
        });
      } else {
        console.warn("[SocketService] ⚠️ Datos de notificación inválidos:", data);
      }
    };
    
    if (socket) {
      socket.on("notification", handler);
    }
  });
  
  console.log("[SocketService] ✅ Todos los listeners de notification re-registrados", {
    totalListeners: notificationCallbacks.size,
    socketId: socket.id
  });
};

// Escuchar evento de notificaciones en tiempo real
export const onNotification = (
  callback: (notification: {
    _id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    read: boolean;
    read_at?: string;
    created_at: string;
    expires_at?: string;
  }) => void
): (() => void) => {
  // Agregar callback a la lista
  notificationCallbacks.add(callback);
  logger.notification(`📝 Callback agregado a notification (total: ${notificationCallbacks.size})`);
  
  // Asegurar que el socket esté conectado
  const currentSocket = socket || connectSocket();
  
  // OPTIMIZACIÓN: Re-registrar listeners si el socket está conectado
  // Esto asegura que el nuevo callback reciba eventos
  if (currentSocket.connected) {
    registerNotificationListeners();
  } else {
    // Si no está conectado, esperar a que se conecte y luego registrar
    const connectHandler = () => {
      registerNotificationListeners();
    };
    currentSocket.once("connect", connectHandler);
  }
  
  return () => {
    // Remover callback de la lista
    notificationCallbacks.delete(callback);
    logger.notification(`🧹 Callback removido de notification (total: ${notificationCallbacks.size})`);
    
    // Si no hay más callbacks, remover el listener
    if (notificationCallbacks.size === 0 && currentSocket) {
      currentSocket.removeAllListeners("notification");
      logger.notification("🧹 Listener 'notification' removido (no hay más callbacks)");
    }
  };
};

// Desuscribirse de notificaciones
export const offNotification = (handler: (data: any) => void) => {
  if (socket) {
    socket.off("notification", handler);
  }
};

// Lista de callbacks para wallet-updated (para re-registrarlos en reconexión)
const walletUpdatedCallbacks = new Set<(data: {
  wallet_id: string;
  balance: string;
  frozen_balance: string;
  currency: string;
}) => void>();

// Función para registrar todos los listeners de wallet-updated
const registerWalletUpdatedListeners = () => {
  if (!socket || !socket.connected) {
    logger.wallet(`⏸️ No se pueden re-registrar listeners: socket=${!!socket}, connected=${socket?.connected}`);
    return;
  }

  logger.wallet(`🔄 Re-registrando ${walletUpdatedCallbacks.size} listener(s) de wallet-updated...`, {
    socketId: socket.id,
    connected: socket.connected
  });
  
  // OPTIMIZACIÓN: Remover todos los listeners anteriores para evitar duplicados
  socket.removeAllListeners("wallet-updated");
  
  // OPTIMIZACIÓN: Crear un solo handler que distribuye a todos los callbacks
  const masterHandler = (data: unknown) => {
    logger.wallet("📥 Evento wallet-updated recibido:", data);
    if (
      data &&
      typeof data === "object" &&
      "wallet_id" in data &&
      "balance" in data
    ) {
      logger.wallet("✅ Datos de wallet válidos, ejecutando callbacks");
      const walletData = data as {
        wallet_id: string;
        balance: string;
        frozen_balance: string;
        currency: string;
      };
      
      // Ejecutar todos los callbacks
      walletUpdatedCallbacks.forEach((callback) => {
        try {
          callback(walletData);
        } catch (error) {
          logger.error("Error ejecutando callback de wallet-updated:", error);
        }
      });
    } else {
      logger.warn("⚠️ Datos de wallet inválidos:", data);
    }
  };
  
  if (socket) {
    socket.on("wallet-updated", masterHandler);
  }
  
  logger.wallet("✅ Todos los listeners de wallet-updated re-registrados", {
    totalListeners: walletUpdatedCallbacks.size,
    socketId: socket.id
  });
};

// Escuchar evento de actualización de wallet en tiempo real
export const onWalletUpdated = (
  callback: (data: {
    wallet_id: string;
    balance: string;
    frozen_balance: string;
    currency: string;
  }) => void
): (() => void) => {
  // Agregar callback a la lista
  walletUpdatedCallbacks.add(callback);
  logger.wallet(`📝 Callback agregado a wallet-updated (total: ${walletUpdatedCallbacks.size})`);
  
  // Asegurar que el socket esté conectado
  const currentSocket = socket || connectSocket();
  
  // OPTIMIZACIÓN: Re-registrar listeners si el socket está conectado
  // Esto asegura que el nuevo callback reciba eventos
  if (currentSocket.connected) {
    registerWalletUpdatedListeners();
  } else {
    // Si no está conectado, esperar a que se conecte y luego registrar
    const connectHandler = () => {
      registerWalletUpdatedListeners();
    };
    currentSocket.once("connect", connectHandler);
  }
  
  return () => {
    // Remover callback de la lista
    walletUpdatedCallbacks.delete(callback);
    logger.wallet(`🧹 Callback removido de wallet-updated (total: ${walletUpdatedCallbacks.size})`);
    
    // Si no hay más callbacks, remover el listener
    if (walletUpdatedCallbacks.size === 0 && currentSocket) {
      currentSocket.removeAllListeners("wallet-updated");
      logger.wallet("🧹 Listener wallet-updated removido (no hay más callbacks)");
    }
  };
};
