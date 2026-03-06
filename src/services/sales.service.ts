import { http } from "./http";

export type Sale = {
  id: number;
  user_id: number;
  pay_method: string;
  total: number;
  cash_received: number;
  change_returned: number;
  date: string;
  status: number;
  user?: string;
};

export type SalesResponse = {
  success: boolean;
  data: Sale[];
  message?: string;
  error?: string;
};

export type SaleDetailItem = {
  id: number;
  quantity: number;
  description: string;
  price: number;
  subtotal: number;
};

export type SaleDetailResponse = {
  success: boolean;
  data: SaleDetailItem[];
  message?: string;
  error?: string;
};

export type MessageResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export type SaleProductPayload = {
  product_id: number;
  quantity: number;
  price: number;
  cost: number;
  subtotal: number;
};

export type CreateSalePayload = {
  pay_method: string;
  total: number;
  cash_received: number;
  change: number;
  products: SaleProductPayload[];
};

export type CreateSaleCreditPayload = {
  pay_method: string;
  total: number;
  cash_received: number;
  change: number;
  products: SaleProductPayload[];
};

export async function getSales() {
  const { data } = await http.get<SalesResponse>("/sales");
  return data;
}

export async function getSaleDetails(id: number | string) {
  const { data } = await http.get<SaleDetailResponse>(`/sales/${id}`);
  return data;
}

export async function createSale(payload: CreateSalePayload) {
  const { data } = await http.post<MessageResponse>("/sales", payload);
  return data;
}


export async function createSaleCredit(payload: CreateSaleCreditPayload) {
  const { data } = await http.post<MessageResponse>("/sales/credit", payload);
  return data;
}

export async function finalizeCreditSale(id: number | string) {
  const { data } = await http.put<MessageResponse>(`/sales/${id}`);
  return data;
}

export async function deleteSale(id: number | string) {
  const { data } = await http.delete<MessageResponse>(`/sales/${id}`);
  return data;
}