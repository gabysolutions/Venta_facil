import { http } from "./http";
import type { ApiRole } from "../config/permissions";
import axios from "axios";

export type ApiLoginResponse = {
  success: boolean;
  data?: {
    user: {
      id: number;
      name: string;
      role: ApiRole;
    };
    token: string;
  };
  message?: string;
  error?: string;
};

export async function loginRequest(user: string, password: string) {
  try {
    const { data } = await http.post<ApiLoginResponse>("/api/auth/login", {
      user,
      password,
    });

    
    if (!data.success) {
      const msg = data.error || data.message || "Credenciales inválidas";
      throw new Error(msg);
    }

 
    if (!data.data?.token) {
      throw new Error("Respuesta de login inválida ");
    }

    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const backendMsg =
        (error.response?.data as any)?.error ||
        (error.response?.data as any)?.message;

      throw new Error(backendMsg || "Error al conectar con el servidor");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Error inesperado en login");
  }
}