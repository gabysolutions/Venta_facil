import { http } from "./http";

export type SalesInfoResponse = {
  success: boolean;
  data: {
    daily_transactions: number;
    daily_total: number;
    monthly_transactions: number;
    monthly_total: number;
  };
  message?: string;
  error?: string;
};

export type ProfitResponse = {
  success: boolean;
  data: {
    day_amount: number;
    month_amount: number;
  };
  message?: string;
  error?: string;
};

export type BalanceResponse = {
  success: boolean;
  data: {
    id: number;
    open_date: string; // "2026-02-23 16:35:12"
    initial_cash: number;
    cash_sales: number;
    transactions: number;
    name: string; // cajero
  };
  message?: string;
  error?: string;
};

export type BalanceHistoryResponse = {
  success: boolean;
  data: {
    id: number;
    open_user: string;
    open_date: string;
    initial_cash: number;
    cash_sales: number;
    card_sales: number;
    transfer_sales: number;
    cash_expenses: number;
    expected_cash: number;
    counted_cash: number;
    difference: number;
    note: string;
    close_user: string;
    close_date: string;
    sales: {
      id: number;
      user_id: number;
      pay_method: string;
      total: number;
      cash_received: number;
      change_returned: number;
      date: string;
      status: number;
      user: string;
      detail: {
        id: number;
        quantity: number;
        description: string;
        price: number;
        subtotal: number;
      }[];
    }[];
  }[];
  message?: string;
  error?: string;
};

export async function getSalesInfo() {
  const { data } = await http.get<SalesInfoResponse>("/reports/salesInfo");
  return data;
}

export async function getProfitInfo() {
  const { data } = await http.get<ProfitResponse>("/reports/profit");
  return data;
}

export async function getActiveBalance() {
  const { data } = await http.get<BalanceResponse>("/balances");
  return data;
}

export async function getBalanceHistory() {
  const { data } = await http.get<BalanceHistoryResponse>("/reports/balances");
  return data;
}



