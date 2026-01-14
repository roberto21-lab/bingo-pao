import { api } from "./api";

export type BackendRound = {
  _id: string;
  room_id: string;
  round_number: number;
  pattern_id: {
    _id: string;
    name: string;
    description?: string;
  } | string;
  status_id: {
    _id: string;
    name: string;
    category: string;
  } | string;
  prize_percent: number;
  reward?: {
    percent: number;
    amount: number;
    pattern: string | null;
  } | null;
  // FIX-RELOAD: Optional called_numbers array for state persistence
  called_numbers?: Array<{
    number: string;
    called_at: string;
  }>;
  created_at: string;
  updated_at: string;
};

// GET /rooms/:id/rounds - obtener rounds de una sala
export async function getRoomRounds(roomId: string): Promise<BackendRound[]> {
  try {
    const response = await api.get<{ success: boolean; data: BackendRound[] }>(
      `/rooms/${roomId}/rounds`
    );

    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    throw error;
  }
}

