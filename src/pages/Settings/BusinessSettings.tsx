import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Save, ArrowLeft } from "lucide-react";

type FormState = {
  nombre: string;
  razonSocial: string;
  rfc: string;
  calleNumero: string;
  colonia: string;
  cp: string;
  ciudad: string;
  estado: string;
  telefono: string;
  correo: string;
};

export default function BusinessSettings() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    nombre: "Mi Punto de Venta",
    razonSocial: "",
    rfc: "",
    calleNumero: "",
    colonia: "",
    cp: "",
    ciudad: "",
    estado: "",
    telefono: "",
    correo: "",
  });

  const onChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Guardar negocio:", form);
    alert("Guardado (demo) ✅");
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Top bar: back */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate("/configuracion")}
          className="inline-flex items-center gap-2 rounded-xl  hover:bg-slate-50 px-3 py-2 text-sm font-extrabold text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Configuración
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-200 grid place-items-center">
          <Store className="h-6 w-6 text-emerald-700" />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">
            Información del Negocio
          </h1>
          <p className="text-slate-500 mt-1">
            Nombre, dirección y datos fiscales
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Card: Datos Generales */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-extrabold text-slate-900 mb-4">
            Datos Generales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Nombre del negocio"
              placeholder="Mi Tienda"
              value={form.nombre}
              onChange={onChange("nombre")}
            />
            <Field
              label="Razón social"
              placeholder="Razón social del negocio"
              value={form.razonSocial}
              onChange={onChange("razonSocial")}
            />
            <Field
              label="RFC"
              placeholder="XAXX010101000"
              value={form.rfc}
              onChange={onChange("rfc")}
            />
          </div>
        </section>

        {/* Card: Dirección */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-extrabold text-slate-900 mb-4">Dirección</h2>

          <div className="grid grid-cols-1 gap-4">
            <Field
              label="Calle y número"
              placeholder="Av. Principal #123"
              value={form.calleNumero}
              onChange={onChange("calleNumero")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Colonia"
                placeholder="Centro"
                value={form.colonia}
                onChange={onChange("colonia")}
              />
              <Field
                label="Código Postal"
                placeholder="06000"
                value={form.cp}
                onChange={onChange("cp")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Ciudad"
                placeholder="Ciudad de México"
                value={form.ciudad}
                onChange={onChange("ciudad")}
              />
              <Field
                label="Estado"
                placeholder="CDMX"
                value={form.estado}
                onChange={onChange("estado")}
              />
            </div>
          </div>
        </section>

        {/* Card: Contacto */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-extrabold text-slate-900 mb-4">Contacto</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Teléfono"
              placeholder="+52 55 1234 5678"
              value={form.telefono}
              onChange={onChange("telefono")}
              type="tel"
            />
            <Field
              label="Correo electrónico"
              placeholder="contacto@mitienda.com"
              value={form.correo}
              onChange={onChange("correo")}
              type="email"
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold px-5 py-3 transition"
          >
            <Save className="h-5 w-5" />
            Guardar cambios
          </button>

          <button
            type="button"
            onClick={() => navigate("/configuracion")}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-extrabold px-5 py-3 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold text-slate-700">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition"
      />
    </label>
  );
}
