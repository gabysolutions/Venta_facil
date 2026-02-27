import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Package,
  Wallet,
} from "lucide-react";
import Loader from "../../components/ui/Loader";
import {
  getActiveBalance,
  getProfitInfo,
  getSalesInfo,
} from "../../services/reports.service";
import { getLowStockProducts } from "../../services/products.service";
import type { LowStockProduct } from "../../services/products.service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
}

function formatDateLong(date = new Date()) {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimeFromSql(sqlDate: string) {
  const d = new Date(sqlDate.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [salesInfo, setSalesInfo] = useState({
    daily_transactions: 0,
    daily_total: 0,
    monthly_transactions: 0,
    monthly_total: 0,
  });

  const [profitInfo, setProfitInfo] = useState({
    day_amount: 0,
    month_amount: 0,
  });

  const [balance, setBalance] = useState<null | {
    id: number;
    open_date: string;
    initial_cash: number;
    cash_sales: number;
    transactions: number;
    name: string;
  }>(null);

  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [salesRes, profitRes, balanceRes, lowStockRes] = await Promise.all([
          getSalesInfo(),
          getProfitInfo(),
          getActiveBalance(),
          getLowStockProducts(),
        ]);

        if (!salesRes.success) throw new Error(salesRes.error || salesRes.message || "No se pudo cargar ventas");
        if (!profitRes.success) throw new Error(profitRes.error || profitRes.message || "No se pudo cargar utilidad");

        // ✅ si no hay corte activo NO es error
        const activeBalance = balanceRes?.success ? balanceRes.data : null;

        // ✅ si falla low stock, no truenes el dashboard (solo deja lista vacía)
        const lowStock = lowStockRes?.success ? lowStockRes.data : [];

        if (!alive) return;

        setSalesInfo(salesRes.data);
        setProfitInfo(profitRes.data);
        setBalance(activeBalance);
        setLowStockProducts(lowStock);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Error cargando dashboard");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ máximo 5 para no spamear la UI
  const lowStockList = useMemo(() => lowStockProducts.slice(0, 5), [lowStockProducts]);
  const lowStockTotal = lowStockProducts.length;

  if (loading) return <Loader fullScreen size={44} />;

  const profitDayIsNegative = profitInfo.day_amount < 0;
  const profitMonthIsNegative = profitInfo.month_amount < 0;

  const hasActiveCashout = !!balance?.id;

  const cashRegisterStatus = hasActiveCashout ? "Abierta" : "Cerrada";
  const openedAt = balance?.open_date ? formatTimeFromSql(balance.open_date) : "—";

  const currentCash = (balance?.initial_cash ?? 0) + (balance?.cash_sales ?? 0);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Resumen de tu negocio • {formatDateLong()}</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-bold">
          {error}
        </div>
      )}

      {/* Quick Action */}
      <Link
        to="/ventas"
        className="mb-6 lg:mb-8 block rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-xl hover:opacity-95 transition"
      >
        <div className="p-4 lg:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-white/20 grid place-items-center flex-shrink-0">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-lg truncate">Nueva Venta</p>
              <p className="text-sm text-white/85 truncate">Ir al punto de venta</p>
            </div>
          </div>
          <ArrowRight className="h-6 w-6 flex-shrink-0" />
        </div>
      </Link>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <MetricCard
          title="Utilidad de Hoy"
          value={formatCurrency(profitInfo.day_amount)}
          subtitle={profitDayIsNegative ? "Pérdida estimada" : "Ganancia estimada"}
          icon={<TrendingUp className="h-5 w-5 text-emerald-700" />}
          badge="Día"
          badgeClass={profitDayIsNegative ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}
          iconWrap={profitDayIsNegative ? "bg-rose-100" : "bg-emerald-100"}
        />
        <MetricCard
          title="Utilidad del Mes"
          value={formatCurrency(profitInfo.month_amount)}
          subtitle={profitMonthIsNegative ? "Pérdida estimada" : "Ganancia estimada"}
          icon={<TrendingUp className="h-5 w-5 text-indigo-700" />}
          iconWrap={profitMonthIsNegative ? "bg-rose-100" : "bg-indigo-100"}
          badge="Mes"
          badgeClass={profitMonthIsNegative ? "bg-rose-100 text-rose-800" : "bg-indigo-100 text-indigo-800"}
        />
        <MetricCard
          title="Ventas de Hoy"
          value={formatCurrency(salesInfo.daily_total)}
          subtitle={`${salesInfo.daily_transactions} transacciones`}
          icon={<DollarSign className="h-5 w-5 text-emerald-700" />}
          badge="Día"
          badgeClass="bg-emerald-100 text-emerald-800"
        />
        <MetricCard
          title="Ventas del Mes"
          value={formatCurrency(salesInfo.monthly_total)}
          subtitle={`${salesInfo.monthly_transactions} transacciones`}
          icon={<ShoppingCart className="h-5 w-5 text-slate-700" />}
          iconWrap="bg-slate-100"
          badge="Mes"
          badgeClass="bg-slate-100 text-slate-700"
        />
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Caja */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-extrabold text-slate-900">Caja actual</h2>
            <p className="text-sm text-slate-500">Estado y resumen</p>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Estado</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  cashRegisterStatus === "Abierta"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {cashRegisterStatus}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Cajero</span>
              <span className="text-sm font-semibold text-slate-900">{balance?.name ?? "—"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Fondo inicial</span>
              <span className="text-sm font-extrabold text-slate-900">
                {formatCurrency(balance?.initial_cash ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Ventas efectivo</span>
              <span className="text-sm font-extrabold text-slate-900">
                {formatCurrency(balance?.cash_sales ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Caja actual</span>
              <span className="text-sm font-extrabold text-slate-900">
                {formatCurrency(currentCash)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Transacciones</span>
              <span className="text-sm text-slate-600">{balance?.transactions ?? 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Abierta desde</span>
              <span className="text-sm text-slate-600">{openedAt}</span>
            </div>

            {/* ✅ BOTÓN DINÁMICO */}
            <Link
              to={hasActiveCashout ? "/corte-caja" : "/abrir-caja"}
              className={`mt-2 inline-flex w-full items-center justify-center rounded-xl font-extrabold px-4 py-3 transition text-white ${
                hasActiveCashout
                  ? "bg-emerald-500 hover:bg-emerald-400"
                  : "bg-indigo-600 hover:bg-indigo-500"
              }`}
            >
              {hasActiveCashout ? (
                <>
                  <Package className="h-5 w-5 mr-2" />
                  Ir a Corte de Caja
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5 mr-2" />
                  Abrir Caja
                </>
              )}
            </Link>
          </div>
        </div>

        {/* Stock */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900">Alerta de stock</h2>
              <p className="text-sm text-slate-500">
                {lowStockTotal ? `${lowStockTotal} producto(s) por reponer` : "Sin productos en stock bajo"}
              </p>
            </div>

            <Link to="/inventario" className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
              Ver →
            </Link>
          </div>

          <div className="p-4 space-y-3">
            {lowStockList.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <p className="font-bold text-slate-700">Todo en orden </p>
                <p className="text-sm">No hay productos en stock bajo.</p>
              </div>
            ) : (
              <>
                {lowStockList.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-amber-200 bg-amber-50 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-amber-100 grid place-items-center flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-700" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{p.description}</p>
                        <p className="text-sm text-slate-600 truncate">{p.category}</p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold flex-shrink-0">
                      {p.stock} / {p.min_stock}
                    </span>
                  </div>
                ))}

                {/* ✅ Si hay más de 5, avisamos que hay más sin llenar la pantalla */}
                {lowStockTotal > 5 && (
                  <div className="text-sm text-slate-500 pt-2">
                    Mostrando 5 de {lowStockTotal}. Para ver todo, entra a{" "}
                    <Link to="/inventario" className="font-bold text-emerald-700 hover:text-emerald-800">
                      Inventario
                    </Link>
                    .
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeClass = "bg-slate-100 text-slate-700",
  iconWrap = "bg-emerald-100",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  badgeClass?: string;
  iconWrap?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-xl ${iconWrap} grid place-items-center flex-shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-700 truncate">{title}</p>
            <p className="text-2xl font-extrabold text-slate-900 truncate">{value}</p>
          </div>
        </div>

        {badge && (
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex-shrink-0 ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
    </div>
  );
}