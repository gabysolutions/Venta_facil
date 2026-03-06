import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileDown,
  X,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import type React from "react";

import {
  getSales,
  getSaleDetails,
  deleteSale,
  finalizeCreditSale,
} from "../../services/sales.service";

import ConfirmModal from "../../components/ui/ConfirmModal";
import Ticket, { type SaleUI as TicketSaleUI } from "./ticket";

import ReportFilters from "../../components/report/ReportFilters";
import type { PaymentMethod, StatusFilter } from "../../components/report/ReportFilters";
import SalesCards, { type SaleUI } from "../../components/report/SalesCards";
import SalesTable from "../../components/report/SalesTable";

type SaleItem = {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
};

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

function formatDateTime(date: Date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function mapPayMethod(pay_method: string): PaymentMethod {
  const v = (pay_method || "").toLowerCase().trim();
  if (v.includes("efectivo") || v === "cash") return "cash";
  if (v.includes("tarjeta") || v === "card") return "card";
  if (v.includes("transfer") || v === "transfer") return "transfer";
  return "transfer";
}

function getStatusLabel(status: number) {
  if (status === 0) return "Cancelada";
  if (status === 1) return "Finalizada";
  if (status === 2) return "Pendiente";
  return "Desconocido";
}

function getStatusBadgeClass(status: number) {
  if (status === 0) return "bg-rose-100 text-rose-700";
  if (status === 1) return "bg-emerald-100 text-emerald-700";
  if (status === 2) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function getErrorMessage(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message;
  return fallback;
}

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
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");

  const [sales, setSales] = useState<SaleUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSale, setSelectedSale] = useState<SaleUI | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [finalizingId, setFinalizingId] = useState<number | null>(null);
  const [finalizeError, setFinalizeError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SaleUI | null>(null);

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  const ticketRef = useRef<HTMLDivElement | null>(null);
  const [ticketSale, setTicketSale] = useState<TicketSaleUI | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getSales();
      if (!res.success) {
        throw new Error(res.error || res.message || "No se pudieron cargar ventas");
      }

      const mapped: SaleUI[] = (res.data || []).map((s) => ({
        id: s.id,
        createdAt: new Date(String(s.date).replace(" ", "T")),
        cashierName: s.user || "—",
        paymentMethod: mapPayMethod(s.pay_method),
        total: Number(s.total || 0),
        status: Number(s.status || 0),
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

      const matchesPayment =
        filterPayment === "all" ? true : sale.paymentMethod === filterPayment;

      const matchesStatus =
        filterStatus === "all" ? true : sale.status === filterStatus;

      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [sales, searchTerm, filterPayment, filterStatus]);

  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => Number(b.id) - Number(a.id));
  }, [filteredSales]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterPayment, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(sortedSales.length / PAGE_SIZE));

  const pagedSales = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedSales.slice(start, start + PAGE_SIZE);
  }, [sortedSales, page]);

  const stats = useMemo(() => {
    const total = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const count = filteredSales.length;
    const average = count > 0 ? total / count : 0;
    return { total, count, average };
  }, [filteredSales]);

  const exportCsv = () => {
    const header = ["id", "fecha", "cajero", "metodo", "estatus", "total"];
    const rows = sortedSales.map((s) => [
      s.id,
      s.createdAt.toISOString(),
      `"${(s.cashierName || "").replaceAll('"', '""')}"`,
      paymentLabels[s.paymentMethod],
      getStatusLabel(s.status),
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

  const openSaleDetail = async (sale: SaleUI) => {
    setSelectedSale(sale);
    setDetailLoading(true);
    setDetailError("");

    try {
      const res = await getSaleDetails(sale.id);
      if (!res.success) {
        throw new Error(res.error || res.message || "No se pudo cargar el detalle");
      }

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
      if (!res.success) {
        throw new Error(res.error || res.message || "No se pudo eliminar la venta");
      }

      setSales((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 0,
              }
            : s
        )
      );

      setSelectedSale((prev) =>
        prev?.id === id
          ? {
              ...prev,
              status: 0,
            }
          : prev
      );

      setConfirmOpen(false);
      setSaleToDelete(null);
    } catch (e) {
      setDeleteError(getErrorMessage(e, "Error eliminando venta"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleFinalizeSale = async (sale: SaleUI) => {
    try {
      setFinalizeError("");
      setFinalizingId(sale.id);

      const res = await finalizeCreditSale(sale.id);
      if (!res.success) {
        throw new Error(res.error || res.message || "No se pudo finalizar la venta");
      }

      setSales((prev) =>
        prev.map((s) =>
          s.id === sale.id
            ? {
                ...s,
                status: 1,
              }
            : s
        )
      );

      setSelectedSale((prev) =>
        prev?.id === sale.id
          ? {
              ...prev,
              status: 1,
            }
          : prev
      );
    } catch (e) {
      setFinalizeError(getErrorMessage(e, "Error finalizando venta"));
    } finally {
      setFinalizingId(null);
    }
  };

  const closeConfirm = () => {
    if (deletingId) return;
    setConfirmOpen(false);
    setSaleToDelete(null);
  };

  const downloadTicketPng = async (sale: SaleUI) => {
    const { toPng } = await import("html-to-image");

    try {
      setTicketLoading(true);

      let items = sale.items;
      if (!items?.length) {
        const res = await getSaleDetails(sale.id);
        if (!res.success) {
          throw new Error(res.error || res.message || "No se pudo cargar el detalle");
        }

        items = (res.data || []).map((it) => ({
          productName: it.description,
          quantity: Number(it.quantity || 0),
          price: Number(it.price || 0),
          subtotal: Number(it.subtotal || 0),
        }));
      }

    const forTicket: TicketSaleUI = {
      id: sale.id,
      createdAt: sale.createdAt,
      cashierName: sale.cashierName,
      paymentMethod: sale.paymentMethod,
      total: sale.total,
      status: sale.status,
      cashReceived: sale.cashReceived ?? 0,
      change: sale.change ?? 0,
      items: items ?? [],
    };

      setTicketSale(forTicket);

      await new Promise((resolve) => setTimeout(resolve, 200));

      if (!ticketRef.current) {
        throw new Error("No se pudo renderizar el ticket");
      }

      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `ticket_${String(sale.id).padStart(4, "0")}.png`;
      a.click();
    } catch (e) {
      alert(getErrorMessage(e, "No se pudo descargar el ticket"));
    } finally {
      setTicketLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <ConfirmModalAny
        open={confirmOpen}
        title="Cancelar / eliminar venta"
        description={
          saleToDelete
            ? `¿Seguro que deseas cancelar la venta #${String(saleToDelete.id).padStart(4, "0")}?`
            : "¿Seguro?"
        }
        confirmText={deletingId ? "Eliminando..." : "Sí, eliminar"}
        cancelText="Cancelar"
        loading={Boolean(deletingId)}
        onClose={closeConfirm}
        onConfirm={confirmDeleteSale}
      />

      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
        <div ref={ticketRef}>{ticketSale ? <Ticket sale={ticketSale} /> : null}</div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Historial de Ventas</h1>
          <p className="text-slate-500 mt-1">Consulta, filtra y administra el registro de ventas</p>
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

      {finalizeError && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700 text-sm">
          {finalizeError}
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

          <ReportFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterPayment={filterPayment}
            setFilterPayment={setFilterPayment}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />

          <SalesCards
            sales={pagedSales}
            deletingId={deletingId}
            finalizingId={finalizingId}
            ticketLoading={ticketLoading}
            onViewDetail={openSaleDetail}
            onDownloadTicket={downloadTicketPng}
            onAskDelete={askDeleteSale}
            onFinalizeSale={handleFinalizeSale}
            formatCurrency={formatCurrency}
            formatDateTime={formatDateTime}
            getStatusLabel={getStatusLabel}
            getStatusBadgeClass={getStatusBadgeClass}
          />

          <SalesTable
            sales={pagedSales}
            deletingId={deletingId}
            finalizingId={finalizingId}
            ticketLoading={ticketLoading}
            onViewDetail={openSaleDetail}
            onDownloadTicket={downloadTicketPng}
            onAskDelete={askDeleteSale}
            onFinalizeSale={handleFinalizeSale}
            formatCurrency={formatCurrency}
            formatDateTime={formatDateTime}
            getStatusLabel={getStatusLabel}
            getStatusBadgeClass={getStatusBadgeClass}
          />

          {sortedSales.length === 0 && (
            <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-60" />
              <p className="font-semibold text-slate-700">No hay ventas</p>
            </div>
          )}

          {sortedSales.length > PAGE_SIZE && (
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

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Estatus</span>
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                          getStatusBadgeClass(selectedSale.status),
                        ].join(" ")}
                      >
                        {getStatusLabel(selectedSale.status)}
                      </span>
                    </div>

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
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(selectedSale.total)}
                        </span>
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