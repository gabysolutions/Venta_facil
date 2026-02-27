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