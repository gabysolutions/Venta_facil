import { useMemo, useEffect, useState } from "react";
import {
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Loader from "../../components/ui/Loader";

import { getActiveProducts } from "../../services/products.service";
import type { Product } from "../../services/products.service";

import { getActiveCategories } from "../../services/category.service";
import type { Category } from "../../services/category.service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

type FilterStatus = "all" | "low" | "ok";

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [prodRes, catRes] = await Promise.all([
          getActiveProducts(),
          getActiveCategories(),
        ]);

        if (!prodRes.success)
          throw new Error(prodRes.error || prodRes.message || "No se pudieron cargar productos");

        if (!catRes.success)
          throw new Error(catRes.error || catRes.message || "No se pudieron cargar categorías");

        if (!alive) return;

        setProducts(prodRes.data);
        setCategories(catRes.data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Error cargando inventario");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return products.filter((p) => {
      // ✅ backend no trae SKU/barcode en el ejemplo, así que buscamos por name y id
      const matchesSearch =
        p.description.toLowerCase().includes(term) ||
        String(p.id).includes(term);

      const matchesCategory =
        selectedCategory === "Todos" ? true : p.category === selectedCategory;

      const isLow = p.stock <= p.min_stock;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "low" && isLow) ||
        (filterStatus === "ok" && !isLow);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, filterStatus]);

  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter((p) => p.stock <= p.min_stock).length;
    const totalValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
    const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
    return { total, lowStock, totalValue, totalUnits };
  }, [products]);

  const categoryButtons = useMemo(() => {
    return [{ id: 0, description: "Todos", status: 1 } as Category, ...categories];
  }, [categories]);

  if (loading) return <Loader fullScreen size={44} />;

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Inventario</h1>
        <p className="text-slate-500 mt-1">Control y gestión de existencias</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-bold">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 grid place-items-center">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Productos</p>
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 grid place-items-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Stock Bajo</p>
              <p className="text-xl font-bold text-slate-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 grid place-items-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Valor Total</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center">
              <TrendingDown className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Unidades</p>
              <p className="text-xl font-bold text-slate-900">{stats.totalUnits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3 outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterStatus("all")}
              className={[
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
                filterStatus === "all"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")}
            >
              Todos
            </button>

            <button
              onClick={() => setFilterStatus("low")}
              className={[
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition inline-flex items-center",
                filterStatus === "low"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Stock Bajo
            </button>

            <button
              onClick={() => setFilterStatus("ok")}
              className={[
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
                filterStatus === "ok"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")}
            >
              Stock OK
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto mt-4 pb-1">
          {categoryButtons.map((c) => {
            const active = selectedCategory === c.description;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.description)}
                className={[
                  "px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                {c.description}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((p) => {
          const stockPercentage = (p.stock / (p.min_stock * 3)) * 100;
          const isLow = p.stock <= p.min_stock;
          const isCritical = p.stock <= 3;

          return (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 grid place-items-center">
                  <Package className="h-5 w-5 text-slate-500" />
                </div>

                {isLow && (
                  <span
                    className={[
                      "px-3 py-1 rounded-full text-xs font-semibold",
                      isCritical
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800",
                    ].join(" ")}
                  >
                    {isCritical ? "Crítico" : "Stock Bajo"}
                  </span>
                )}
              </div>

              <h3 className="font-semibold mb-1 text-slate-900 truncate">{p.description}</h3>
              <p className="text-sm text-slate-500 mb-3">{p.category}</p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Stock actual</span>
                    <span className={isLow ? "font-semibold text-rose-600" : "font-semibold text-slate-900"}>
                      {p.stock} unidades
                    </span>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={[
                        "h-full rounded-full transition-all",
                        isCritical
                          ? "bg-rose-500"
                          : isLow
                          ? "bg-amber-500"
                          : "bg-emerald-500",
                      ].join(" ")}
                      style={{ width: `${Math.min(100, stockPercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Mínimo requerido</span>
                  <span className="text-slate-900 font-medium">{p.min_stock} unidades</span>
                </div>

                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Valor en stock</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(p.cost * p.stock)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 mt-6">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-60" />
          <p className="font-semibold text-slate-700">No se encontraron productos</p>
          <p className="text-sm">Intenta con otros filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
}