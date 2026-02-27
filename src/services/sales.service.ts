import { http } from "./http";

/** ====== LISTADO (CABECERA) ====== */
export type Sale = {
  id: number;
  user_id: number;
  pay_method: string; // "Efectivo" | "Transferencia" | etc
  total: number;
  cash_received: number;
  change_returned: number;
  date: string; // "YYYY-MM-DD HH:mm:ss"
  status: number; // 1 activo, 0 cancelado/inactivo
  user?: string; // "Ornán Gabriel"
};

export type SalesResponse = {
  success: boolean;
  data: Sale[];
  message?: string;
  error?: string;
};

/** ====== DETALLE (ITEMS) ====== */
export type SaleDetailItem = {
  id: number; // id del producto o id del detalle (según backend)
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

/** Payload para crear venta */
export type SaleProductPayload = {
  product_id: number;
  quantity: number;
  price: number;
  cost: number;
  subtotal: number;
};

export type CreateSalePayload = {
  pay_method: string; // tu ejemplo manda "efectivo" (lowercase)
  total: number;
  cash_received: number;
  change: number; // en GET viene como change_returned
  products: SaleProductPayload[];
};

/** GET: listar ventas */
export async function getSales() {
  const { data } = await http.get<SalesResponse>("/sales");
  return data;
}

/** GET: obtener detalle (items) de una venta por id */
export async function getSaleDetails(id: number | string) {
  const { data } = await http.get<SaleDetailResponse>(`/sales/${id}`);
  return data;
}

/** POST: crear venta */
export async function createSale(payload: CreateSalePayload) {
  const { data } = await http.post<MessageResponse>("/sales", payload);
  return data;
}

/** DELETE: cancelar/eliminar venta por id (sin body)
 *  OJO: si tu backend usa el mismo /api/sales/:id para GET detalle,
 *  esto sigue funcionando porque el método es DELETE.
 */
export async function deleteSale(id: number | string) {
  const { data } = await http.delete<MessageResponse>(`/sales/${id}`);
  return data;
}