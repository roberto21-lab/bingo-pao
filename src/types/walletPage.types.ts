import type { Transaction } from "../Services/transaction.service";

export interface TransactionDisplay {
  id: string;
  type: string;
  typeLabel: string;
  amount: number;
  description: string;
  status?: string;
  statusLabel?: string;
  createdAt: string;
}

export interface UserProfile {
  document_type_id?: {
    _id: string;
    code: string;
  };
  document_number?: string;
  phone?: string;
}

export interface WalletUpdateData {
  balance?: string;
  frozen_balance?: string;
}

export interface TransactionTypeId {
  _id: string;
  name?: string;
}

export interface TransactionStatusId {
  _id: string;
}

export interface TransactionWithPopulatedFields extends Omit<Transaction, 'transaction_type_id' | 'status_id'> {
  transaction_type_id?: string | TransactionTypeId;
  status_id?: string | TransactionStatusId;
}

export interface Decimal128Amount {
  $numberDecimal: string;
}

export type AmountType = number | string | Decimal128Amount | undefined | null;

export interface TransactionMetadata {
  bank_name?: string;
  room_name?: string;
  round_number?: number | string;
}
