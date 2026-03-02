import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import ConfirmModal from "../ui/ConfirmModal";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const navigate = useNavigate();

  const doLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setConfirmLogoutOpen(false);
    setOpen(false);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      setConfirmLogoutOpen(true);

      window.history.pushState(null, "", window.location.pathname);
    };

    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", handleBackButton);

    return () => window.removeEventListener("popstate", handleBackButton);
  }, []);

  return (
    // ✅ iPhone-safe height + sin recortar el scroll del contenido
    <div className="min-h-[100dvh] w-screen flex bg-[#0b1220] overflow-hidden">
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        onRequestLogout={() => setConfirmLogoutOpen(true)}
      />

      {/* ✅ importante: también overflow-hidden aquí para que sidebar no haga cosas raras */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header móvil/tablet */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#0b1220] border-b border-white/10 text-slate-100 pt-[env(safe-area-inset-top)]">
          <div className="relative h-14 flex items-center px-3">
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="h-10 w-10 grid place-items-center rounded-xl hover:bg-white/10 active:bg-white/15"
            >
              <Menu className="h-5 w-5" />
            </button>

            <span className="absolute left-1/2 -translate-x-1/2 font-semibold">
              VentaFácil
            </span>

            <div className="ml-auto w-10" />
          </div>
        </header>

        {/* ✅ Contenido: scroll real + safe area abajo */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#f2f2f2] p-3 md:p-4 lg:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
      </div>

      <ConfirmModal
        open={confirmLogoutOpen}
        title="Cerrar sesión"
        description="¿Seguro que quieres cerrar sesión?"
        confirmText="Sí, cerrar"
        cancelText="No, cancelar"
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={doLogout}
      />
    </div>
  );
}