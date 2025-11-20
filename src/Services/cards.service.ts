import { api } from "./api";

export type ApiDecimal = { $numberDecimal: string };

export type BackendCard = {
  _id: string;
  code: string;
  numbers_json: (number | "FREE")[][];
  user_id: string | null;
  room_id: string;
  created_at: string;
};

// GET /cards/room/:roomId/user/:userId - obtener cartones de un usuario en una room
export async function getCardsByRoomAndUser(
  roomId: string,
  userId: string
): Promise<BackendCard[]> {
  try {
    const response = await api.get<{ success: boolean; data: BackendCard[] }>(
      `/cards/room/${roomId}/user/${userId}`
    );

    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    throw error;
  }
}

// POST /cards/assign - asignar cartones a un usuario en una sala
export async function assignCardsToUser(
  userId: string,
  roomId: string,
  quantity: number = 2
): Promise<{ success: boolean; message: string; data: any }> {
  try {
    const response = await api.post<{ success: boolean; message: string; data: any }>(
      "/cards/assign",
      {
        userId,
        roomId,
        quantity,
      }
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error(response.data.message || "Error al asignar cartones");
  } catch (error) {
    throw error;
  }
}

// GET /cards/user/:userId - obtener todas las rooms en las que el usuario tiene cartones
export async function getUserRooms(userId: string): Promise<string[]> {
  try {
    const response = await api.get<{ success: boolean; data: string[] }>(
      `/cards/user/${userId}`
    );

    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    throw error;
  }
}

