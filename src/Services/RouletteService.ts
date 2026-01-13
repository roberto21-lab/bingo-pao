// src/services/RouletteService.ts
import { api } from "./api";

export type SpinOutcome = "win" | "lose";

export type RouletteSpinResponse = {
  ok: boolean;
  outcome: SpinOutcome;
  payout: number;
  balance_after: number;
  pool_round: number;
  pool_cursor: number;
};

export type RouletteSpinErrorCode =
  | "BAD_CLIENT_SPIN_ID"
  | "UNAUTHORIZED"
  | "WALLET_NOT_FOUND"
  | "INSUFFICIENT_BALANCE"
  | "RETRY"
  | "SERVER_ERROR";

/**
 * POST /roulette/spin
 * Body: { clientSpinId: string }
 */
export async function spinRoulette(clientSpinId: string): Promise<RouletteSpinResponse> {
  try {
    const response = await api.post<RouletteSpinResponse>("/roulette/spin", {
      clientSpinId,
    });

    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    // Normalizar error para que el componente lo maneje fácil
    const status = err?.response?.status;
    const code: RouletteSpinErrorCode =
      err?.response?.data?.code || err?.message || "SERVER_ERROR";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e: any = new Error(code);
    e.code = code;
    e.status = status;
    throw e;
  }
}
