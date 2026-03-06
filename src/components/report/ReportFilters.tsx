import { Search, CreditCard, Banknote, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PaymentMethod = "cash" | "card" | "transfer";
export type StatusFilter = 0 | 1 | 2 | "all";

type ReportFiltersProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterPayment: PaymentMethod | "all";
  setFilterPayment: (value: PaymentMethod | "all") => void;
  filterStatus: StatusFilter;
  setFilterStatus: (value: StatusFilter) => void;
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

export default function ReportFilters({
  searchTerm,
  setSearchTerm,
  filterPayment,
  setFilterPayment,
  filterStatus,
  setFilterStatus,
}: ReportFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6">
      <div className="flex flex-col gap-4">
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterPayment("all")}
            className={[
              "px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
              filterPayment === "all"
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            ].join(" ")}
          >
            Todos los métodos
          </button>

          {(Object.keys(paymentLabels) as PaymentMethod[]).map((key) => {
            const Icon = paymentIcons[key];
            const active = filterPayment === key;

            return (
              <button
                key={key}
                onClick={() => setFilterPayment(key)}
                className={[
                  "px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition inline-flex items-center gap-2",
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

        <div className="flex flex-wrap gap-2">
          {[
            { value: "all" as const, label: "Todos los estatus" },
            { value: 1 as const, label: "Finalizadas" },
            { value: 2 as const, label: "Pendientes" },
            { value: 0 as const, label: "Canceladas" },
          ].map((statusOption) => {
            const active = filterStatus === statusOption.value;

            return (
              <button
                key={String(statusOption.value)}
                onClick={() => setFilterStatus(statusOption.value)}
                className={[
                  "px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                {statusOption.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}