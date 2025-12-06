import { api } from "./api";

// Tipo para la respuesta optimizada de active-rooms
export type ActiveRoomOptimized = {
  id: string;
  title: string;
  status: "active" | "waiting" | "finished";
  prizeAmount: number;
  currency: string;
  currentRound?: number;
  currentPattern?: string;
  rounds: Array<{
    round_number: number;
    status: string;
    pattern: string | null;
    reward: {
      percent: number;
      amount: number;
      pattern: string | null;
    } | null;
  }>;
};

// Tipo para la respuesta del API (Decimal128 viene como objeto)
export type ApiDecimal = { $numberDecimal: string };

// Tipo para el status del backend
export type BackendStatus = {
  _id: string;
  name: string;
  category: string;
};

// Función helper para normalizar VES a Bs
export const normalizeCurrency = (currencyCode?: string | null): string => {
  if (!currencyCode) return "Bs";
  const normalized = currencyCode.toLowerCase().trim();
  return normalized === "ves" ? "Bs" : currencyCode;
};

// Tipo para la currency del backend
export type BackendCurrency = {
  _id: string;
  code: string;
  name: string;
  symbol: string;
};

// Tipo para la room del backend
export type BackendRoom = {
  _id: string;
  id?: string; // Algunos endpoints devuelven id en lugar de _id
  name: string;
  price_per_card?: ApiDecimal | number; // Puede venir como número o como ApiDecimal
  min_players?: number;
  max_rounds?: number;
  currency_id?: BackendCurrency | string;
  status_id?: BackendStatus | string;
  description?: string | null;
  total_pot?: ApiDecimal | number; // Puede venir como número o como ApiDecimal
  total_prize?: ApiDecimal | number; // Premio total (90% del pool) - puede venir como número o como ApiDecimal
  admin_fee?: ApiDecimal | number; // Puede venir como número o como ApiDecimal
  players?: string[] | any[];
  rewards?: string[] | any[];
  scheduled_at?: string | Date | null; // Hora programada de inicio
  orderIndex?: number | null; // Posición en la cola de juego (1, 2, 3)
  enrolled_users_count?: number; // Número de usuarios únicos inscritos
  created_at?: string;
  updated_at?: string;
};

// Tipo para la room del frontend
export type Room = {
  id: string;
  title: string;
  price: number;
  estimatedPrize: number;
  currency: string;
  status: "waiting" | "preparing" | "in_progress" | "locked";
  rounds?: number;
  jackpot?: number;
  players?: string;
  scheduledAt?: Date | null; // Hora programada de inicio
  orderIndex?: number | null; // Posición en la cola de juego (1, 2, 3)
  minPlayers?: number; // Mínimo de jugadores requeridos
  enrolledUsersCount?: number; // Número de usuarios únicos inscritos
};

// Función para convertir Decimal128 a número
function parseDecimal(decimal: ApiDecimal | string | number | undefined): number {
  if (!decimal) return 0;
  if (typeof decimal === "number") {
    return decimal;
  }
  if (typeof decimal === "string") {
    return parseFloat(decimal) || 0;
  }
  return parseFloat(decimal.$numberDecimal) || 0;
}

// Función para mapear el status del backend al frontend
// CRÍTICO: Esta función debe usarse en TODAS las páginas para unificar el status
// Exportar para uso en otras páginas
export function mapStatus(statusName?: string): "waiting" | "preparing" | "in_progress" | "locked" {
  if (!statusName) {
    console.warn("[rooms.service] Status name es undefined, usando 'waiting' por defecto");
    return "waiting";
  }

  switch (statusName) {
    case "waiting_players":
      return "waiting";
    case "pending":
      // CRÍTICO: pending se mapea a "preparing" para mostrar que la sala está preparándose
      return "preparing";
    case "in_progress":
      return "in_progress";
    case "round_winner":
      // Cuando hay un ganador, la sala sigue en progreso pero en transición
      return "in_progress";
    case "finished":
    case "closed":
      return "locked";
    default:
      console.warn(`[rooms.service] Status desconocido: "${statusName}", usando 'waiting' por defecto`);
      return "waiting";
  }
}

// Función para convertir BackendRoom a Room
function mapBackendRoomToRoom(backendRoom: BackendRoom): Room {
  const currency =
    typeof backendRoom.currency_id === "object" && backendRoom.currency_id
      ? backendRoom.currency_id
      : null;
  const status =
    typeof backendRoom.status_id === "object" && backendRoom.status_id
      ? backendRoom.status_id
      : null;

  // Debug: Log detallado del status recibido
  console.log(`[rooms.service] 🔍 Procesando sala: ${backendRoom.name || backendRoom._id}`);
  console.log(`[rooms.service]    - orderIndex:`, backendRoom.orderIndex);
  console.log(`[rooms.service]    - min_players:`, backendRoom.min_players);
  console.log(`[rooms.service]    - enrolled_users_count:`, backendRoom.enrolled_users_count);
  console.log(`[rooms.service]    - status_id tipo:`, typeof backendRoom.status_id);
  
  if (!status) {
    console.warn(`[rooms.service] ⚠️ Status es null/undefined para sala ${backendRoom.name || backendRoom._id}`);
  } else if (!status.name) {
    console.warn(`[rooms.service] ⚠️ Status no tiene propiedad 'name' para sala ${backendRoom.name || backendRoom._id}:`, status);
  } else {
    console.log(`[rooms.service] ✅ Status encontrado: ${status.name}`);
  }

  const price = parseDecimal(backendRoom.price_per_card);
  // ISSUE-FIX: Usar total_prize como fuente de verdad (90% del premio pool)
  // El backend ahora devuelve tanto total_prize como total_pot para consistencia
  // total_pot se mantiene solo por compatibilidad con código legacy
  const totalPrize = parseDecimal(backendRoom.total_prize ?? backendRoom.total_pot);
  // Normalizar VES a Bs
  const currencyCode = normalizeCurrency(currency?.code);
  // const currencySymbol = currency?.symbol || "Bs";
  // console.log("🚀 ~ mapBackendRoomToRoom ~ currencySymbol:", currencySymbol)

  // Calcular premio estimado
  // Si total_prize ya está calculado, usarlo directamente (es el premio real que se distribuye)
  // Si no, estimar basado en min_players * price_per_card * 0.9 (90% para premios)
  let estimatedPrize = totalPrize;
  if (estimatedPrize === 0 && backendRoom.min_players) {
    // Estimar basado en el mínimo de jugadores
    estimatedPrize = backendRoom.min_players * price * 0.9;
  }

  // Contar jugadores
  const playersCount = backendRoom.players?.length || 0;
  const minPlayers = backendRoom.min_players || 0;
  const playersString = minPlayers > 0 ? `${playersCount}/${minPlayers}` : `${playersCount}`;

  // Parsear scheduled_at si existe
  let scheduledAt: Date | null = null;
  if (backendRoom.scheduled_at) {
    if (backendRoom.scheduled_at instanceof Date) {
      scheduledAt = backendRoom.scheduled_at;
    } else if (typeof backendRoom.scheduled_at === "string") {
      scheduledAt = new Date(backendRoom.scheduled_at);
    }
  }

  const mappedStatus = mapStatus(status?.name);
  
  // Debug: Log del mapeo
  if (status?.name) {
    console.log(`[rooms.service] Sala ${backendRoom.name}: status backend="${status.name}" -> frontend="${mappedStatus}"`);
  }

  return {
    id: backendRoom._id,
    title: backendRoom.name,
    price,
    estimatedPrize,
    currency: currencyCode,
    status: mappedStatus,
    rounds: backendRoom.max_rounds,
    jackpot: estimatedPrize,
    players: playersCount > 0 ? playersString : undefined,
    scheduledAt,
    orderIndex: backendRoom.orderIndex ?? null,
    minPlayers: backendRoom.min_players ?? 2,
    enrolledUsersCount: backendRoom.enrolled_users_count ?? 0,
  };
}

// GET /rooms - obtener todas las salas
export async function getRooms(): Promise<Room[]> {
  try {
    // El backend devuelve un array directo, no un objeto con success/data
    const response = await api.get<BackendRoom[]>("/rooms");
    
    if (Array.isArray(response.data)) {
      return response.data.map(mapBackendRoomToRoom);
    }
    
    return [];
  } catch (error) {
    console.error("Error al obtener salas:", error);
    throw error;
  }
}

// GET /rooms/:id - obtener sala por ID
export async function getRoomById(id: string): Promise<Room> {
  try {
    // El backend ahora devuelve un objeto directo, no envuelto en { success, data }
    const response = await api.get<BackendRoom>(`/rooms/${id}`);
    
    if (response.data) {
      return mapBackendRoomToRoom(response.data);
    }
    
    throw new Error("Sala no encontrada");
  } catch (error) {
    console.error("Error en getRoomById:", error);
    throw error;
  }
}

// GET /users/:userId/active-rooms - obtener salas activas del usuario (OPTIMIZADO)
// Este endpoint devuelve toda la información necesaria en un solo request
export async function getUserActiveRooms(userId: string): Promise<ActiveRoomOptimized[]> {
  try {
    const response = await api.get<{ success: boolean; data: ActiveRoomOptimized[] }>(
      `/users/${userId}/active-rooms`
    );
    
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error("Error al obtener salas activas del usuario:", error);
    
    // Traducir errores comunes al español
    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = String(error.message);
      
      // Errores de red
      if (errorMessage.includes("Network Error") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND")) {
        throw new Error("Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.");
      }
      
      // Error 404
      if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
        throw new Error("No se encontraron salas activas para este usuario.");
      }
      
      // Error 500
      if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
        throw new Error("Error del servidor. Por favor, intenta nuevamente más tarde.");
      }
      
      // Otros errores
      throw new Error(`Error al cargar las salas: ${errorMessage}`);
    }
    
    throw new Error("Error desconocido al cargar las salas activas. Por favor, intenta nuevamente.");
  }
}

/**
 * ISSUE-7: Tipo para el estado completo de la sala (para sincronización al reconectar)
 */
export interface RoomStateData {
  room: {
    _id: string;
    name: string;
    status: string;
    max_rounds: number;
    price_per_card: number;
    total_prize: number;
  };
  gameSession: {
    _id: string;
    session_number: number;
    status: string;
    started_at: string;
    total_prize: string;
    players_count: number;
    cards_enrolled: number;
  } | null;
  currentRound: number;
  totalRounds: number;
  rounds: Array<{
    round_number: number;
    status: string;
    pattern: string;
    called_numbers: string[];
    called_count: number;
    bingo_claim_window_finish_at: string | null;
  }>;
  calledNumbers: string[];
  bingoState: {
    windowActive: boolean;
    windowFinishAt: string | null;
    claims: Array<{
      claim_id: string;
      user_id: string;
      user_name: string;
      card_id: string;
      card_code: string;
      validated: boolean;
      is_valid: boolean;
      claim_at: string;
    }>;
    winners: Array<{
      winner_id: string;
      user_id: string;
      user_name: string;
      card_id: string;
      card_code: string;
    }>;
    hasWinner: boolean;
  };
  serverTime: number;
}

/**
 * ISSUE-7: GET /rooms/:id/status - obtener estado completo de la sala para sincronización
 * Este endpoint devuelve toda la información necesaria para sincronizar el estado del cliente
 * después de una reconexión de WebSocket
 */
export async function getRoomState(roomId: string): Promise<RoomStateData | null> {
  try {
    const response = await api.get<{ success: boolean; data: RoomStateData }>(
      `/rooms/${roomId}/status`
    );
    
    if (response.data.success && response.data.data) {
      console.log(`[rooms.service] Estado de sala ${roomId} obtenido correctamente`);
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error("Error al obtener estado de sala:", error);
    return null;
  }
}

/**
 * P2-FIX: Tipo para la respuesta de premios centralizada
 * Esta es la ÚNICA fuente de verdad para los premios
 */
export interface RoomPrizesData {
  room_id: string;
  room_name: string;
  currency: BackendCurrency | null;
  price_per_card: number;
  enrolled_cards_count: number;
  enrolled_users_count: number;
  total_pot: number;
  admin_fee: number;
  prize_pool: number;
  total_prize: number;
  round_prizes: Array<{
    round_number: number;
    percent: number;
    amount: number;
  }>;
  stored_rewards: Array<{
    round_number: number;
    percent: number;
    stored_amount: number;
  }>;
  server_time: number;
}

/**
 * P2-FIX: GET /rooms/:id/prizes - obtener premios centralizados de una sala
 * Esta es la ÚNICA fuente de verdad para los premios
 * Home y GameInProgress DEBEN usar este endpoint
 */
export async function getRoomPrizes(roomId: string): Promise<RoomPrizesData | null> {
  try {
    const response = await api.get<{ success: boolean; data: RoomPrizesData }>(
      `/rooms/${roomId}/prizes`
    );
    
    if (response.data.success && response.data.data) {
      console.log(`[rooms.service] P2-FIX: Premios de sala ${roomId} obtenidos correctamente`, {
        total_prize: response.data.data.total_prize,
        enrolled_cards: response.data.data.enrolled_cards_count,
      });
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error("[rooms.service] P2-FIX: Error al obtener premios de sala:", error);
    return null;
  }
}

