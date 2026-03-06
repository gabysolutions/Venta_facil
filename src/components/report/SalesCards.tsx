import {
  Eye,
  Loader2,
  ReceiptText,
  ShoppingBag,
  Trash2,
  Check,
  CreditCard,
  Banknote,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PaymentMethod } from "./ReportFilters";

type SaleItem = {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export type SaleUI = {
  id: number;
  createdAt: Date;
  cashierName: string;
  paymentMethod: PaymentMethod;
  total: number;
  status: number;
  cashReceived?: number;
  change?: number;
  items?: SaleItem[];
};

type SalesCardsProps = {
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

export default function SalesCards({
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
}: SalesCardsProps) {
  if (sales.length === 0) {
    return (
      <div className="lg:hidden rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-60" />
        <p className="font-semibold text-slate-700">No hay ventas</p>
      </div>
    );
  }

  return (
    <div className="lg:hidden space-y-3">
      {sales.map((sale) => {
        const PaymentIcon = paymentIcons[sale.paymentMethod];
        const isDeleting = deletingId === sale.id;
        const isFinalizing = finalizingId === sale.id;

        return (
          <div
            key={sale.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-900">
                  Venta #{String(sale.id).padStart(4, "0")}
                </p>
                <p className="text-sm text-slate-500">{formatDateTime(sale.createdAt)}</p>
                <p className="text-sm text-slate-700 truncate">{sale.cashierName}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-slate-900">{formatCurrency(sale.total)}</p>

                <div className="mt-1 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700">
                  <PaymentIcon className="h-4 w-4 text-slate-500" />
                  <span>{paymentLabels[sale.paymentMethod]}</span>
                </div>

                <div className="mt-2">
                  <span
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                      getStatusBadgeClass(sale.status),
                    ].join(" ")}
                  >
                    {getStatusLabel(sale.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => onViewDetail(sale)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 inline-flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Detalle
              </button>

              {sale.status !== 0 && (
                <button
                  onClick={() => onDownloadTicket(sale)}
                  disabled={ticketLoading}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold inline-flex items-center justify-center gap-2",
                    ticketLoading
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800 text-white",
                  ].join(" ")}
                >
                  {ticketLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ReceiptText className="h-4 w-4" />
                  )}
                  Ticket
                </button>
              )}

               {sale.status === 2 && (
                    <button
                        onClick={() => onFinalizeSale(sale)}
                        disabled={isFinalizing}
                        className={[
                        "rounded-xl px-3 py-2 text-sm font-semibold inline-flex items-center justify-center gap-2",
                        isFinalizing
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white",
                        ].join(" ")}
                    >
                        {isFinalizing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                        <Check className="h-4 w-4" />
                        )}
                        Finalizar
                    </button>
                    )}

                    {(sale.status === 1 || sale.status === 2) && (
                    <button
                        onClick={() => onAskDelete(sale)}
                        disabled={isDeleting}
                        className={[
                        "rounded-xl px-3 py-2 text-sm font-semibold inline-flex items-center justify-center gap-2",
                        isDeleting
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-rose-500 hover:bg-rose-600 text-white",
                        ].join(" ")}
                    >
                        {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                        <Trash2 className="h-4 w-4" />
                        )}
                        Eliminar
                    </button>
                    )}
            </div>
          </div>
        );
      })}
    </div>
  );
}