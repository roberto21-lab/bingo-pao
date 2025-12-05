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
  wallet_id: string | { _id: string };
  transaction_type_id: string | { _id: string; name: string; description: string };
  amount: number;
  currency_id: string | { _id: string; code: string; name: string };
  status_id: string | { _id: string; name: string; category: string };
  metadata?: any;
  created_at: string;
  updated_at?: string;
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

/**
 * GET /transactions
 * Obtener todas las transacciones (con filtros opcionales)
 */
export async function getTransactions(params?: {
  wallet_id?: string;
  user_id?: string;
  transaction_type_id?: string;
  status_id?: string;
  limit?: number;
  offset?: number;
}): Promise<Transaction[]> {
  const response = await api.get<Transaction[]>("/transactions", { params });
  return response.data;
}

/**
 * GET /transactions/user/:userId
 * Obtener todas las transacciones de un usuario específico
 */
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const response = await api.get<Transaction[]>(`/transactions/user/${userId}`);
  return response.data;
}

/**
 * GET /transactions/wallet/:walletId/transactions
 * Obtener todas las transacciones de una wallet específica
 */
export async function getWalletTransactions(walletId: string): Promise<Transaction[]> {
  const response = await api.get<{ transactions: Transaction[] }>(`/transactions/wallet/${walletId}/transactions`);
  return response.data.transactions || [];
}
