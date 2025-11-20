import { api } from "./api";

export type CalledNumber = {
  _id: string;
  room_id: string;
  round_number: number;
  number: string;
  called_at: string;
  created_at: string;
  updated_at: string;
};

// GET /rooms/:roomId/called-numbers - obtener historial de números llamados
export async function getCalledNumbers(
  roomId: string,
  round?: number
): Promise<CalledNumber[]> {
  try {
    const params = round ? `?round=${round}` : "";
    const response = await api.get<{ success: boolean; data: CalledNumber[] }>(
      `/rooms/${roomId}/called-numbers${params}`
    );

    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    throw error;
  }
}

// POST /rooms/:roomId/call-number - llamar un número específico
export async function callNumber(
  roomId: string,
  number: string,
  roundNumber?: number
): Promise<CalledNumber> {
  try {
    const response = await api.post<{ success: boolean; data: CalledNumber }>(
      `/rooms/${roomId}/call-number`,
      {
        number,
        round_number: roundNumber
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error("Error al llamar número");
  } catch (error) {
    throw error;
  }
}

// POST /rooms/:roomId/call-random-number - llamar un número aleatorio
export async function callRandomNumber(
  roomId: string,
  roundNumber?: number
): Promise<CalledNumber> {
  try {
    const params = roundNumber ? `?round_number=${roundNumber}` : "";
    const response = await api.post<{ success: boolean; data: CalledNumber }>(
      `/rooms/${roomId}/call-random-number${params}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error("Error al llamar número aleatorio");
  } catch (error) {
    throw error;
  }
}

// DELETE /rooms/:roomId/called-numbers - limpiar historial de números llamados
export async function clearCalledNumbers(
  roomId: string,
  round?: number
): Promise<{ success: boolean; message: string; deletedCount: number }> {
  try {
    const params = round ? `?round=${round}` : "";
    const response = await api.delete<{ success: boolean; message: string; deletedCount: number }>(
      `/rooms/${roomId}/called-numbers${params}`
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error("Error al limpiar números llamados");
  } catch (error) {
    throw error;
  }
}

