import { api } from "./api";

// Tipo para la respuesta del API (Decimal128 viene como objeto)
export type ApiDecimal = { $numberDecimal: string };

// Tipo para el status del backend
export type BackendStatus = {
  _id: string;
  name: string;
  category: string;
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
  admin_fee?: ApiDecimal | number; // Puede venir como número o como ApiDecimal
  players?: string[] | any[];
  rewards?: string[] | any[];
  scheduled_at?: string | Date | null; // Hora programada de inicio
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
function mapStatus(statusName?: string): "waiting" | "preparing" | "in_progress" | "locked" {
  if (!statusName) {
    console.warn("[rooms.service] Status name es undefined, usando 'waiting' por defecto");
    return "waiting";
  }

  switch (statusName) {
    case "waiting_players":
      return "waiting";
    case "preparing":
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
  console.log(`[rooms.service]    - status_id tipo:`, typeof backendRoom.status_id);
  console.log(`[rooms.service]    - status_id valor:`, JSON.stringify(backendRoom.status_id, null, 2));
  
  if (!status) {
    console.warn(`[rooms.service] ⚠️ Status es null/undefined para sala ${backendRoom.name || backendRoom._id}`);
  } else if (!status.name) {
    console.warn(`[rooms.service] ⚠️ Status no tiene propiedad 'name' para sala ${backendRoom.name || backendRoom._id}:`, status);
  } else {
    console.log(`[rooms.service] ✅ Status encontrado: ${status.name}`);
  }

  const price = parseDecimal(backendRoom.price_per_card);
  const totalPot = parseDecimal(backendRoom.total_pot);
  const currencyCode = currency?.code || "USD";
  const currencySymbol = currency?.symbol || "$";

  // Calcular premio estimado
  // Si total_pot ya está calculado, usarlo directamente
  // Si no, estimar basado en min_players * price_per_card * 0.9 (90% para premios)
  let estimatedPrize = totalPot;
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

