import type { ActiveRoomOptimized } from "../Services/rooms.service";

export interface ActiveRoom {
  id: string;
  title: string;
  status: "active" | "waiting" | "finished";
  prizeAmount: number;
  currency: string;
  currentRound?: number;
  currentPattern?: string;
}

export interface UserProfile {
  document_type_id?: {
    _id: string;
    code: string;
  };
  document_number?: string;
  phone?: string;
}

export interface WithdrawFormData {
  bankName: string;
  document_type_id: string;
  docId: string;
  phone: string;
  amount: string;
  notes: string;
}

export interface WalletUpdateData {
  balance?: string;
  frozen_balance?: string;
}

export function mapOptimizedToActiveRoom(optimized: ActiveRoomOptimized): ActiveRoom {
  return {
    id: optimized.id,
    title: optimized.title,
    status: optimized.status,
    prizeAmount: optimized.prizeAmount,
    currency: optimized.currency,
    currentRound: optimized.currentRound,
    currentPattern: optimized.currentPattern,
  };
}
