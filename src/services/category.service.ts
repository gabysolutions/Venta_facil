import { http } from "./http";

/** ====== TYPES ====== */
export type Category = {
  id: number;
  description: string;
  status: number;
};

export type CategoriesResponse = {
  success: boolean;
  data: Category[];
  message?: string;
  error?: string;
};

export type CategoryResponse = {
  success: boolean;
  data: Category;
  message?: string;
  error?: string;
};

export type MessageResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

/** ====== GET ALL ====== */
export async function getAllCategories() {
  const { data } = await http.get<CategoriesResponse>("/categories");
  return data;
}

/** ====== GET ACTIVE (YA LA USAS) ====== */
export type ActiveCategoriesResponse = CategoriesResponse;

export async function getActiveCategories() {
  const { data } = await http.get<ActiveCategoriesResponse>("/categories/active");
  return data;
}

/** ====== GET BY ID ====== */
export async function getCategoryById(id: number | string) {
  const { data } = await http.get<CategoryResponse>(`/categories/${id}`);
  return data;
}

/** ====== CREATE ====== */
export type CreateCategoryPayload = {
  description: string;
};

export async function createCategory(payload: CreateCategoryPayload) {
  const { data } = await http.post<MessageResponse>("/categories", payload);
  return data;
}

/** ====== UPDATE (PUT) ====== */
export type UpdateCategoryPayload = {
  id: number;
  description: string;
};

export async function updateCategory(payload: UpdateCategoryPayload) {
  const { data } = await http.put<MessageResponse>("/categories", payload);
  return data;
}

/** ====== ACTIVATE (PATCH) ====== */
export async function activateCategory(id: number | string) {
  const { data } = await http.patch<MessageResponse>(`/categories/${id}`);
  return data;
}

/** ====== DELETE ====== */
export async function deleteCategory(id: number | string) {
  const { data } = await http.delete<MessageResponse>(`/categories/${id}`);
  return data;
}