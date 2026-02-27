import { useState,useEffect  } from "react";
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

      return () => {
        window.removeEventListener("popstate", handleBackButton);
      };
    }, []);

  return (
    <div className="h-screen w-screen flex bg-[#0b1220] overflow-hidden">
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        onRequestLogout={() => setConfirmLogoutOpen(true)}
      />

      <div className="flex-1 flex flex-col">
        {/* Header móvil */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 text-slate-100">
          <button onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu />
          </button>
          <span className="font-semibold">VentaFácil</span>
          <span className="w-6" />
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-auto p-6 text-slate-900 bg-[#f2f2f2]">
          <Outlet />
        </main>
      </div>

      {/* Modal confirmar logout */}
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
