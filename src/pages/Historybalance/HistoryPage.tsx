import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  DollarSign,
  CreditCard,
  ArrowRightLeft,
  AlertTriangle,
  Wallet,
  Package,
  Clock,
  User,
  Hash,
  ShoppingBag,
  FileText,
  Receipt,
} from "lucide-react";
import { getBalanceHistory } from "../../services/reports.service";

type SaleDetail = {
  id: number;
  quantity: number;
  description: string;
  price: number;
  subtotal: number;
};

type Sale = {
  id: number;
  user_id: number;
  pay_method: string;
  total: number;
  cash_received: number;
  change_returned: number;
  date: string;
  status: number;
  user: string;
  detail: SaleDetail[];
};

type Balance = {
  id: number;
  open_user: string;
  open_date: string;
  initial_cash: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
  cash_expenses: number;
  expected_cash: number;
  counted_cash: number;
  difference: number;
  note: string;
  close_user: string;
  close_date: string;
  sales: Sale[];
};

function formatCurrency(n: number) {
  return `$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(d: string) {
  return new Date(d.replace(" ", "T")).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DiffBadge({ diff }: { diff: number }) {
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        Cuadrado
      </span>
    );
  }

  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        Sobrante {formatCurrency(diff)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      Falta {formatCurrency(diff)}
    </span>
  );
}

function SaleDetailTable({ sale }: { sale: Sale }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border border-slate-200 rounded-lg overflow-hidden ${
        sale.status === 0 ? "opacity-60" : ""
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
          )}

          <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium shrink-0">Venta #{sale.id}</span>

            {sale.status === 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold shrink-0">
                Cancelada
              </span>
            )}
          </div>

          <span className="text-xs text-slate-400 shrink-0">·</span>
          <span className="text-xs text-slate-500 truncate">{sale.pay_method}</span>
          <span className="text-xs text-slate-400 shrink-0">·</span>
          <span className="text-xs text-slate-500 truncate">{sale.user}</span>
        </div>

        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <span className="text-xs text-slate-500">{formatDate(sale.date)}</span>
          <span className="text-sm font-semibold">{formatCurrency(sale.total)}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">
                    Producto
                  </th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-slate-500">
                    Cant.
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">
                    Precio
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody>
                {sale.detail.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-medium">{d.description}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">
                      {d.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500">
                      {formatCurrency(d.price)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {formatCurrency(d.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sale.pay_method === "Efectivo" && sale.status !== 0 && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 px-4 py-2.5 bg-slate-50 text-xs text-slate-500 border-t border-slate-200">
              <span>
                Recibido:{" "}
                <strong className="text-slate-900">
                  {formatCurrency(sale.cash_received)}
                </strong>
              </span>
              <span>
                Cambio:{" "}
                <strong className="text-slate-900">
                  {formatCurrency(sale.change_returned)}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BalanceCard({ balance }: { balance: Balance }) {
  const [open, setOpen] = useState(false);

  const summaryItems = [
    { icon: Wallet, label: "Fondo inicial", value: balance.initial_cash },
    { icon: DollarSign, label: "Ventas efectivo", value: balance.cash_sales },
    { icon: CreditCard, label: "Ventas tarjeta", value: balance.card_sales },
    {
      icon: ArrowRightLeft,
      label: "Transferencias",
      value: balance.transfer_sales,
    },
    {
      icon: AlertTriangle,
      label: "Egresos",
      value: balance.cash_expenses,
      negative: true,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 shrink-0">
            <Hash className="w-4 h-4 text-emerald-700" />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900">
              Corte #{balance.id}
            </h3>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
              <User className="w-3 h-3" /> {balance.open_user}
              <span className="mx-1">·</span>
              <Clock className="w-3 h-3" /> {formatDate(balance.open_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Esperado
            </p>
            <p className="text-sm font-bold text-slate-900">
              {formatCurrency(balance.expected_cash)}
            </p>
          </div>

          <div className="w-px h-8 bg-slate-200" />

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Contado
            </p>
            <p className="text-sm font-bold text-slate-900">
              {formatCurrency(balance.counted_cash)}
            </p>
          </div>

          <div className="w-px h-8 bg-slate-200" />
          <DiffBadge diff={balance.difference} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-slate-200">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="bg-white px-4 py-3 flex items-center gap-2.5"
          >
            <item.icon
              className={`w-4 h-4 shrink-0 ${
                item.negative ? "text-red-500" : "text-slate-500"
              }`}
            />

            <div className="min-w-0">
              <p className="text-[10px] text-slate-500">{item.label}</p>
              <p
                className={`text-sm font-semibold ${
                  item.negative && item.value !== 0 ? "text-red-600" : ""
                }`}
              >
                {item.negative
                  ? `- ${formatCurrency(item.value)}`
                  : formatCurrency(item.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {balance.note && (
        <div className="flex items-start gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
          <FileText className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600">{balance.note}</p>
        </div>
      )}

      <div className="border-t border-slate-200">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full px-5 py-3 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-medium flex items-center gap-2 text-slate-800">
            <Package className="w-4 h-4 text-slate-500" />
            Ventas ({balance.sales.length})
          </span>

          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="px-5 pb-4 space-y-2">
            {balance.sales.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Sin ventas en este corte
              </p>
            ) : (
              balance.sales.map((sale) => (
                <SaleDetailTable key={sale.id} sale={sale} />
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        <span>
          Cerrado por{" "}
          <strong className="text-slate-900">{balance.close_user}</strong>
        </span>
        <span>·</span>
        <span>{formatDate(balance.close_date)}</span>
      </div>
    </div>
  );
}

export default function HistorialCortes() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getBalanceHistory();

        if (response.success) {
          const sortedBalances = [...response.data].sort(
            (a, b) =>
              new Date(b.open_date.replace(" ", "T")).getTime() -
              new Date(a.open_date.replace(" ", "T")).getTime()
          );

          setBalances(sortedBalances);
        } else {
          setBalances([]);
          setError(response.message || "No se pudo cargar el historial de cortes.");
        }
      } catch (error) {
        console.error("Error al cargar el historial de cortes:", error);
        setBalances([]);
        setError("Ocurrió un error al cargar el historial de cortes.");
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, userFilter, dateFrom, dateTo]);

  const users = useMemo(() => {
    const set = new Set<string>();

    balances.forEach((b) => {
      set.add(b.open_user);
      set.add(b.close_user);
    });

    return Array.from(set).sort();
  }, [balances]);

  const filtered = useMemo(() => {
    return balances.filter((b) => {
      if (search) {
        const q = search.toLowerCase();
        const matchId = b.id.toString().includes(q);
        const matchUser =
          b.open_user.toLowerCase().includes(q) ||
          b.close_user.toLowerCase().includes(q);

        if (!matchId && !matchUser) return false;
      }

      if (
        userFilter !== "all" &&
        b.open_user !== userFilter &&
        b.close_user !== userFilter
      ) {
        return false;
      }

      if (dateFrom && b.open_date < `${dateFrom} 00:00:00`) return false;
      if (dateTo && b.open_date > `${dateTo} 23:59:59`) return false;

      return true;
    });
  }, [balances, search, userFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedBalances = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtered.slice(start, end);
  }, [filtered, currentPage]);

  const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filtered.length);

  return (
    <div className="min-h-screen">
      <main className="min-w-0 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Historial de Cortes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Consulta y revisa todos los cortes de caja realizados
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:flex-wrap items-stretch lg:items-end gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por ID o usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos los usuarios</option>
              {users.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <span className="text-xs text-slate-500 hidden sm:inline">a</span>

              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-500">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40 animate-pulse" />
              <p className="text-sm">Cargando cortes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-xl">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-slate-700">{error}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedBalances.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-xl">
                    <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">
                      No se encontraron cortes con los filtros aplicados
                    </p>
                  </div>
                ) : (
                  paginatedBalances.map((b) => (
                    <BalanceCard key={b.id} balance={b} />
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  <p className="text-sm text-slate-500">
                    Página {currentPage} de {totalPages}
                  </p>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-500 text-center mt-6">
                Mostrando {startItem} - {endItem} de {filtered.length} cortes
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}