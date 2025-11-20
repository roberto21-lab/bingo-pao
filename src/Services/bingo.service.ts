import { api } from "./api";

export type ClaimBingoRequest = {
  cardId: string;
  userId: string;
  markedNumbers: string[]; // Array de números en formato "B-7", "I-22", etc.
};

export type ClaimBingoResponse = {
  success: boolean;
  message: string;
  data: {
    round_number: number;
    pattern: string;
    card_id: string;
    user_id: string;
  };
};

// POST /rooms/:roomId/rounds/:roundNumber/claim-bingo - reclamar bingo
export async function claimBingo(
  roomId: string,
  roundNumber: number,
  request: ClaimBingoRequest
): Promise<ClaimBingoResponse> {
  try {
    const response = await api.post<ClaimBingoResponse>(
      `/rooms/${roomId}/rounds/${roundNumber}/claim-bingo`,
      request
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error("Error al reclamar bingo");
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

