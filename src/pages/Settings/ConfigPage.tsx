import { useNavigate } from "react-router-dom";
import { Users, ChevronRight } from "lucide-react";
// import { Store, Printer, Shield } from "lucide-react"; // ❌ no se usan por ahora

export default function ConfigPage() {
  const navigate = useNavigate();

  const settingsSections = [
    // ❌ FUTURO: Información del negocio
    // {
    //   key: "negocio",
    //   icon: Store,
    //   title: "Información del Negocio",
    //   description: "Nombre, dirección y datos fiscales",
    // },

    // ✅ ACTIVO
    {
      key: "usuarios",
      icon: Users,
      title: "Usuarios y Permisos",
      description: "Gestiona cajeros y administradores",
    },

    // ❌ FUTURO: Tickets
    // {
    //   key: "tickets",
    //   icon: Printer,
    //   title: "Impresión de Tickets",
    //   description: "Configura formato e impresora",
    // },

    // ❌ FUTURO: Seguridad
    // {
    //   key: "seguridad",
    //   icon: Shield,
    //   title: "Seguridad",
    //   description: "Contraseñas y acceso al sistema",
    // },
  ] as const;

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Configuración</h1>
        <p className="text-slate-500 mt-1">Personaliza tu punto de venta</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;

          return (
            <button
              key={section.key}
              onClick={() => navigate(section.key)}
              className="rounded-2xl border bg-white p-5 text-left transition group border-slate-200 hover:border-emerald-300 hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center transition">
                  <Icon className="h-6 w-6 text-slate-600 group-hover:text-emerald-700 transition" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-slate-900 mb-1">{section.title}</h3>
                  <p className="text-sm text-slate-500">{section.description}</p>

                  <div className="mt-3 inline-flex items-center text-sm font-extrabold text-emerald-700">
                    Configurar <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}