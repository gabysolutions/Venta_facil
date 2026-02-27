import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Search, Pencil, Trash2, X, Power, Tags } from "lucide-react";
import Loader from "../../components/ui/Loader";
import Swal from "sweetalert2";

import { getActiveCategories } from "../../services/category.service";
import type { Category } from "../../services/category.service";

import {
  activateProduct,
  createProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
} from "../../services/products.service";
import type { Product } from "../../services/products.service";

// ✅ AJUSTA ESTA RUTA A DONDE TENGAS TU COMPONENTE
import CategoryModal from "../../components/categories/CategoryModal";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true); // carga inicial
  const [busyId, setBusyId] = useState<number | null>(null); // acciones por fila
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  // ✅ NUEVO: modal categorías
  const [showCategories, setShowCategories] = useState(false);

  const [form, setForm] = useState({
    description: "",
    category_id: "",
    price: "",
    cost: "",
    stock: "",
    min_stock: "",
  });

  const categoriesWithAll = useMemo(
    () => [{ id: 0, description: "Todos", status: 1 } as Category, ...categories],
    [categories]
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [catRes, prodRes] = await Promise.all([getActiveCategories(), getAllProducts()]);

      if (!catRes.success) throw new Error(catRes.error || catRes.message || "No se pudieron cargar categorías");
      if (!prodRes.success) throw new Error(prodRes.error || prodRes.message || "No se pudieron cargar productos");

      setCategories(catRes.data);
      setProducts(prodRes.data);
    } catch (e: any) {
      setError(e?.message || "Error cargando productos");
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesOnly = async () => {
    try {
      const catRes = await getActiveCategories();
      if (!catRes.success) throw new Error(catRes.error || catRes.message || "No se pudieron cargar categorías");
      setCategories(catRes.data);
    } catch (e: any) {
      // si quieres mostrar error aquí, descomenta:
      // setError(e?.message || "Error cargando categorías");
    }
  };

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

  // ✅ evita “categoría fantasma” si la renombraste/eliminaste
  useEffect(() => {
    if (selectedCategory === "Todos") return;

    const exists = categories.some((c) => c.description === selectedCategory);
    if (!exists) setSelectedCategory("Todos");
  }, [categories, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return products.filter((p) => {
      const matchesSearch =
        p.description.toLowerCase().includes(term) ||
        String(p.id).includes(term) ||
        p.category.toLowerCase().includes(term);

      const matchesCategory = selectedCategory === "Todos" ? true : p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const openNew = () => {
    setError(null);
    setEditing(null);

    const defaultCategoryId = categories[0]?.id ? String(categories[0].id) : "";

    setForm({
      description: "",
      category_id: defaultCategoryId,
      price: "",
      cost: "",
      stock: "",
      min_stock: "",
    });

    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setError(null);
    setEditing(p);

    setForm({
      description: p.description,
      category_id: String(p.category_id),
      price: String(p.price),
      cost: String(p.cost),
      stock: String(p.stock),
      min_stock: String(p.min_stock),
    });

    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.description.trim() || !form.category_id || form.price === "") {
      setError("Completa los campos requeridos: Nombre, Categoría y Precio.");
      return;
    }

    const payload = {
      description: form.description.trim(),
      category_id: Number(form.category_id),
      price: Number(form.price) || 0,
      cost: Number(form.cost) || 0,
      stock: Number(form.stock) || 0,
      min_stock: Number(form.min_stock) || 0,
    };

    try {
      setBusyId(editing?.id ?? -1);

      if (editing) {
        const res = await updateProduct({ id: editing.id, ...payload });
        if (!res.success) throw new Error(res.error || res.message || "No se pudo actualizar el producto");

        await Swal.fire({
          icon: "success",
          title: "Producto actualizado",
          text: "Los cambios se guardaron correctamente.",
          confirmButtonColor: "#10b981",
        });
      } else {
        const res = await createProduct(payload);
        if (!res.success) throw new Error(res.error || res.message || "No se pudo crear el producto");

        await Swal.fire({
          icon: "success",
          title: "Producto creado",
          text: "El producto se registró correctamente.",
          confirmButtonColor: "#10b981",
        });
      }

      setShowModal(false);
      await loadData();
    } catch (e: any) {
      const msg = e?.message || "Error guardando producto";

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonColor: "#ef4444",
      });

      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async (id: number) => {
    setError(null);

    try {
      setBusyId(id);

      const res = await deleteProduct(id);
      if (!res.success) throw new Error(res.error || res.message || "No se pudo eliminar el producto");

      await Swal.fire({
        icon: "success",
        title: "Producto eliminado",
        confirmButtonColor: "#10b981",
      });

      await loadData();
    } catch (e: any) {
      const msg = e?.message || "Error eliminando producto";

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonColor: "#ef4444",
      });

      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const askDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Eliminar producto",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      await doDelete(id);
    }
  };

  const doActivate = async (id: number) => {
    setError(null);

    try {
      setBusyId(id);

      const res = await activateProduct(id);
      if (!res.success) throw new Error(res.error || res.message || "No se pudo activar el producto");

      await Swal.fire({
        icon: "success",
        title: "Producto activado",
        confirmButtonColor: "#10b981",
      });

      await loadData();
    } catch (e: any) {
      const msg = e?.message || "Error activando producto";

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonColor: "#ef4444",
      });

      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader fullScreen size={44} />;

  const noCategories = categories.length === 0;

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Productos</h1>
          <p className="text-slate-500 mt-1">{products.length} productos en el catálogo</p>
        </div>

        {/* ✅ NUEVO: botón categorías (no toca tus modales de producto) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowCategories(true)}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 transition w-full sm:w-auto"
            title="Administrar categorías"
          >
            <Tags className="h-5 w-5 mr-2" />
            Categorías
          </button>

          <button
            onClick={openNew}
            disabled={noCategories}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 transition w-full sm:w-auto"
            title={noCategories ? "Primero crea categorías" : "Crear producto"}
          >
            <Plus className="h-5 w-5 mr-2 text-white" />
            Nuevo producto
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-bold">
          {error}
        </div>
      )}

      {/* Search + Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, categoría o ID..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3 outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categoriesWithAll.map((c) => {
              const active = selectedCategory === c.description;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.description)}
                  className={[
                    "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
                    active ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {c.description}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ✅ DESKTOP TABLE */}
      <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 text-sm font-semibold text-slate-700">Producto</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-700">Categoría</th>
                <th className="text-right p-4 text-sm font-semibold text-slate-700">Precio</th>
                <th className="text-right p-4 text-sm font-semibold text-slate-700">Costo</th>
                <th className="text-right p-4 text-sm font-semibold text-slate-700">Stock</th>
                <th className="text-center p-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-center p-4 text-sm font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((p) => {
                const low = p.stock <= p.min_stock;
                const inactive = p.status === 0;

                return (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 grid place-items-center">
                          <Package className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-slate-900 block truncate">{p.description}</span>
                          <span className="text-xs text-slate-500">ID: {p.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {p.category}
                      </span>
                    </td>

                    <td className="p-4 text-right font-medium text-slate-900">{formatCurrency(p.price)}</td>
                    <td className="p-4 text-right text-slate-500">{formatCurrency(p.cost)}</td>

                    <td className="p-4 text-right">
                      <span className={low ? "font-semibold text-rose-600" : "font-medium text-slate-900"}>
                        {p.stock}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      {inactive ? (
                        <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold">
                          Inactivo
                        </span>
                      ) : low ? (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                          Stock bajo
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          Activo
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {inactive ? (
                          <button
                            onClick={() => doActivate(p.id)}
                            disabled={busyId === p.id}
                            className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center transition"
                            aria-label="Activar"
                            title="Activar"
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {busyId === p.id ? "Activando..." : "Activar"}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openEdit(p)}
                              className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center transition"
                              aria-label="Editar"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4 text-slate-700" />
                            </button>

                            <button
                              onClick={() => askDelete(p.id)}
                              disabled={busyId === p.id}
                              className="h-9 w-9 rounded-lg bg-rose-100 hover:bg-rose-200 grid place-items-center transition disabled:opacity-60"
                              aria-label="Eliminar"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4 text-rose-700" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-60" />
            <p className="font-semibold text-slate-700">No se encontraron productos</p>
            <p className="text-sm">Intenta con otro término de búsqueda</p>
          </div>
        )}
      </div>

      {/* ✅ MOBILE CARDS */}
      <div className="lg:hidden space-y-3">
        {filteredProducts.map((p) => {
          const low = p.stock <= p.min_stock;
          const inactive = p.status === 0;

          return (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 grid place-items-center flex-shrink-0">
                    <Package className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{p.description}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {p.category} • ID: {p.id}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {inactive ? (
                    <button
                      onClick={() => doActivate(p.id)}
                      disabled={busyId === p.id}
                      className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center"
                      aria-label="Activar"
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {busyId === p.id ? "Activando..." : "Activar"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => openEdit(p)}
                        className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4 text-slate-700" />
                      </button>

                      <button
                        onClick={() => askDelete(p.id)}
                        disabled={busyId === p.id}
                        className="h-9 w-9 rounded-lg bg-rose-100 hover:bg-rose-200 grid place-items-center disabled:opacity-60"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-rose-700" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Precio</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(p.price)}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Stock</p>
                  <p className={low ? "font-semibold text-rose-600" : "font-semibold text-slate-900"}>{p.stock}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Mínimo</p>
                  <p className="font-semibold text-slate-900">{p.min_stock}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Estado</p>
                  {inactive ? (
                    <span className="inline-flex px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold">
                      Inactivo
                    </span>
                  ) : low ? (
                    <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                      Stock bajo
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      Activo
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear/Editar (NO TOCADO) */}
      {showModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative h-full w-full grid place-items-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="p-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{editing ? "Editar producto" : "Nuevo producto"}</h3>
                  <p className="text-sm text-slate-500">Completa la información del producto.</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={submit} className="p-5 pt-0 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Nombre *</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
                    placeholder="Nombre del producto"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Precio *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Costo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.cost}
                      onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Stock</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Stock mínimo</label>
                    <input
                      type="number"
                      value={form.min_stock}
                      onChange={(e) => setForm((p) => ({ ...p, min_stock: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
                      placeholder="5"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Categoría *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-3 font-semibold text-slate-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={busyId !== null}
                    className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white py-3 font-semibold transition"
                  >
                    {editing ? "Guardar cambios" : "Crear producto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Category Modal (NUEVO) */}
      <CategoryModal
        open={showCategories}
        onClose={() => setShowCategories(false)}
        onSaved={async () => {
          await loadCategoriesOnly(); // 👈 NO loadData() para evitar parpadeo
        }}
      />
    </div>
  );
}