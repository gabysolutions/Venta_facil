// src/pages/Report/ReportPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  CreditCard,
  Banknote,
  ArrowRight,
  FileDown,
  Eye,
  X,
  ShoppingBag,
  Loader2,
  Trash2,
  ReceiptText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toPng } from "html-to-image";

import type React from "react";

import { getSales, getSaleDetails, deleteSale } from "../../services/sales.service";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Ticket, { type SaleUI as TicketSaleUI } from "./ticket";

type PaymentMethod = "cash" | "card" | "transfer";

type SaleItem = {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
};

type SaleUI = {
  id: number;
  createdAt: Date;
  cashierName: string;
  paymentMethod: PaymentMethod;
  total: number;
  cashReceived?: number;
  change?: number;
  items?: SaleItem[];
};

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

const paymentIcons: Record<PaymentMethod, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowRight,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function mapPayMethod(pay_method: string): PaymentMethod {
  const v = (pay_method || "").toLowerCase().trim();
  if (v.includes("efectivo") || v === "cash") return "cash";
  if (v.includes("tarjeta") || v === "card") return "card";
  if (v.includes("transfer") || v === "transfer") return "transfer";
  return "transfer";
}

function getErrorMessage(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message;
  return fallback;
}

// Si tu ConfirmModal no tiene typing, lo casteamos “safe-ish”
const ConfirmModalAny = ConfirmModal as unknown as (props: {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => React.ReactElement;

export default function ReportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState<PaymentMethod | "all">("all");

  const [sales, setSales] = useState<SaleUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [selectedSale, setSelectedSale] = useState<SaleUI | null>(null);

  // detalle
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string>("");

  // eliminar
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SaleUI | null>(null);

  // paginación
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  // Para descargar ticket como imagen (render oculto)
  const ticketRef = useRef<HTMLDivElement | null>(null);
  const [ticketSale, setTicketSale] = useState<TicketSaleUI | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getSales();
      if (!res.success) throw new Error(res.error || res.message || "No se pudieron cargar ventas");

      const mapped: SaleUI[] = (res.data || [])
        .filter((s) => Number(s.status) === 1)
        .map((s) => ({
          id: s.id,
          createdAt: new Date(s.date),
          cashierName: s.user || "—",
          paymentMethod: mapPayMethod(s.pay_method),
          total: Number(s.total || 0),
          cashReceived: Number(s.cash_received || 0),
          change: Number(s.change_returned || 0),
        }));

      setSales(mapped);
    } catch (e) {
      setError(getErrorMessage(e, "Error cargando ventas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const filteredSales = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return sales.filter((sale) => {
      const matchesSearch =
        String(sale.id).includes(term) || sale.cashierName.toLowerCase().includes(term);
      const matchesPayment = filterPayment === "all" ? true : sale.paymentMethod === filterPayment;
      return matchesSearch && matchesPayment;
    });
  }, [sales, searchTerm, filterPayment]);

  useEffect(() => setPage(1), [searchTerm, filterPayment]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));

  const pagedSales = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSales.slice(start, start + PAGE_SIZE);
  }, [filteredSales, page]);

  const stats = useMemo(() => {
    const total = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const count = filteredSales.length;
    const average = count > 0 ? total / count : 0;
    return { total, count, average };
  }, [filteredSales]);

  const exportCsv = () => {
    const header = ["id", "fecha", "cajero", "metodo", "total"];
    const rows = filteredSales.map((s) => [
      s.id,
      s.createdAt.toISOString(),
      `"${(s.cashierName || "").replaceAll('"', '""')}"`,
      paymentLabels[s.paymentMethod],
      s.total,
    ]);

    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  // ✅ Cargar detalle (items) para el modal
  const openSaleDetail = async (sale: SaleUI) => {
    setSelectedSale(sale);
    setDetailLoading(true);
    setDetailError("");

    try {
      const res = await getSaleDetails(sale.id);
      if (!res.success) throw new Error(res.error || res.message || "No se pudo cargar el detalle");

      const items: SaleItem[] = (res.data || []).map((it) => ({
        productName: it.description,
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0),
        subtotal: Number(it.subtotal || 0),
      }));

      setSelectedSale((prev) => (prev ? { ...prev, items } : prev));
    } catch (e) {
      setDetailError(getErrorMessage(e, "Error cargando detalle"));
    } finally {
      setDetailLoading(false);
    }
  };

  // ✅ Confirmar eliminación
  const askDeleteSale = (sale: SaleUI) => {
    setSaleToDelete(sale);
    setConfirmOpen(true);
  };

  const confirmDeleteSale = async () => {
    if (!saleToDelete) return;
    const id = saleToDelete.id;

    try {
      setDeleteError("");
      setDeletingId(id);

      const res = await deleteSale(id);
      if (!res.success) throw new Error(res.error || res.message || "No se pudo eliminar la venta");

      setSales((prev) => prev.filter((s) => s.id !== id));
      setSelectedSale((prev) => (prev?.id === id ? null : prev));

      setConfirmOpen(false);
      setSaleToDelete(null);
    } catch (e) {
      setDeleteError(getErrorMessage(e, "Error eliminando venta"));
    } finally {
      setDeletingId(null);
    }
  };

  const closeConfirm = () => {
    if (deletingId) return;
    setConfirmOpen(false);
    setSaleToDelete(null);
  };

  // ✅ Descargar ticket como PNG (sin abrir otro modal)
  const downloadTicketPng = async (sale: SaleUI) => {
    try {
      setTicketLoading(true);

      // 1) Aseguramos items
      let items = sale.items;
      if (!items?.length) {
        const res = await getSaleDetails(sale.id);
        if (!res.success) throw new Error(res.error || res.message || "No se pudo cargar el detalle");

        items = (res.data || []).map((it) => ({
          productName: it.description,
          quantity: Number(it.quantity || 0),
          price: Number(it.price || 0),
          subtotal: Number(it.subtotal || 0),
        }));
      }

      // 2) Render oculto para capturar
      const forTicket: TicketSaleUI = {
        id: sale.id,
        createdAt: sale.createdAt,
        cashierName: sale.cashierName,
        paymentMethod: sale.paymentMethod,
        total: sale.total,
        cashReceived: sale.cashReceived,
        change: sale.change,
        items,
      };

      setTicketSale(forTicket);

      // Espera a que pinte el DOM
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      if (!ticketRef.current) throw new Error("No se pudo renderizar el ticket");

      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 2, // se ve más nítido
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `ticket_${String(sale.id).padStart(4, "0")}.png`;
      a.click();
    } catch (e) {
      // aquí podrías usar tu Swal si quieres
      alert(getErrorMessage(e, "No se pudo descargar el ticket"));
    } finally {
      setTicketLoading(false);
      // opcional: limpiar
      // setTicketSale(null);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Confirm Modal */}
      <ConfirmModalAny
        open={confirmOpen}
        title="Eliminar venta"
        description={
          saleToDelete
            ? `¿Seguro que deseas eliminar/cancelar la venta #${String(saleToDelete.id).padStart(4, "0")}?`
            : "¿Seguro?"
        }
        confirmText={deletingId ? "Eliminando..." : "Sí, eliminar"}
        cancelText="Cancelar"
        loading={Boolean(deletingId)}
        onClose={closeConfirm}
        onConfirm={confirmDeleteSale}
      />

      {/* Ticket hidden render (para PNG) */}
      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
        <div ref={ticketRef}>{ticketSale ? <Ticket sale={ticketSale} /> : null}</div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Historial de Ventas</h1>
          <p className="text-slate-500 mt-1">Consulta y exporta el registro de ventas</p>
        </div>

        <button
          onClick={exportCsv}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 transition w-full sm:w-auto"
        >
          <FileDown className="h-5 w-5 mr-2" />
          Exportar CSV
        </button>
      </div>

      {deleteError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
          {deleteError}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
          Cargando ventas...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <p className="font-bold">Tronó algo:</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Total Ventas</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.total)}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Transacciones</p>
              <p className="text-2xl font-bold text-slate-900">{stats.count}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Ticket Promedio</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.average)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID o cajero..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3 outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1">
                <button
                  onClick={() => setFilterPayment("all")}
                  className={[
                    "px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
                    "shrink-0",
                    filterPayment === "all"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                >
                  Todos
                </button>

                {(Object.keys(paymentLabels) as PaymentMethod[]).map((key) => {
                  const Icon = paymentIcons[key];
                  const active = filterPayment === key;

                  return (
                    <button
                      key={key}
                      onClick={() => setFilterPayment(key)}
                      className={[
                        "px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
                        "inline-flex items-center gap-2 shrink-0",
                        active
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" />
                      {paymentLabels[key]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">ID</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Fecha y Hora</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Cajero</th>
                    <th className="text-center p-4 text-sm font-semibold text-slate-700">Método</th>
                    <th className="text-right p-4 text-sm font-semibold text-slate-700">Total</th>
                    <th className="text-center p-4 text-sm font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedSales.map((sale) => {
                    const PaymentIcon = paymentIcons[sale.paymentMethod];
                    const isDeleting = deletingId === sale.id;

                    return (
                      <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="p-4 font-semibold text-slate-900">
                          #{String(sale.id).padStart(4, "0")}
                        </td>
                        <td className="p-4 text-slate-500">{formatDateTime(sale.createdAt)}</td>
                        <td className="p-4 text-slate-900">{sale.cashierName}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2 text-slate-700">
                            <PaymentIcon className="h-4 w-4 text-slate-500" />
                            <span className="text-sm">{paymentLabels[sale.paymentMethod]}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-slate-900">
                          {formatCurrency(sale.total)}
                        </td>

                        {/* ✅ ACCIONES */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openSaleDetail(sale)}
                              className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center transition"
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4 text-slate-700" />
                            </button>

                            <button
                              onClick={() => downloadTicketPng(sale)}
                              disabled={ticketLoading}
                              className={[
                                "h-9 w-9 rounded-lg grid place-items-center transition",
                                ticketLoading
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-slate-900 hover:bg-slate-800 text-white",
                              ].join(" ")}
                              title="Descargar ticket (PNG)"
                            >
                              {ticketLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ReceiptText className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              onClick={() => askDeleteSale(sale)}
                              disabled={isDeleting}
                              className={[
                                "h-9 w-9 rounded-lg grid place-items-center transition",
                                isDeleting
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-rose-500 hover:bg-rose-600 text-white",
                              ].join(" ")}
                              title="Eliminar"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredSales.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-60" />
                <p className="font-semibold text-slate-700">No hay ventas</p>
              </div>
            )}
          </div>

          {/* PAGINACIÓN (para que totalPages no quede “unused”) */}
          {filteredSales.length > PAGE_SIZE && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Página <span className="font-semibold text-slate-700">{page}</span> /{" "}
                <span className="font-semibold text-slate-700">{totalPages}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={[
                    "px-3 py-2 rounded-xl border text-sm font-semibold transition",
                    page === 1
                      ? "border-slate-200 text-slate-400 bg-white cursor-not-allowed"
                      : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  Anterior
                </button>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={[
                    "px-3 py-2 rounded-xl border text-sm font-semibold transition",
                    page === totalPages
                      ? "border-slate-200 text-slate-400 bg-white cursor-not-allowed"
                      : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* MODAL Detalle (solo uno, sin abrir “otro modal feo”) */}
          {selectedSale && (
            <div className="fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedSale(null)} />
              <div className="relative h-full w-full grid place-items-center p-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="p-5 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Detalle de Venta #{String(selectedSale.id).padStart(4, "0")}
                      </h3>
                      <p className="text-sm text-slate-500">{formatDateTime(selectedSale.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedSale(null)}
                      className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="px-5 pb-5 space-y-4">
                    {detailLoading && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando detalle...
                      </div>
                    )}

                    {!detailLoading && detailError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
                        {detailError}
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Cajero</span>
                      <span className="font-semibold text-slate-900">{selectedSale.cashierName}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Método de Pago</span>
                      <span className="font-semibold text-slate-900">
                        {paymentLabels[selectedSale.paymentMethod]}
                      </span>
                    </div>

                    {/* Productos */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-slate-900">Productos</p>
                        <p className="text-xs text-slate-500">
                          {selectedSale.items?.length ? `${selectedSale.items.length} item(s)` : ""}
                        </p>
                      </div>

                      {selectedSale.items?.length ? (
                        <div className="space-y-2 max-h-52 overflow-auto pr-1">
                          {selectedSale.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <div className="min-w-0 pr-3">
                                <p className="text-slate-700 truncate">
                                  {item.quantity}x {item.productName}
                                </p>
                                <p className="text-xs text-slate-500">{formatCurrency(item.price)} c/u</p>
                              </div>
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          {detailLoading ? "Cargando..." : "Sin productos en el detalle."}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      <div className="flex justify-between text-base pt-2">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(selectedSale.total)}</span>
                      </div>
                    </div>

                    {selectedSale.paymentMethod === "cash" && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Recibido</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(selectedSale.cashReceived || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Cambio</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(selectedSale.change || 0)}
                          </span>
                        </div>
                      </div>
                    )}

                    
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}