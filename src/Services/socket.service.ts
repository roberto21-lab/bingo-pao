import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

let socket: Socket | null = null;

// Inicializar conexión WebSocket
export const connectSocket = (): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    // Socket conectado
  });

  socket.on("disconnect", () => {
    // Socket desconectado
  });

  socket.on("connect_error", () => {
    // Error de conexión
  });

  return socket;
};

// Desconectar WebSocket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Unirse a una room
export const joinRoom = (roomId: string) => {
  if (socket) {
    if (socket.connected) {
      socket.emit("join-room", roomId);
    } else {
      socket.once("connect", () => {
        socket?.emit("join-room", roomId);
      });
    }
  }
};

// Salir de una room
export const leaveRoom = (roomId: string) => {
  if (socket) {
    socket.emit("leave-room", roomId);
  }
};

// Escuchar evento de número llamado
export const onNumberCalled = (
  callback: (data: {
    number: string;
    called_at: string;
    round_number: number;
    room_id: string;
  }) => void
) => {
  if (socket) {
    socket.on("number-called", callback);
    return () => {
      socket?.off("number-called", callback);
    };
  }
  return () => {};
};

// Escuchar evento de round finalizado
export const onRoundFinished = (
  callback: (data: {
    round_number: number;
    room_id: string;
    reason?: string; // "timeout" cuando se finaliza por timeout sin ganador
  }) => void
) => {
  if (socket) {
    socket.on("round-finished", callback);
    return () => {
      socket?.off("round-finished", callback);
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
) => {
  if (socket) {
    socket.on("timeout-countdown", callback);
    return () => {
      socket?.off("timeout-countdown", callback);
    };
  }
  return () => {};
};

// Obtener instancia del socket
export const getSocket = (): Socket | null => {
  return socket;
};

