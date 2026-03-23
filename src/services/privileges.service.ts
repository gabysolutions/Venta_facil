import { http } from "./http";

export type PrivilegeKey =
  | "VISTA_CORTE"
  | "ABRIR_CAJA"
  | "HISTORIAL_CORTES"
  | "CERRAR_CAJA"
  | "ACCESO_EGRESOS"
  | "ADMINISTRAR_PRODUCTOS"
  | "ADMINISTRAR_INVENTARIO"
  | "VER_REPORTES"
  | "ACCESO_CONFIGURACION"
  | "ACCESO_VENTAS"
  | "VENTA_CREDITO"
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
  role: string; 
  status: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export type GetAllPrivilegesResponse = ApiResponse<Privilege[]>;

export async function getAllPrivileges() {
  const { data } = await http.get<GetAllPrivilegesResponse>("/privileges");
  return data;
}


export type GetPrivilegesByUserIdData = {
  user: PrivilegesUserInfo;
  permissions: Privilege[];
};

export type GetPrivilegesByUserIdResponse = ApiResponse<GetPrivilegesByUserIdData>;

export async function getPrivilegesByUserId(userId: number) {
  const { data } = await http.get<GetPrivilegesByUserIdResponse>(`/privileges/${userId}`);
  return data;
}


export const getPrivilegesByUserID = getPrivilegesByUserId;


export type AssignPrivilegePayload = {
  user_id: number;
  permission: number; 
};

export type AssignPrivilegeResponse = ApiResponse<null>;

export async function assignPrivilege(payload: AssignPrivilegePayload) {
  const { data } = await http.post<AssignPrivilegeResponse>("/privileges", payload);
  return data;
}


export type RemovePrivilegePayload = {
  user_id: number;
  permission: number;
};

export type RemovePrivilegeResponse = ApiResponse<null>;

export async function removePrivilege(payload: RemovePrivilegePayload) {
  
  const { data } = await http.delete<RemovePrivilegeResponse>("/privileges", { data: payload });
  return data;
}