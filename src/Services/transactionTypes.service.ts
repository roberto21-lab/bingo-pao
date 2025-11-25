import { api } from "./api";

export type TransactionType = {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

/**
 * GET /transaction-types
 * Obtener todos los tipos de transacción
 */
export async function getTransactionTypes(): Promise<TransactionType[]> {
  const response = await api.get<TransactionType[]>("/transaction-types");
  return response.data;
}

/**
 * Obtener el tipo de transacción por nombre
 */
export async function getTransactionTypeByName(name: string): Promise<TransactionType | null> {
  const types = await getTransactionTypes();
  return types.find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
}

