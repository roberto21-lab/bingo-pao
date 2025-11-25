import { api } from "./api";

export type Wallet = {
  _id: string;
  user_id: string;
  currency_id: string | { _id: string; code?: string; name?: string; symbol?: string };
  balance: number;
  frozen_balance: number;
  created_at: string;
  updated_at: string;
};

export type GetWalletByUserResponse = Wallet;

// GET /wallets/user/:userId - obtener wallet por userId
export async function getWalletByUser(userId: string): Promise<Wallet> {
  try {
    const response = await api.get<GetWalletByUserResponse>(
      `/wallets/user/${userId}`
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

