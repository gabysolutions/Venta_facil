import {
  Eye,
  Loader2,
  ReceiptText,
  Trash2,
  Check,
  CreditCard,
  Banknote,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PaymentMethod } from "./ReportFilters";
import type { SaleUI } from "./SalesCards";

type SalesTableProps = {
  sales: SaleUI[];
  deletingId: number | null;
  finalizingId: number | null;
  ticketLoading: boolean;
  onViewDetail: (sale: SaleUI) => void;
  onDownloadTicket: (sale: SaleUI) => void;
  onAskDelete: (sale: SaleUI) => void;
  onFinalizeSale: (sale: SaleUI) => void;
  formatCurrency: (value: number) => string;
  formatDateTime: (date: Date) => string;
  getStatusLabel: (status: number) => string;
  getStatusBadgeClass: (status: number) => string;
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

export default function SalesTable({
  sales,
  deletingId,
  finalizingId,
  ticketLoading,
  onViewDetail,
  onDownloadTicket,
  onAskDelete,
  onFinalizeSale,
  formatCurrency,
  formatDateTime,
  getStatusLabel,
  getStatusBadgeClass,
}: SalesTableProps) {
  return (
    <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left p-4 text-sm font-semibold text-slate-700">ID</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Fecha y Hora</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Cajero</th>
              <th className="text-center p-4 text-sm font-semibold text-slate-700">Método</th>
              <th className="text-center p-4 text-sm font-semibold text-slate-700">Estatus</th>
              <th className="text-right p-4 text-sm font-semibold text-slate-700">Total</th>
              <th className="text-center p-4 text-sm font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {sales.map((sale) => {
              const PaymentIcon = paymentIcons[sale.paymentMethod];
             

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
                  <td className="p-4 text-center">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                        getStatusBadgeClass(sale.status),
                      ].join(" ")}
                    >
                      {getStatusLabel(sale.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">
                    {formatCurrency(sale.total)}
                  </td>

                 <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                        <button
                        onClick={() => onViewDetail(sale)}
                        className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center transition"
                        title="Ver detalle"
                        >
                        <Eye className="h-4 w-4 text-slate-700" />
                        </button>

                        {sale.status !== 0 && (
                        <button
                            onClick={() => onDownloadTicket(sale)}
                            disabled={ticketLoading}
                            className={[
                            "h-9 w-9 rounded-lg grid place-items-center transition",
                            ticketLoading
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-slate-900 hover:bg-slate-800 text-white",
                            ].join(" ")}
                            title="Descargar ticket"
                        >
                            {ticketLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                            <ReceiptText className="h-4 w-4" />
                            )}
                        </button>
                        )}

                        {sale.status === 2 && (
                        <button
                            onClick={() => onFinalizeSale(sale)}
                            disabled={finalizingId === sale.id}
                            className={[
                            "h-9 w-9 rounded-lg grid place-items-center transition",
                            finalizingId === sale.id
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white",
                            ].join(" ")}
                            title="Finalizar venta"
                        >
                            {finalizingId === sale.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                            <Check className="h-4 w-4" />
                            )}
                        </button>
                        )}

                        {(sale.status === 1 || sale.status === 2) && (
                        <button
                            onClick={() => onAskDelete(sale)}
                            disabled={deletingId === sale.id}
                            className={[
                            "h-9 w-9 rounded-lg grid place-items-center transition",
                            deletingId === sale.id
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-rose-500 hover:bg-rose-600 text-white",
                            ].join(" ")}
                            title="Eliminar"
                        >
                            {deletingId === sale.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                            <Trash2 className="h-4 w-4" />
                            )}
                        </button>
                        )}
                    </div>
                    </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sales.length === 0 && (
        <div className="p-12 text-center text-slate-500">
          <p className="font-semibold text-slate-700">No hay ventas</p>
        </div>
      )}
    </div>
  );
}