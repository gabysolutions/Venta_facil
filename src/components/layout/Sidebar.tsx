import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingCart,
  Package,
  Boxes,
  BarChart3,
  Calculator,
  BanknoteArrowUp,
  Settings,
  LogOut,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import type { Permission } from "../../context/AuthContext";
import Snaqui from "../../../assets/snaqui.jpeg";

type NavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
  section?: "main" | "system";
  requiredPerm?: Permission;
};

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: <LayoutGrid size={18} />, section: "main" },

  { label: "Ventas", to: "/ventas", icon: <ShoppingCart size={18} />, section: "main", requiredPerm: "ACCESO_VENTAS" },

  { label: "Productos", to: "/productos", icon: <Package size={18} />, section: "main", requiredPerm: "ADMINISTRAR_PRODUCTOS" },

  { label: "Inventario", to: "/inventario", icon: <Boxes size={18} />, section: "main", requiredPerm: "ADMINISTRAR_INVENTARIO" },

  { label: "Reportes", to: "/reportes", icon: <BarChart3 size={18} />, section: "main", requiredPerm: "VER_REPORTES" },

  { label: "Corte de Caja", to: "/corte-caja", icon: <Calculator size={18} />, section: "main", requiredPerm: "VISTA_CORTE" },

  { label: "Egresos", to: "/egresos", icon: <BanknoteArrowUp size={18} />, section: "main", requiredPerm: "ACCESO_EGRESOS" },

  { label: "Configuración", to: "/configuracion", icon: <Settings size={18} />, section: "system", requiredPerm: "ACCESO_CONFIGURACION" },
];

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  onRequestLogout?: () => void;
};

export default function Sidebar({
  open = false,
  onClose,
  onRequestLogout,
}: SidebarProps) {
  const { user, hasPermission } = useAuth();

  const displayUser = useMemo(() => {
    const name = user?.name ?? "Usuario";
    const role = user?.role ?? "—";

    const initials =
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase())
        .join("") || "U";

    return { name, role, initials };
  }, [user]);

  const allowedItems = useMemo(
    () => navItems.filter((item) => !item.requiredPerm || hasPermission(item.requiredPerm)),
    [hasPermission]
  );

  const main = allowedItems.filter((i) => i.section === "main");
  const system = allowedItems.filter((i) => i.section === "system");

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 lg:hidden z-30" onClick={onClose} />
      )}

      <aside
        className={`
          fixed lg:static top-0 left-0 z-40
          h-screen w-72
          bg-[#0f172a] text-slate-200
          border-r border-white/10
          flex flex-col
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Header */}
       <div className="px-5 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 overflow-hidden grid place-items-center">
             <img src={Snaqui} alt="SNAQUII" />
            </div>

            <div className="leading-tight">
              <p className="font-semibold text-lg">SNAQUII</p>
              <p className="text-xs text-slate-400">Punto de Venta</p>
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav className="px-3 py-4 flex-1">
          <ul className="space-y-1">
            {main.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    [
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition relative",
                      "hover:bg-white/5",
                      isActive ? "bg-white/10 border border-white/10" : "text-slate-300",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r bg-emerald-400" />
                      )}
                      <span className={isActive ? "text-slate-100" : "text-slate-400"}>
                        {item.icon}
                      </span>
                      <span className={isActive ? "font-semibold" : "font-medium"}>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {system.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="px-3 text-[11px] tracking-widest text-slate-500">SISTEMA</p>

              <ul className="mt-3 space-y-1">
                {system.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        [
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition relative",
                          "hover:bg-white/5",
                          isActive ? "bg-white/10 border border-white/10" : "text-slate-300",
                        ].join(" ")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r bg-emerald-400" />
                          )}
                          <span className={isActive ? "text-slate-100" : "text-slate-400"}>
                            {item.icon}
                          </span>
                          <span className={isActive ? "font-semibold" : "font-medium"}>
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 grid place-items-center text-sm font-semibold">
              {displayUser.initials}
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-sm font-semibold">{displayUser.name}</p>
              <p className="text-xs text-slate-400">{displayUser.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRequestLogout}
            className="mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:bg-white/5 transition"
          >
            <span className="text-slate-400">
              <LogOut size={18} />
            </span>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
