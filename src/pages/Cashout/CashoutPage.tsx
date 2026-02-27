import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  Banknote,
  CreditCard,
  ArrowRight,
  FileDown,
  Check,
  AlertTriangle,
} from "lucide-react";
import Loader from "../../components/ui/Loader";
import Swal from "sweetalert2";

import {
  getActiveCashout,
  closeCashout,
  type ActiveCashout,
} from "../../services/openCashOut.service";

import { downloadCortePdf } from "../../utils/pdfcorte";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export default function CashoutPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busyClose, setBusyClose] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [active, setActive] = useState<ActiveCashout | null>(null);

  const [countedCash, setCountedCash] = useState<string>("");
  const [notes, setNotes] = useState("");

  const countedValue = useMemo(() => Number(countedCash) || 0, [countedCash]);

  const expected = useMemo(
    () => ({
      openingFloat: active?.initial_cash ?? 0,
      cashSales: active?.cash_sales ?? 0,
      cardSales: active?.card_sales ?? 0,
      transferSales: active?.transfer_sales ?? 0,
      expenses: active?.cash_expenses ?? 0,
      refunds: active?.refund_sales ?? 0,
    }),
    [active]
  );

  const expectedTotal = useMemo(() => {
    return expected.openingFloat + expected.cashSales - expected.expenses - expected.refunds;
  }, [expected]);

  const diff = useMemo(() => countedValue - expectedTotal, [countedValue, expectedTotal]);

  const diffLabel = useMemo(() => {
    if (diff === 0) return { text: "Cuadra perfecto ✅", cls: "bg-emerald-100 text-emerald-800" };
    if (diff > 0) return { text: `Sobra ${formatCurrency(diff)}`, cls: "bg-amber-100 text-amber-800" };
    return { text: `Falta ${formatCurrency(Math.abs(diff))}`, cls: "bg-rose-100 text-rose-800" };
  }, [diff]);

  const loadActive = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getActiveCashout();
      if (!res.success) throw new Error(res.error || res.message || "No se pudo obtener la caja actual");

      const activeCashout = res.data ?? null;
      setActive(activeCashout);

      // ✅ Si no hay corte activo -> manda a abrir caja
      if (!activeCashout) {
        navigate("/abrir-caja", { replace: true });
        return;
      }
    } catch (e: any) {
      setError(e?.message || "Error cargando caja actual");
      setActive(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exporta el corte activo (sin cerrarlo) si existe
  const exportActivePdf = () => {
    setError(null);

    if (!active) {
      setError("No hay corte activo para exportar.");
      return;
    }

    const counted = countedCash.trim() ? countedValue : expectedTotal;

    try {
      downloadCortePdf({
        active,
        countedCash: counted,
        note: notes.trim(),
      });
    } catch (e) {
      setError("No se pudo generar el PDF.");
    }
  };

  // ✅ SweetAlert2 Confirm + Success
  const handleConfirmCashout = async () => {
    setError(null);

    if (!active) {
      setError("No hay corte activo. Primero abre la caja.");
      return;
    }

    if (!countedCash.trim()) {
      setError("Te faltó poner el efectivo contado.");
      return;
    }

    const result = await Swal.fire({
      title: "Confirmar corte",
      text: "Esto cerrará el turno y generará el corte de caja. ¿Seguro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      allowEscapeKey: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          setBusyClose(true);

          const res = await closeCashout({
            counted_cash: countedValue,
            note: notes.trim(),
          });

          if (!res.success) throw new Error(res.error || res.message || "No se pudo cerrar la caja");

          // ✅ PDF (si falla, no bloquea el cierre)
          try {
            downloadCortePdf({
              active,
              countedCash: countedValue,
              note: notes.trim(),
            });
          } catch (pdfErr) {
            console.warn("PDF error:", pdfErr);
          }

          setCountedCash("");
          setNotes("");

          await loadActive();

          return true;
        } catch (e: any) {
          Swal.showValidationMessage(e?.message || "Error cerrando caja");
          return false;
        } finally {
          setBusyClose(false);
        }
      },
    });

    if (result.isConfirmed) {
      await Swal.fire({
        title: "Corte realizado",
        text: "Se cerró la caja correctamente.",
        icon: "success",
        confirmButtonText: "Listo",
      });
    }
  };

  if (loading) return <Loader fullScreen size={44} />;

  const hasActive = !!active;

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Corte de Caja</h1>
          <p className="text-slate-500 mt-1">
            {hasActive
              ? `Corte activo: #${active?.id} · Apertura: ${active?.open_date}`
              : "No hay corte activo (abre caja para iniciar)."}
          </p>
        </div>

        <button
          onClick={exportActivePdf}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 transition w-full sm:w-auto"
        >
          <FileDown className="h-5 w-5 mr-2" />
          Exportar
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-bold">
          {error}
        </div>
      )}

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 grid place-items-center">
              <Calculator className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Efectivo esperado</p>
              <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(expectedTotal)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center">
              <Banknote className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Efectivo contado</p>
              <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(countedValue)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center">
                <AlertTriangle className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Diferencia</p>
                <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(diff)}</p>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold ${diffLabel.cls}`}>
              {diffLabel.text}
            </span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">Resumen del turno</h2>
            <p className="text-sm text-slate-500">
              {hasActive ? `Cajero: ${active?.name} · Movimientos: ${active?.transactions}` : "Sin datos (no hay corte activo)."}
            </p>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatRow
              icon={<Banknote className="h-4 w-4 text-slate-600" />}
              label="Fondo inicial"
              value={formatCurrency(expected.openingFloat)}
            />
            <StatRow
              icon={<Banknote className="h-4 w-4 text-slate-600" />}
              label="Ventas efectivo"
              value={formatCurrency(expected.cashSales)}
            />
            <StatRow
              icon={<CreditCard className="h-4 w-4 text-slate-600" />}
              label="Ventas tarjeta"
              value={formatCurrency(expected.cardSales)}
            />
            <StatRow
              icon={<ArrowRight className="h-4 w-4 text-slate-600" />}
              label="Transferencias"
              value={formatCurrency(expected.transferSales)}
            />
            <StatRow
              icon={<AlertTriangle className="h-4 w-4 text-slate-600" />}
              label="Egresos"
              value={`- ${formatCurrency(expected.expenses)}`}
              danger
            />
            <StatRow
              icon={<AlertTriangle className="h-4 w-4 text-slate-600" />}
              label="Devoluciones"
              value={`- ${formatCurrency(expected.refund_sales ?? expected.refunds)}`}
              danger
            />
          </div>

          <div className="p-4 border-t border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Efectivo esperado en caja</span>
            <span className="font-extrabold text-slate-900 text-lg">{formatCurrency(expectedTotal)}</span>
          </div>
        </div>

        {/* Count + actions */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">Contar efectivo</h2>
            <p className="text-sm text-slate-500">Ingresa el total contado</p>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Efectivo contado</label>
              <input
                type="number"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-center text-2xl font-extrabold outline-none focus:border-emerald-400"
              />
              {!hasActive && (
                <p className="text-xs text-rose-600 mt-2 font-semibold">
                  No puedes cerrar caja porque no hay corte activo.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. faltó cambio, hubo egreso no registrado, etc."
                className="w-full min-h-[110px] rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
              />
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Esperado</span>
                <span className="font-bold text-slate-900">{formatCurrency(expectedTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-600">Contado</span>
                <span className="font-bold text-slate-900">{formatCurrency(countedValue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-slate-200">
                <span className="text-slate-600">Diferencia</span>
                <span className="font-extrabold text-slate-900">{formatCurrency(diff)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleConfirmCashout}
                disabled={!hasActive || busyClose}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-bold px-4 py-3 transition"
              >
                <Check className="h-5 w-5 mr-2" />
                Confirmar corte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center flex-shrink-0">
          {icon}
        </div>
        <p className="font-semibold text-slate-800 truncate">{label}</p>
      </div>
      <p className={`font-extrabold ${danger ? "text-rose-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}