import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ArrowRight,
  ShoppingBag,
  Check,
  X,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import { createSale } from "../../services/sales.service";
import type { CreateSalePayload } from "../../services/sales.service";

import { getActiveProducts } from "../../services/products.service";
import type { Product as ApiProduct } from "../../services/products.service";

import { getActiveCategories } from "../../services/category.service";
import type { Category } from "../../services/category.service";

import { getActiveCashout } from "../../services/openCashout.service";

type PaymentMethod = "cash" | "card" | "transfer";

type ProductUI = {
  id: number;
  name: string; // description
  category: string;
  categoryId: number;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  isActive: boolean;
};

type CartItem = {
  product: ProductUI;
  quantity: number;
  subtotal: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
}

function mapPaymentToApi(method: PaymentMethod) {
  if (method === "cash") return "efectivo";
  if (method === "card") return "tarjeta";
  return "transferencia";
}

/* =========================
   ✅ CartPanel FUERA
   (mismo archivo, mismo estilo)
========================= */

type CartPanelProps = {
  showPayment: boolean;
  setShowPayment: React.Dispatch<React.SetStateAction<boolean>>;

  cart: CartItem[];
  cartItemsCount: number;
  cartTotal: number;

  paymentMethod: PaymentMethod;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;

  cashReceived: string;
  setCashReceived: React.Dispatch<React.SetStateAction<string>>;

  quickAmounts: number[];
  changeAmount: number;

  updateQuantity: (productId: number, delta: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;

  completeSale: () => Promise<void>;
  creating: boolean;
  createError: string;
};

function CartPanel({
  showPayment,
  setShowPayment,
  cart,
  cartItemsCount,
  cartTotal,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  quickAmounts,
  changeAmount,
  updateQuantity,
  removeFromCart,
  clearCart,
  completeSale,
  creating,
  createError,
}: CartPanelProps) {
  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      {!showPayment ? (
        <>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900">Carrito</h2>
              <p className="text-sm text-slate-500">{cartItemsCount} artículos</p>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700"
              >
                <Trash2 className="h-4 w-4" />
                Limpiar
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full grid place-items-center text-center text-slate-500">
                <div>
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-semibold text-slate-700">El carrito está vacío</p>
                  <p className="text-sm">Agrega productos para comenzar</p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3"
                >
                  <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 grid place-items-center">
                    <ShoppingBag className="h-5 w-5 text-slate-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-sm text-slate-500">{formatCurrency(item.product.price)} c/u</p>
                    <p className="text-xs text-slate-400">Stock: {item.product.stock}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="h-8 w-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 grid place-items-center"
                    >
                      <Minus className="h-4 w-4 text-slate-700" />
                    </button>

                    <span className="w-8 text-center font-semibold text-slate-900">{item.quantity}</span>

                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="h-8 w-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 grid place-items-center"
                    >
                      <Plus className="h-4 w-4 text-slate-700" />
                    </button>
                  </div>

                  <div className="text-right ml-2">
                    <p className="font-bold text-slate-900">{formatCurrency(item.subtotal)}</p>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-200 space-y-4">
            {createError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
                {createError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Total</span>
              <span className="font-bold text-2xl text-slate-900">{formatCurrency(cartTotal)}</span>
            </div>

            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-4 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Cobrar
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900">Método de Pago</h2>
              <p className="text-sm text-slate-500">Total: {formatCurrency(cartTotal)}</p>
            </div>
            <button
              onClick={() => setShowPayment(false)}
              className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 grid place-items-center"
              aria-label="Volver"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { method: "cash" as PaymentMethod, icon: Banknote, label: "Efectivo" },
                { method: "card" as PaymentMethod, icon: CreditCard, label: "Tarjeta" },
                { method: "transfer" as PaymentMethod, icon: ArrowRight, label: "Transfer" },
              ].map(({ method, icon: Icon, label }) => {
                const active = paymentMethod === method;
                return (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={[
                      "p-4 rounded-2xl border-2 transition",
                      active ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-6 w-6 mx-auto mb-2",
                        active ? "text-emerald-600" : "text-slate-500",
                      ].join(" ")}
                    />
                    <p className={["text-sm font-semibold", active ? "text-emerald-700" : "text-slate-600"].join(" ")}>
                      {label}
                    </p>
                  </button>
                );
              })}
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Monto recibido</label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={cashReceived}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^\d*\.?\d*$/.test(v)) setCashReceived(v);
                    }}
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-center text-2xl font-bold outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashReceived(String(amt))}
                      className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-800 transition"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCashReceived(String(cartTotal))}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-800 transition"
                >
                  Monto exacto ({formatCurrency(cartTotal)})
                </button>

                {parseFloat(cashReceived || "0") > 0 && (
                  <div
                    className={[
                      "p-4 rounded-2xl text-center border",
                      changeAmount >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200",
                    ].join(" ")}
                  >
                    <p className="text-sm text-slate-500 mb-1">Cambio</p>
                    <p
                      className={[
                        "text-3xl font-extrabold",
                        changeAmount >= 0 ? "text-emerald-700" : "text-rose-700",
                      ].join(" ")}
                    >
                      {formatCurrency(Math.max(0, changeAmount))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {paymentMethod !== "cash" && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 grid place-items-center mx-auto mb-4">
                  {paymentMethod === "card" ? (
                    <CreditCard className="h-8 w-8 text-emerald-700" />
                  ) : (
                    <ArrowRight className="h-8 w-8 text-emerald-700" />
                  )}
                </div>
                <p className="font-bold text-slate-900 mb-1">
                  {paymentMethod === "card" ? "Pago con Tarjeta" : "Transferencia"}
                </p>
                <p className="text-sm text-slate-500">
                  {paymentMethod === "card"
                    ? "Procesa el pago en la terminal."
                    : "Confirma que la transferencia fue recibida."}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200">
            <button
              onClick={completeSale}
              disabled={creating || (paymentMethod === "cash" && changeAmount < 0)}
              className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-4 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Completar venta
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================
   SalesPage
========================= */

export default function SalesPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");

  const [cartOpen, setCartOpen] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string>("");

  // ====== LOAD DATA (VALIDA CORTE + CARGA CATÁLOGO) ======
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const balRes = await getActiveCashout();
        if (!balRes.success) throw new Error(balRes.error || balRes.message || "No se pudo validar la caja");

        if (!balRes.data) {
          navigate("/abrir-caja", { replace: true });
          return;
        }

        const [catRes, prodRes] = await Promise.all([getActiveCategories(), getActiveProducts()]);

        if (!catRes.success) throw new Error(catRes.error || catRes.message || "No se pudieron cargar categorías");
        if (!prodRes.success) throw new Error(prodRes.error || prodRes.message || "No se pudieron cargar productos");

        const cats = (catRes.data || []).filter((c) => Number(c.status) === 1);
        const prods = (prodRes.data || []).filter((p) => Number(p.status) === 1 && Number(p.stock) > 0);

        const mappedProducts: ProductUI[] = prods.map((p: ApiProduct) => ({
          id: Number(p.id),
          name: p.description,
          category: p.category,
          categoryId: Number(p.category_id),
          price: Number(p.price || 0),
          cost: Number(p.cost || 0),
          stock: Number(p.stock || 0),
          minStock: Number(p.min_stock || 0),
          isActive: Number(p.status) === 1,
        }));

        if (!mounted) return;
        setCategories(cats);
        setProducts(mappedProducts);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Error cargando datos");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // ====== FILTER PRODUCTS ======
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(term);
      const matchesCategory = selectedCategoryId === "all" ? true : p.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory && p.isActive && p.stock > 0;
    });
  }, [products, searchTerm, selectedCategoryId]);

  // ====== CART CALCS ======
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const cartItemsCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const changeAmount = useMemo(() => {
    const received = parseFloat(cashReceived) || 0;
    return received - cartTotal;
  }, [cashReceived, cartTotal]);

  // ====== CART ACTIONS ======
  const addToCart = (product: ProductUI) => {
    setCart((prev) => {
      const found = prev.find((i) => i.product.id === product.id);

      const alreadyQty = found?.quantity ?? 0;
      if (alreadyQty + 1 > product.stock) return prev;

      if (found) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.product.price }
            : i
        );
      }
      return [...prev, { product, quantity: 1, subtotal: product.price }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;

          const nextQty = i.quantity + delta;
          if (nextQty <= 0) return null;

          if (nextQty > i.product.stock) return i;

          return { ...i, quantity: nextQty, subtotal: nextQty * i.product.price };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setShowPayment(false);
    setCashReceived("");
    setPaymentMethod("cash");
  };

  const completeSale = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === "cash" && changeAmount < 0) {
      await Swal.fire({
        title: "Monto insuficiente",
        text: "El monto recibido no alcanza para completar la venta.",
        icon: "error",
        confirmButtonText: "Ok",
      });
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const balRes = await getActiveCashout();
      if (!balRes.success) throw new Error(balRes.error || balRes.message || "No se pudo validar la caja");
      if (!balRes.data) {
        navigate("/abrir-caja", { replace: true });
        return;
      }

      const payload: CreateSalePayload = {
        pay_method: mapPaymentToApi(paymentMethod),
        total: Number(cartTotal.toFixed(2)),
        cash_received: paymentMethod === "cash" ? Number((parseFloat(cashReceived) || 0).toFixed(2)) : 0,
        change: paymentMethod === "cash" ? Number(Math.max(0, changeAmount).toFixed(2)) : 0,
        products: cart.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
          price: Number(it.product.price.toFixed(2)),
          cost: Number(it.product.cost.toFixed(2)),
          subtotal: Number(it.subtotal.toFixed(2)),
        })),
      };

      Swal.fire({
        title: "Guardando venta...",
        text: "No cierres esta ventana 😅",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await createSale(payload);
      if (!res.success) throw new Error(res.error || res.message || "No se pudo crear la venta");

      const prodRes = await getActiveProducts();
      if (prodRes.success) {
        const prods = (prodRes.data || []).filter((p) => Number(p.status) === 1 && Number(p.stock) > 0);
        const mappedProducts: ProductUI[] = prods.map((p: ApiProduct) => ({
          id: Number(p.id),
          name: p.description,
          category: p.category,
          categoryId: Number(p.category_id),
          price: Number(p.price || 0),
          cost: Number(p.cost || 0),
          stock: Number(p.stock || 0),
          minStock: Number(p.min_stock || 0),
          isActive: Number(p.status) === 1,
        }));
        setProducts(mappedProducts);
      }

      await Swal.fire({
        title: "Venta reazlizada con exito",
        html: `
          <div style="text-align:center">
            <div><b>Total:</b> ${formatCurrency(cartTotal)}</div>
            <div><b>Método:</b> ${mapPaymentToApi(paymentMethod)}</div>
            ${
              paymentMethod === "cash"
                ? `<div><b>Recibido:</b> ${formatCurrency(parseFloat(cashReceived) || 0)}</div>
                   <div><b>Cambio:</b> ${formatCurrency(Math.max(0, changeAmount))}</div>`
                : ""
            }
          </div>
        `,
        icon: "success",
        confirmButtonText: "Listo",
      });

      clearCart();
      setCartOpen(false);
    } catch (e: any) {
      setCreateError(e?.message || "Error creando venta");

      await Swal.fire({
        title: "No se pudo completar",
        text: e?.message || "Error creando venta",
        icon: "error",
        confirmButtonText: "Ok",
      });
    } finally {
      setCreating(false);
      Swal.close();
    }
  };

  const quickAmounts = [50, 100, 200, 500];

  // ====== UI STATES (loading/error) ======
  if (loading) {
    return (
      <div className="p-10 text-center text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
        Cargando productos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <p className="font-bold">Tronó algo:</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // ====== MAIN LAYOUT ======
  return (
    <div className="h-[calc(100vh-0px)] flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col min-h-0 lg:border-r lg:border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3 outline-none focus:border-emerald-400"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={[
                "px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex-shrink-0",
                selectedCategoryId === "all"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")}
            >
              Todos
            </button>

            {categories.map((c) => {
              const active = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={[
                    "px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex-shrink-0",
                    active ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {c.description}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((p) => {
              const low = p.stock <= p.minStock;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition p-3 text-left"
                >
                  <div className="w-full aspect-square rounded-xl bg-slate-100 grid place-items-center mb-2">
                    <ShoppingBag className="h-8 w-8 text-slate-400" />
                  </div>

                  <p className="font-semibold text-sm text-slate-900 line-clamp-2 text-center">{p.name}</p>

                  <p className="text-center font-extrabold text-emerald-600 mt-1">{formatCurrency(p.price)}</p>

                  <div className="mt-2 text-center">
                    <span
                      className={[
                        "px-3 py-1 rounded-full text-xs font-bold",
                        low ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      Stock: {p.stock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="h-64 grid place-items-center text-slate-500">
              <div className="text-center">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-semibold text-slate-700">No se encontraron productos</p>
                <p className="text-sm">Intenta con otro término</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop panel */}
      <div className="hidden lg:block w-[420px] min-w-[420px] h-full">
        <CartPanel
          showPayment={showPayment}
          setShowPayment={setShowPayment}
          cart={cart}
          cartItemsCount={cartItemsCount}
          cartTotal={cartTotal}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          cashReceived={cashReceived}
          setCashReceived={setCashReceived}
          quickAmounts={quickAmounts}
          changeAmount={changeAmount}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          completeSale={completeSale}
          creating={creating}
          createError={createError}
        />
      </div>

      {/* Mobile drawer */}
      <div className="lg:hidden">
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-4 py-3 shadow-xl"
        >
          <ShoppingBag className="h-5 w-5" />
          Carrito ({cartItemsCount})
          <span className="ml-1">{formatCurrency(cartTotal)}</span>
        </button>

        {cartOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-[92%] max-w-md">
              <div className="h-full relative">
                <button
                  onClick={() => setCartOpen(false)}
                  className="absolute -left-12 top-4 h-10 w-10 rounded-full bg-white/90 hover:bg-white grid place-items-center shadow"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5 text-slate-800" />
                </button>

                <CartPanel
                  showPayment={showPayment}
                  setShowPayment={setShowPayment}
                  cart={cart}
                  cartItemsCount={cartItemsCount}
                  cartTotal={cartTotal}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  cashReceived={cashReceived}
                  setCashReceived={setCashReceived}
                  quickAmounts={quickAmounts}
                  changeAmount={changeAmount}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                  completeSale={completeSale}
                  creating={creating}
                  createError={createError}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}