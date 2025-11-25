import axios from "axios";

const API_URL = "http://localhost:3000"; // ⬅️ Ajusta tu URL base

export type CreateTransactionPayload = {
  wallet_id: string;
  transaction_type_id: string;
  amount: number;               // Puede ser number o string, tu backend lo convierte
  currency_id: string;
  status_id: string;
  metadata?: any;               // Opcional
};

export async function createTransactionService(
  payload: CreateTransactionPayload
) {
  try {
    const { data } = await axios.post(`${API_URL}/transactions`, payload);
    return data;
  } catch (error: any) {
    console.error("Error creando transacción:", error);
    throw error?.response?.data || { message: "Error en createTransactionService" };
  }
}
