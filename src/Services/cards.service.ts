import { api } from "./api";

export type ApiDecimal = { $numberDecimal: string };

export type BackendCard = {
  _id: string;
  code: string;
  numbers_json: (number | "FREE")[][];
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
    console.log("📡 Llamando a /cards/user/" + userId);
    const response = await api.get<{ success: boolean; data: string[] }>(
      `/cards/user/${userId}`
    );

    console.log("📥 Respuesta del servidor:", response.data);

    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    console.warn("⚠️ Respuesta no tiene el formato esperado:", response.data);
    return [];
  } catch (error) {
    console.error("❌ Error en getUserRooms:", error);
    throw error;
  }
}

// POST /cards/enroll - inscribir cartones específicos seleccionados por el usuario
// AHORA USA enrollmentQueueId en lugar de roomId
export async function enrollCards(
  userId: string,
  enrollmentQueueId: string, // NUEVO: ID de la lista de inscripciones
  cardIds: string[] // Array de IDs de cartones
): Promise<{ success: boolean; message: string; data: any }> {
  try {
    const response = await api.post<{ success: boolean; message: string; data: any }>(
      "/cards/enroll",
      {
        userId,
        enrollmentQueueId, // NUEVO: usar enrollmentQueueId
        cardIds,
      }
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error(response.data.message || "Error al inscribir cartones");
  } catch (error) {
    throw error;
  }
}

// GET /cards/room/:roomId/available - obtener cartones disponibles para una sala
export async function getAvailableCards(roomId: string): Promise<BackendCard[]> {
  try {
    const response = await api.get<{ success: boolean; data: BackendCard[] }>(
      `/cards/room/${roomId}/available`
    );

    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    throw error;
  }
}

// GET /cards/enrollment-queue/:enrollmentQueueId/available - obtener cartones disponibles para una lista de inscripciones
export async function getAvailableCardsForQueue(enrollmentQueueId: string): Promise<BackendCard[]> {
  try {
    const response = await api.get<{ success: boolean; data: BackendCard[] }>(
      `/cards/enrollment-queue/${enrollmentQueueId}/available`
    );

    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    throw error;
  }
}


