import { http } from "./http";


export type Expense = {
  id: number;
  balance_id: number;
  user_id: number;
  description: string;
  category: string;     // "Servicio" | "Transporte" | "Otro" (si quieres lo hacemos union)
  pay_method: string;   // "Efectivo" | "Tarjeta" | etc
  note: string | null;
  register_date: string; // viene tipo ISO: "2026-02-20T20:20:00.000Z"
  status: number;        // 1 activo, 0 inactivo (según tu backend)
  amount: number;
};

export type ExpensesResponse = {
  success: boolean;
  data: Expense[];
  message?: string;
  error?: string;
};

export type ExpenseResponse = {
  success: boolean;
  data: Expense;
  message?: string;
  error?: string;
};

export type MessageResponse = {
  success: boolean;
  message?: string;
  error?: string;
};


export type CreateExpensePayload = {
  description: string;
  amount: number;
  category: string;
  pay_method: string;
  note?: string; // opcional
  register_date: string; // "YYYY-MM-DD HH:mm:ss"
};

export async function getExpenses() {
  const { data } = await http.get<ExpensesResponse>("/expenses");
  return data;
}


export async function createExpense(payload: CreateExpensePayload) {
  const { data } = await http.post<MessageResponse>("/expenses", payload);
  return data;
}


export async function deleteExpense(id: number | string) {
  const { data } = await http.delete<MessageResponse>(`/expenses/${id}`);
  return data;
}