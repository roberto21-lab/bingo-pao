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
export async function enrollCards(
  userId: string,
  roomId: string,
  cardIds: string[] // Array de IDs de cartones
): Promise<{ success: boolean; message: string; data: any }> {
  try {
    const response = await api.post<{ 
      success: boolean; 
      message: string; 
      data?: any;
      duplicateCards?: string[];
      errors?: string[];
    }>(
      "/cards/enroll",
      {
        userId,
        roomId,
        cardIds,
      }
    );

    if (response.data.success) {
      return response.data;
    }

    // Si no es exitoso, lanzar error con toda la información
    const error = new Error(response.data.message || "Error al inscribir cartones") as any;
    error.response = {
      data: {
        success: false,
        message: response.data.message,
        duplicateCards: response.data.duplicateCards,
        errors: response.data.errors
      }
    };
    throw error;
  } catch (error: any) {
    // Si es un error de axios, preservar la estructura
    if (error.response) {
      throw error;
    }
    // Si es otro tipo de error, envolverlo
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


