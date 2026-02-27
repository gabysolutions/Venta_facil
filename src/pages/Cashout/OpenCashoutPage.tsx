import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Wallet, AlertTriangle } from "lucide-react";
import { openCashout } from "../../services/openCashout.service";
import Swal from "sweetalert2";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export default function OpenCashoutPage() {
  const navigate = useNavigate();

  const [openingCash, setOpeningCash] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const openingCashNumber = useMemo(() => {
    const n = Number(openingCash);
    return Number.isFinite(n) ? n : 0;
  }, [openingCash]);

  const quick = [200, 500, 1000, 2000];

  const canSubmit = openingCash.trim() !== "" && openingCashNumber >= 0 && !loading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const n = Number(openingCash);

    if (!Number.isFinite(n) || n < 0) {
      setError("Ingresa un fondo inicial válido (0 o mayor).");
      return;
    }

    try {
      setLoading(true);

      const resp = await openCashout(n);

      if (!resp.success) {
        const msg = resp.message || "No se pudo abrir caja.";
        setError(msg);

        await Swal.fire({
          title: "No se pudo abrir la caja",
          text: msg,
          icon: "error",
          confirmButtonText: "Ok",
        });

        return;
      }

      await Swal.fire({
        title: "Caja abierta correctamente ✅",
        html: `
          <div style="text-align:center">
            <div><b>Fondo inicial:</b> ${formatCurrency(n)}</div>
            <div><b>Estado:</b> Activa</div>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Ir a ventas",
      });

      navigate("/ventas", { replace: true });
    } catch (err: any) {
      const msg = err?.message || "No se pudo abrir caja. Intenta de nuevo.";

      // Si backend te regresa "ya hay uno activo"
      if (String(msg).toLowerCase().includes("activo")) {
        navigate("/ventas", { replace: true });
        return;
      }

      setError(msg);

      await Swal.fire({
        title: "No se pudo abrir la caja",
        text: msg,
        icon: "error",
        confirmButtonText: "Ok",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#f2f2f2]/85 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center text-slate-200 transition"
            aria-label="Regresar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <p className="text-black font-extrabold leading-tight">Abrir caja</p>
            <p className="text-xs text-slate-400">No hay un corte activo hoy</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <LockKeyhole className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-slate-500">Requiere permiso</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Info banner */}
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-slate-100">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/25 grid place-items-center">
              <Wallet className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-black">Necesitas abrir caja para comenzar</p>
              <p className="text-sm text-slate-500 mt-1">
                Ingresa el <span className="font-semibold">fondo inicial</span> (efectivo con el que arranca el cajón).
              </p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Fondo inicial</h2>
              <p className="text-sm text-slate-500 mt-1">Ejemplo: el cambio/morralla con el que empieza la caja.</p>
            </div>

            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-500">Vista previa</p>
              <p className="text-lg font-extrabold text-slate-900">{formatCurrency(openingCashNumber)}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {/* opening cash */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Monto en efectivo *</label>

              <div className="mt-2 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>

                <input
                  inputMode="decimal"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3 outline-none focus:border-emerald-400"
                />
              </div>

              {/* quick buttons */}
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {quick.map((q) => (
                  <button
                    type="button"
                    key={q}
                    onClick={() => setOpeningCash(String(q))}
                    className="shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition"
                  >
                    {formatCurrency(q)}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setOpeningCash("0")}
                  className="shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition"
                >
                  $0
                </button>
              </div>
            </div>

            {/* error */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm flex gap-2">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="sm:flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-3 font-extrabold text-slate-700 transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="sm:flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed py-3 font-extrabold text-white transition"
              >
                {loading ? "Abriendo..." : "Abrir caja"}
              </button>
            </div>

            {/* mobile preview */}
            <div className="sm:hidden pt-2 text-center">
              <p className="text-xs text-slate-500">Vista previa</p>
              <p className="text-xl font-extrabold text-slate-900">{formatCurrency(openingCashNumber)}</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}