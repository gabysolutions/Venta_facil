import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Receipt, Calendar, Filter, X } from "lucide-react";

import Loader from "../../components/ui/Loader";

import Swal from "sweetalert2";

import { getExpenses, createExpense, deleteExpense } from "../../services/expense.service";
import type { Expense, CreateExpensePayload } from "../../services/expense.service";

type MetodoUI = "cash" | "card" | "transfer";

type EgresoUI = {
  id: number;
  concepto: string;
  monto: number;
  categoria: string;
  metodo_pago: MetodoUI;
  notas?: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function nowLocalDateTime() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return { fecha: `${yyyy}-${mm}-${dd}`, hora: `${hh}:${mi}` };
}

function isoToUiDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { fecha: "—", hora: "—" };
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return { fecha: `${yyyy}-${mm}-${dd}`, hora: `${hh}:${mi}` };
}

function uiToSqlDatetime(fecha: string, hora: string) {
  const hh = hora?.slice(0, 2) ?? "00";
  const mi = hora?.slice(3, 5) ?? "00";
  return `${fecha} ${hh}:${mi}:00`;
}

function apiPayMethodToUi(pm?: string): MetodoUI {
  const v = (pm ?? "").toLowerCase();
  if (v.includes("efect")) return "cash";
  if (v.includes("tarj")) return "card";
  if (v.includes("transf")) return "transfer";
  return "cash";
}

function uiPayMethodToApi(pm: MetodoUI) {
  if (pm === "cash") return "Efectivo";
  if (pm === "card") return "Tarjeta";
  return "Transferencia";
}

// ✅ Quitamos "Caja chica"
const categorias = ["Servicio", "Proveedor", "Transporte", "Otro"] as const;

export default function EgresosPage() {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dt = nowLocalDateTime();
  const [form, setForm] = useState({
    concepto: "",
    monto: "",
    categoria: "Otro",
    metodo_pago: "cash" as MetodoUI,
    notas: "",
    fecha: dt.fecha,
    hora: dt.hora,
  });

  const [egresos, setEgresos] = useState<EgresoUI[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("Todas");
  const [filterMetodo, setFilterMetodo] = useState<string>("Todos");

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  // ✅ SweetAlert2 helpers (SIN ARCHIVO EXTRA)
  const swalSuccess = async (title: string, text?: string) => {
    await Swal.fire({
      icon: "success",
      title,
      text,
      timer: 1200,
      showConfirmButton: false,
      backdrop: "rgba(2, 6, 23, 0.45)",
      customClass: {
        popup: "rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl",
        title: "text-slate-900 font-extrabold text-xl",
        htmlContainer: "text-slate-600 font-semibold",
      },
      buttonsStyling: false,
    });
  };

  const swalError = async (msg: string) => {
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: msg,
      confirmButtonText: "OK",
      backdrop: "rgba(2, 6, 23, 0.45)",
      customClass: {
        popup: "rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl",
        title: "text-slate-900 font-extrabold text-xl",
        htmlContainer: "text-slate-600 font-semibold",
        confirmButton: "mt-2 rounded-xl bg-rose-500 hover:bg-rose-400 px-5 py-2.5 font-extrabold text-white",
      },
      buttonsStyling: false,
    });
  };

  const swalConfirmDelete = async () => {
    const result = await Swal.fire({
      title: "Eliminar egreso",
      text: "¿Seguro que quieres eliminar este egreso? Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      backdrop: "rgba(2, 6, 23, 0.45)",
      customClass: {
        popup: "rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl",
        title: "text-slate-900 font-extrabold text-xl",
        htmlContainer: "text-slate-600 font-semibold",
        confirmButton: "rounded-xl bg-rose-500 hover:bg-rose-400 px-5 py-2.5 font-extrabold text-white",
        cancelButton:
          "rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 font-extrabold text-slate-700",
      },
      buttonsStyling: false,
    });

    return result.isConfirmed;
  };

  function mapApiToUi(list: Expense[]): EgresoUI[] {
    return list.map((x) => {
      const { fecha, hora } = isoToUiDateTime(x.register_date);
      return {
        id: x.id,
        concepto: x.description,
        monto: Number(x.amount) || 0,
        categoria: x.category,
        metodo_pago: apiPayMethodToUi(x.pay_method),
        notas: x.note ?? undefined,
        fecha,
        hora,
      };
    });
  }

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await getExpenses();
      if (!res.success) throw new Error(res.error || res.message || "No se pudieron cargar egresos");

      // ✅ IMPORTANTÍSIMO:
      // Si tu delete es soft-delete (status=0), aquí desaparece del UI.
      const activos = (res.data ?? []).filter((x) => x.status === 1);

      setEgresos(mapApiToUi(activos));
      setPage(1);
    } catch (e: any) {
      setError(e?.message || "Error cargando egresos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      await loadData();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const base = egresos.filter((e) => {
      const matchesSearch =
        e.concepto.toLowerCase().includes(term) ||
        e.categoria.toLowerCase().includes(term) ||
        (e.notas ?? "").toLowerCase().includes(term) ||
        String(e.id).includes(term);

      const matchesCategoria = filterCategoria === "Todas" ? true : e.categoria === filterCategoria;
      const matchesMetodo = filterMetodo === "Todos" ? true : e.metodo_pago === filterMetodo;

      return matchesSearch && matchesCategoria && matchesMetodo;
    });

    base.sort((a, b) => {
      const da = new Date(`${a.fecha}T${a.hora}:00`).getTime();
      const db = new Date(`${b.fecha}T${b.hora}:00`).getTime();
      return db - da;
    });

    return base;
  }, [egresos, searchTerm, filterCategoria, filterMetodo]);

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, e) => sum + e.monto, 0);
    const totalCash = filtered.filter((e) => e.metodo_pago === "cash").reduce((s, e) => s + e.monto, 0);
    const totalCard = filtered.filter((e) => e.metodo_pago === "card").reduce((s, e) => s + e.monto, 0);
    const totalTransfer = filtered.filter((e) => e.metodo_pago === "transfer").reduce((s, e) => s + e.monto, 0);
    return { total, totalCash, totalCard, totalTransfer, count: filtered.length };
  }, [filtered]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered.length]);
  const safeSetPage = (next: number) => setPage(Math.min(Math.max(1, next), pageCount));

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const clearForm = () => {
    const ndt = nowLocalDateTime();
    setForm({
      concepto: "",
      monto: "",
      categoria: "Otro",
      metodo_pago: "cash",
      notas: "",
      fecha: ndt.fecha,
      hora: ndt.hora,
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const concepto = form.concepto.trim();
    const monto = Number(form.monto);

    if (!concepto) return setError("Pon un concepto del egreso.");
    if (!form.monto || Number.isNaN(monto) || monto <= 0) return setError("Pon un monto válido.");

    const payload: CreateExpensePayload = {
      description: concepto,
      amount: monto,
      category: form.categoria,
      pay_method: uiPayMethodToApi(form.metodo_pago),
      note: form.notas.trim() || undefined,
      register_date: uiToSqlDatetime(form.fecha, form.hora),
    };

    try {
      // ✅ loading de swal (sin que se vea feo)
      Swal.fire({
        title: "Guardando...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        backdrop: "rgba(2, 6, 23, 0.45)",
        didOpen: () => Swal.showLoading(),
      });

      const res = await createExpense(payload);
      if (!res.success) throw new Error(res.error || res.message || "No se pudo crear el egreso");

      await loadData();
      clearForm();

      Swal.close();
      await swalSuccess("Egreso registrado", "Se guardó correctamente.");
    } catch (e: any) {
      Swal.close();
      const msg = e?.message || "Error guardando egreso";
      setError(msg);
      await swalError(msg);
    }
  };

  const askDelete = async (id: number) => {
    const confirmed = await swalConfirmDelete();
    if (!confirmed) return;

    try {
      setBusyId(id);

      Swal.fire({
        title: "Eliminando...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        backdrop: "rgba(2, 6, 23, 0.45)",
        didOpen: () => Swal.showLoading(),
      });

      const res = await deleteExpense(id);
      if (!res.success) throw new Error(res.error || res.message || "No se pudo eliminar el egreso");

      setEgresos((prev) => prev.filter((x) => x.id !== id));

      Swal.close();
      await swalSuccess("Egreso eliminado");
    } catch (e: any) {
      Swal.close();
      const msg = e?.message || "Error eliminando egreso";
      setError(msg);
      await swalError(msg);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader fullScreen size={44} />;

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Egresos</h1>
          <p className="text-slate-500 mt-1">Registra gastos y manten el historial para el corte de caja.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700">
            Total: <span className="text-emerald-700">{formatCurrency(stats.total)}</span>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-bold">
          {error}
        </div>
      )}

      {/* Stats quick */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <StatCard title="Registros" value={`${stats.count}`} icon={<Receipt className="h-5 w-5 text-slate-700" />} />
        <StatCard
          title="Efectivo"
          value={formatCurrency(stats.totalCash)}
          icon={<Receipt className="h-5 w-5 text-emerald-700" />}
        />
        <StatCard title="Tarjeta" value={formatCurrency(stats.totalCard)} icon={<Receipt className="h-5 w-5 text-slate-700" />} />
        <StatCard
          title="Transfer"
          value={formatCurrency(stats.totalTransfer)}
          icon={<Receipt className="h-5 w-5 text-indigo-700" />}
        />
      </div>

      {/* Form + Filters grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Form */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <p className="font-extrabold text-slate-900">Registrar egreso</p>
              <p className="text-sm text-slate-500">Se reflejará en tu corte.</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 grid place-items-center">
              <Plus className="h-5 w-5 text-emerald-700" />
            </div>
          </div>

          <form onSubmit={submit} className="p-4 space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Concepto *</label>
              <input
                value={form.concepto}
                onChange={(e) => setForm((p) => ({ ...p, concepto: e.target.value }))}
                placeholder="Ej: Pago luz, compra bolsas, etc."
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monto}
                  onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400 bg-white"
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Método de pago</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { v: "cash", label: "Efectivo" },
                  { v: "card", label: "Tarjeta" },
                  { v: "transfer", label: "Transfer" },
                ].map((m) => {
                  const active = form.metodo_pago === (m.v as MetodoUI);
                  return (
                    <button
                      key={m.v}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, metodo_pago: m.v as MetodoUI }))}
                      className={[
                        "px-3 py-2 rounded-xl text-xs font-extrabold border transition",
                        active
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Fecha</label>
                <div className="mt-2 relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Hora</label>
                <input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm((p) => ({ ...p, hora: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Notas</label>
              <textarea
                value={form.notas}
                onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                placeholder="Opcional"
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={clearForm}
                className="flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-3 font-extrabold text-slate-700 transition"
              >
                Limpiar
              </button>
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white py-3 font-extrabold transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                Guardar
              </button>
            </div>
          </form>
        </div>

        {/* List + filters */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    safeSetPage(1);
                  }}
                  placeholder="Buscar por concepto, categoría, notas o ID…"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3 outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <select
                    value={filterCategoria}
                    onChange={(e) => {
                      setFilterCategoria(e.target.value);
                      safeSetPage(1);
                    }}
                    className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="Todas">Todas</option>
                    {categorias.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <select
                    value={filterMetodo}
                    onChange={(e) => {
                      setFilterMetodo(e.target.value);
                      safeSetPage(1);
                    }}
                    className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="Todos">Todos</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                {(searchTerm || filterCategoria !== "Todas" || filterMetodo !== "Todos") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterCategoria("Todas");
                      setFilterMetodo("Todos");
                      safeSetPage(1);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-extrabold text-slate-700 transition"
                  >
                    <X className="h-4 w-4" />
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-4 text-sm font-extrabold text-slate-700">ID</th>
                    <th className="text-left p-4 text-sm font-extrabold text-slate-700">Fecha</th>
                    <th className="text-left p-4 text-sm font-extrabold text-slate-700">Concepto</th>
                    <th className="text-left p-4 text-sm font-extrabold text-slate-700">Categoría</th>
                    <th className="text-left p-4 text-sm font-extrabold text-slate-700">Método</th>
                    <th className="text-right p-4 text-sm font-extrabold text-slate-700">Monto</th>
                    <th className="text-center p-4 text-sm font-extrabold text-slate-700">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {paged.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="p-4 font-extrabold text-slate-900">#{e.id}</td>
                      <td className="p-4 text-slate-600">
                        {e.fecha} • {e.hora}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center">
                            <Receipt className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{e.concepto}</p>
                            {e.notas && <p className="text-sm text-slate-500 truncate">{e.notas}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold">
                          {e.categoria}
                        </span>
                      </td>
                      <td className="p-4">
                        <MetodoBadge metodo={e.metodo_pago} />
                      </td>
                      <td className="p-4 text-right font-extrabold text-slate-900">{formatCurrency(e.monto)}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => askDelete(e.id)}
                          disabled={busyId === e.id}
                          className="h-10 w-10 rounded-xl bg-rose-100 hover:bg-rose-200 disabled:opacity-60 grid place-items-center transition"
                          aria-label="Eliminar egreso"
                        >
                          <Trash2 className="h-5 w-5 text-rose-700" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && <EmptyState />}
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {paged.map((e) => (
              <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 truncate">
                      #{e.id} • {formatCurrency(e.monto)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {e.fecha} • {e.hora}
                    </p>
                  </div>

                  <button
                    onClick={() => askDelete(e.id)}
                    disabled={busyId === e.id}
                    className="h-10 w-10 rounded-xl bg-rose-100 hover:bg-rose-200 disabled:opacity-60 grid place-items-center transition flex-shrink-0"
                    aria-label="Eliminar egreso"
                  >
                    <Trash2 className="h-5 w-5 text-rose-700" />
                  </button>
                </div>

                <div className="mt-3 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center flex-shrink-0">
                    <Receipt className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{e.concepto}</p>
                    {e.notas && <p className="text-sm text-slate-500">{e.notas}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold">
                        {e.categoria}
                      </span>
                      <MetodoBadge metodo={e.metodo_pago} />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && <EmptyState />}
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-600">
                Página <span className="text-slate-900">{page}</span> de{" "}
                <span className="text-slate-900">{pageCount}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => safeSetPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-extrabold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => safeSetPage(page + 1)}
                  disabled={page === pageCount}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-extrabold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-700 truncate">{title}</p>
          <p className="text-xl font-extrabold text-slate-900 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MetodoBadge({ metodo }: { metodo: MetodoUI }) {
  if (metodo === "cash") {
    return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">Efectivo</span>;
  }
  if (metodo === "card") {
    return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold">Tarjeta</span>;
  }
  return <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-extrabold">Transfer</span>;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
      <Receipt className="h-12 w-12 mx-auto mb-4 opacity-60" />
      <p className="font-extrabold text-slate-800">No hay egresos</p>
      <p className="text-sm">Agrega uno para que aparezca en el historial.</p>
    </div>
  );
}