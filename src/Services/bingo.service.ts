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

// ISSUE-1: Error especial para cuando el usuario ya cantó bingo en la ronda
export class BingoAlreadyClaimedError extends Error {
  code: string;
  constructor(message: string) {
    super(message);
    this.name = "BingoAlreadyClaimedError";
    this.code = "BINGO_ALREADY_CLAIMED";
  }
}

// ISSUE-2: Error especial para cuando el cartón ya fue usado en la ronda
export class CardAlreadyClaimedError extends Error {
  code: string;
  cardId?: string;
  constructor(message: string, cardId?: string) {
    super(message);
    this.name = "CardAlreadyClaimedError";
    this.code = "CARD_ALREADY_CLAIMED";
    this.cardId = cardId;
  }
}

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
    // ISSUE-1 & ISSUE-2: Manejar el caso de 409 Conflict
    if (error.response?.status === 409) {
      const code = error.response?.data?.code;
      const message = error.response?.data?.message || "Ya realizaste tu intento de bingo en esta ronda.";
      const cardId = error.response?.data?.data?.card_id;
      
      // ISSUE-2: Error específico para cartón ya usado
      if (code === "CARD_ALREADY_CLAIMED") {
        throw new CardAlreadyClaimedError(message, cardId);
      }
      
      // ISSUE-1: Error para usuario ya cantó bingo
      throw new BingoAlreadyClaimedError(message);
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

export type RoomWinner = {
  round_number: number;
  card_id: string;
  card_code: string;
  card_numbers: (number | "FREE")[][];
  pattern: string;
  prize_amount: string;
  bingo_numbers: string[]; // Números que hicieron bingo
  called_numbers: string[];
  user_id?: string; // ID del usuario ganador
};

export type GetRoomWinnersResponse = {
  success: boolean;
  data: RoomWinner[];
};

// GET /rooms/:roomId/winners - obtener ganadores de una sala
export async function getRoomWinners(roomId: string): Promise<RoomWinner[]> {
  try {
    const response = await api.get<GetRoomWinnersResponse>(
      `/rooms/${roomId}/winners`
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Error al obtener ganadores");
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

