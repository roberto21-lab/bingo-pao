export interface RoomDetailData {
  id: string;
  title: string;
  prizeAmount: number;
  currency: string;
  ticketsToStart: number;
  ticketPrice: number;
  status: string;
}

export interface CardMaps {
  availableCards: number[][][];
  indexMap: Map<number, number>;
  cardIdMap: Map<number, string>;
  codeMap: Map<number, string>;
}

export interface EnrollResult {
  message?: string;
  data?: {
    warnings?: string[];
    duplicateCards?: string[];
  };
}

export interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
      duplicateCards?: string[];
      success?: boolean;
    };
  };
}

export type RoomStatus = "waiting" | "preparing" | "in_progress" | "locked" | "finished";
