import { api } from "./api";

export type CreateTransactionPayload = {
  wallet_id: string;
  transaction_type_id: string;
  amount: number;
  currency_id: string;
  status_id?: string; // Opcional, el backend puede asignarlo automáticamente
  metadata?: any;
};

export type Transaction = {
  _id: string;
  wallet_id: string;
  transaction_type_id: string;
  amount: string;
  currency_id: string;
  status_id: string;
  metadata?: any;
  created_at: string;
};

/**
 * POST /transactions
 * Crear una nueva transacción
 */
export async function createTransactionService(
  payload: CreateTransactionPayload
): Promise<Transaction> {
  const response = await api.post<Transaction>("/transactions", payload);
  return response.data;
}
