import { http } from "./http";

export type PrivilegeKey =
  | "VISTA_CORTE"
  | "ABRIR_CAJA"
  | "CERRAR_CAJA"
  | "ACCESO_EGRESOS"
  | "ADMINISTRAR_PRODUCTOS"
  | "ADMINISTRAR_INVENTARIO"
  | "VER_REPORTES"
  | "ACCESO_CONFIGURACION"
  | "ACCESO_VENTAS"
  | "ADMINISTRAR_USUARIOS";

export type Privilege = {
  id: number;
  description: string;
  key: PrivilegeKey;
};

export type PrivilegesUserInfo = {
  name: string;
  paternal_lastname: string;
  maternal_lastname: string;
  role: string; // "Administrador" | "Cajero" (si quieres tiparlo más estricto)
  status: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

// ✅ GET /api/privileges  -> lista de permisos (catálogo)
export type GetAllPrivilegesResponse = ApiResponse<Privilege[]>;

export async function getAllPrivileges() {
  const { data } = await http.get<GetAllPrivilegesResponse>("/privileges");
  return data;
}

// ✅ GET /api/privileges/:userId -> { user, permissions }
export type GetPrivilegesByUserIdData = {
  user: PrivilegesUserInfo;
  permissions: Privilege[];
};

export type GetPrivilegesByUserIdResponse = ApiResponse<GetPrivilegesByUserIdData>;

export async function getPrivilegesByUserId(userId: number) {
  const { data } = await http.get<GetPrivilegesByUserIdResponse>(`/privileges/${userId}`);
  return data;
}

// ✅ Alias opcional (por si un día cambias el nombre en imports sin querer)
export const getPrivilegesByUserID = getPrivilegesByUserId;

// ✅ POST asignar permiso a usuario
export type AssignPrivilegePayload = {
  user_id: number;
  permission: number; // permission id
};

export type AssignPrivilegeResponse = ApiResponse<null>;

export async function assignPrivilege(payload: AssignPrivilegePayload) {
  const { data } = await http.post<AssignPrivilegeResponse>("/privileges", payload);
  return data;
}

// ✅ DELETE quitar permiso a usuario
export type RemovePrivilegePayload = {
  user_id: number;
  permission: number; // permission id
};

export type RemovePrivilegeResponse = ApiResponse<null>;

export async function removePrivilege(payload: RemovePrivilegePayload) {
  // Axios delete con body => va en { data: payload }
  const { data } = await http.delete<RemovePrivilegeResponse>("/privileges", { data: payload });
  return data;
}