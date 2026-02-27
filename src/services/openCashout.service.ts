
import { http } from "./http";


export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
};



export type ActiveCashout = {
  id: number;
  open_date: string;

  initial_cash: number;

  cash_sales: number;
  transfer_sales: number;
  card_sales: number;

  cash_expenses: number;
  refund_sales: number;

  transactions: number;
  name: string;
};



export async function openCashout(initial_amount: number) {
  const { data } = await http.post<ApiResponse<null>>("/api/balances", {
    initial_amount,
  });

  return data;
}


export async function getActiveCashout() {
  const { data } = await http.get<ApiResponse<ActiveCashout | null>>(
    "/api/balances"
  );

  return data;
}



export type CloseCashoutPayload = {
  counted_cash: number;
  note?: string;
};

export async function closeCashout(payload: CloseCashoutPayload) {
  const { data } = await http.put<ApiResponse<null>>(
    "/api/balances",
    payload
  );

  return data;
}