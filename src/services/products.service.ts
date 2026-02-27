import { http } from "./http";

export type Product = {
  id: number;
  description: string;
  category_id: number;
  category: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  status: number;
};

export type ProductsResponse = {
  success: boolean;
  data: Product[];
  message?: string;
  error?: string;
};

export type ProductResponse = {
  success: boolean;
  data: Product;
  message?: string;
  error?: string;
};

export type MessageResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export type LowStockProduct = Product;
export type LowStockResponse = ProductsResponse;

export type CreateProductPayload = {
  description: string;
  category_id: number;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
};

export type UpdateProductPayload = {
  id: number;
  description: string;
  category_id: number;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
};

// ✅ TODOS
export async function getAllProducts() {
  const { data } = await http.get<ProductsResponse>("/products");
  return data;
}

// ✅ ACTIVOS
export async function getActiveProducts() {
  const { data } = await http.get<ProductsResponse>("/products/active");
  return data;
}

// ✅ STOCK BAJO
export async function getLowStockProducts() {
  const { data } = await http.get<LowStockResponse>("/products/low");
  return data;
}

export async function getProductById(id: number | string) {
  const { data } = await http.get<ProductResponse>(`/products/${id}`);
  return data;
}

export async function createProduct(payload: CreateProductPayload) {
  const { data } = await http.post<MessageResponse>("/products", payload);
  return data;
}

// PUT /api/products/:id con id en body (como tu backend lo pide)
export async function updateProduct(payload: UpdateProductPayload) {
  const { data } = await http.put<MessageResponse>("/products", payload);
  return data;
}

// PATCH /api/products/:id sin body (si tu backend lo deja así)
// Si tu backend sí exige {status:1}, dime y lo cambiamos.
export async function activateProduct(id: number | string) {
  const { data } = await http.patch<MessageResponse>(`/products/${id}`);
  return data;
}

export async function deleteProduct(id: number | string) {
  const { data } = await http.delete<MessageResponse>(`/products/${id}`);
  return data;
}