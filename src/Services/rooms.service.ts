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
  switch (statusName) {
    case "waiting_players":
      return "waiting";
    case "preparing":
      return "preparing";
    case "in_progress":
      return "in_progress";
    case "finished":
    case "closed":
      return "locked";
    default:
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

  return {
    id: backendRoom._id,
    title: backendRoom.name,
    price,
    estimatedPrize,
    currency: currencyCode,
    status: mapStatus(status?.name),
    rounds: backendRoom.max_rounds,
    jackpot: estimatedPrize,
    players: playersCount > 0 ? playersString : undefined,
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
    const response = await api.get<{ success: boolean; data: BackendRoom }>(`/rooms/${id}`);
    
    if (response.data.success && response.data.data) {
      return mapBackendRoomToRoom(response.data.data);
    }
    
    throw new Error("Sala no encontrada");
  } catch (error) {
    throw error;
  }
}

