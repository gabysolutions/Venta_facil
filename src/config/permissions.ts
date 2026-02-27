
export type ApiRole = "Administrador" | "Cajero";


export type AppRole = "ADMIN" | "CAJERA";


export type Permission =
  | "ACCESO_VENTAS"
  | "VISTA_CORTE"
  | "ABRIR_CAJA"
  | "CERRAR_CAJA"
  | "ACCESO_EGRESOS"
  | "ADMINISTRAR_PRODUCTOS"
  | "ADMINISTRAR_INVENTARIO"
  | "VER_REPORTES"
  | "ACCESO_CONFIGURACION"
  | "ADMINISTRAR_USUARIOS";


export const ROLE_MAP: Record<ApiRole, AppRole> = {
  Administrador: "ADMIN",
  Cajero: "CAJERA",
};


export const PERMISSIONS_BY_ROLE: Record<AppRole, Permission[]> = {
  ADMIN: [
    "ACCESO_VENTAS",
    "VISTA_CORTE",
    "ABRIR_CAJA",
    "CERRAR_CAJA",
    "ACCESO_EGRESOS",
    "ADMINISTRAR_PRODUCTOS",
    "ADMINISTRAR_INVENTARIO",
    "VER_REPORTES",
    "ACCESO_CONFIGURACION",
    "ADMINISTRAR_USUARIOS",
  ],

  CAJERA: [
    "ACCESO_VENTAS",
    "VISTA_CORTE",
    "ABRIR_CAJA",
  ],
};