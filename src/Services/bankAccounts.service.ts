import { api } from "./api";

export type BankAccount = {
  _id: string;
  profile_id: string;
  bank_name: string;
  account_number?: string; // Opcional porque puede no existir
  phone_number: string;
  document_number: string;
  document_type_id: {
    _id: string;
    name: string;
    code: string;
  };
  created_at: string;
  updated_at: string;
};

export type CreateBankAccountWithWithdrawRequest = {
  userId: string;
  bank_name: string;
  account_number?: string; // Opcional ahora
  phone_number: string;
  document_number: string;
  document_type_id: string;
  amount: number;
};

export type CreateBankAccountWithWithdrawResponse = {
  message: string;
  bank_account: BankAccount;
  transaction: any;
  new_balance: number;
  new_frozen_balance: number;
};

/**
 * GET /bank-accounts/user/:userId
 * Obtener cuenta bancaria por userId
 */
export async function getBankAccountByUser(userId: string): Promise<BankAccount | null> {
  try {
    const response = await api.get<BankAccount>(`/bank-accounts/user/${userId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No hay cuenta bancaria
    }
    throw error;
  }
}

/**
 * POST /bank-accounts/create
 * Crear solo cuenta bancaria (sin transacción de retiro)
 */
export async function createBankAccount(data: {
  userId: string;
  bank_name: string;
  account_number?: string;
  phone_number: string;
  document_number: string;
  document_type_id: string;
}): Promise<{ message: string; bank_account: BankAccount }> {
  const response = await api.post<{ message: string; bank_account: BankAccount }>(
    "/bank-accounts/create",
    data
  );
  return response.data;
}

/**
 * POST /bank-accounts/create-with-withdraw
 * Crear cuenta bancaria y transacción de retiro
 */
export async function createBankAccountWithWithdraw(
  data: CreateBankAccountWithWithdrawRequest
): Promise<CreateBankAccountWithWithdrawResponse> {
  const response = await api.post<CreateBankAccountWithWithdrawResponse>(
    "/bank-accounts/create-with-withdraw",
    data
  );
  return response.data;
}

/**
 * POST /bank-accounts/create-withdraw-only
 * Crear solo transacción de retiro cuando ya existe cuenta bancaria
 */
export async function createWithdrawOnly(userId: string, amount: number): Promise<CreateBankAccountWithWithdrawResponse> {
  const response = await api.post<CreateBankAccountWithWithdrawResponse>(
    "/bank-accounts/create-withdraw-only",
    { userId, amount }
  );
  return response.data;
}

/**
 * DELETE /bank-accounts/:bankAccountId
 * Eliminar cuenta bancaria
 */
export async function deleteBankAccount(bankAccountId: string): Promise<void> {
  await api.delete(`/bank-accounts/${bankAccountId}`);
}

