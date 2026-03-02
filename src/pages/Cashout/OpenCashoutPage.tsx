import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, AlertTriangle } from "lucide-react";
import { openCashout } from "../../services/cashout.service";
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
    <div className="min-h-[100dvh] bg-[#f2f2f2] pb-[env(safe-area-inset-bottom)]">
      {/* Top bar interno */}
      <div className="sticky top-0 z-10 bg-[#f2f2f2]/90 backdrop-blur border-b border-slate-200/60">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 grid place-items-center text-slate-700 active:scale-[0.98] transition shadow-sm"
            aria-label="Regresar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-slate-900 font-extrabold leading-tight truncate">Abrir caja</p>
            <p className="text-xs text-slate-500 truncate">No hay un corte activo hoy</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-5 sm:py-6 pb-28">
        {/* Banner */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 border border-emerald-200 grid place-items-center shrink-0">
              <Wallet className="h-5 w-5 text-emerald-700" />
            </div>

            <div className="min-w-0">
              <p className="font-extrabold text-slate-900">Necesitas abrir caja para comenzar</p>
              <p className="text-sm text-slate-600 mt-1">
                Ingresa el <span className="font-semibold">fondo inicial</span> (efectivo con el que arranca el cajón).
              </p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Fondo inicial</h2>
            <p className="text-sm text-slate-600 mt-1">
              Ejemplo: el cambio/morralla con el que empieza la caja.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Monto en efectivo *</label>

              <div className="mt-2 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>

                <input
                  inputMode="decimal"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="0.00"
                  className={[
                    "w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3",
                    "text-[16px] text-slate-900 placeholder:text-slate-400",
                    "outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50",
                    "shadow-sm",
                  ].join(" ")}
                />
              </div>

              <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {quick.map((q) => (
                  <button
                    type="button"
                    key={q}
                    onClick={() => setOpeningCash(String(q))}
                    className="shrink-0 rounded-xl bg-slate-100 active:bg-slate-200 px-3 py-2 text-sm font-bold text-slate-800 transition shadow-sm"
                  >
                    {formatCurrency(q)}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setOpeningCash("0")}
                  className="shrink-0 rounded-xl bg-slate-100 active:bg-slate-200 px-3 py-2 text-sm font-bold text-slate-800 transition shadow-sm"
                >
                  $0
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm flex gap-2 shadow-sm">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="sm:flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] py-3 font-extrabold text-slate-700 transition shadow-sm"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="sm:flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed py-3 font-extrabold text-white transition shadow-sm"
              >
                {loading ? "Abriendo..." : "Abrir caja"}
              </button>
            </div>

            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500">Vista previa</p>
              <p className="text-xl font-extrabold text-slate-900">{formatCurrency(openingCashNumber)}</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}