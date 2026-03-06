import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  X,
  Loader2,
  Check,
  PencilLine,
  CreditCard,
  Banknote,
  ArrowRight,
} from "lucide-react";
import Swal from "sweetalert2";

import { createSaleCredit } from "../../services/sales.service";
import type { CreateSaleCreditPayload } from "../../services/sales.service";

import { getActiveProducts } from "../../services/products.service";
import type { Product as ApiProduct } from "../../services/products.service";

import { getActiveCategories } from "../../services/category.service";
import type { Category } from "../../services/category.service";

import { getActiveCashout } from "../../services/cashout.service";

type PaymentMethod = "cash" | "card" | "transfer";

type ProductUI = {
  id: number;
  name: string;
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
  unitPrice: number;
  subtotal: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

function mapPaymentToApi(method: PaymentMethod) {
  if (method === "cash") return "efectivo";
  if (method === "card") return "tarjeta";
  return "transferencia";
}

type CreditCartPanelProps = {
  cart: CartItem[];
  cartItemsCount: number;
  cartTotal: number;
  creating: boolean;
  createError: string;
  paymentMethod: PaymentMethod;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  updateQuantity: (productId: number, delta: number) => void;
  updateUnitPrice: (productId: number, value: string) => void;
  resetUnitPrice: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  completeCreditSale: () => Promise<void>;
};

function CreditCartPanel({
  cart,
  cartItemsCount,
  cartTotal,
  creating,
  createError,
  paymentMethod,
  setPaymentMethod,
  updateQuantity,
  updateUnitPrice,
  resetUnitPrice,
  removeFromCart,
  clearCart,
  completeCreditSale,
}: CreditCartPanelProps) {
  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-slate-900">Crédito / Mayoreo</h2>
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

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full grid place-items-center text-center text-slate-500">
            <div>
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold text-slate-700">No hay productos aún</p>
              <p className="text-sm">Agrega productos para crear la venta a crédito</p>
            </div>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 grid place-items-center">
                  <ShoppingBag className="h-5 w-5 text-slate-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Precio lista: {formatCurrency(item.product.price)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Costo: {formatCurrency(item.product.cost)}
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Eliminar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cantidad
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="h-9 w-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 grid place-items-center"
                    >
                      <Minus className="h-4 w-4 text-slate-700" />
                    </button>

                    <span className="flex-1 text-center font-bold text-slate-900">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="h-9 w-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 grid place-items-center"
                    >
                      <Plus className="h-4 w-4 text-slate-700" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Precio unitario
                  </label>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <PencilLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={String(item.unitPrice)}
                        onChange={(e) => updateUnitPrice(item.product.id, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400"
                      />
                    </div>

                    <button
                      onClick={() => resetUnitPrice(item.product.id)}
                      className="rounded-xl bg-slate-200 hover:bg-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-slate-500">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(item.subtotal)}
                </span>
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

        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Método de pago</p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { method: "cash" as PaymentMethod, icon: Banknote, label: "Efectivo" },
              { method: "card" as PaymentMethod, icon: CreditCard, label: "Tarjeta" },
              { method: "transfer" as PaymentMethod, icon: ArrowRight, label: "Transfer" },
            ].map(({ method, icon: Icon, label }) => {
              const active = paymentMethod === method;

              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={[
                    "rounded-xl border px-3 py-3 text-sm font-semibold transition inline-flex flex-col items-center justify-center gap-1",
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Total crédito</span>
            <span className="font-bold text-2xl text-slate-900">
              {formatCurrency(cartTotal)}
            </span>
          </div>

         
        </div>

        <button
          onClick={completeCreditSale}
          disabled={creating || cart.length === 0}
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
              Guardar venta a crédito
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function SalesCreditPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const apply = () => setIsTablet(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const balRes = await getActiveCashout();
        if (!balRes.success) {
          throw new Error(balRes.error || balRes.message || "No se pudo validar la caja");
        }

        if (!balRes.data) {
          navigate("/abrir-caja", { replace: true });
          return;
        }

        const [catRes, prodRes] = await Promise.all([
          getActiveCategories(),
          getActiveProducts(),
        ]);

        if (!catRes.success) {
          throw new Error(catRes.error || catRes.message || "No se pudieron cargar categorías");
        }

        if (!prodRes.success) {
          throw new Error(prodRes.error || prodRes.message || "No se pudieron cargar productos");
        }

        const cats = (catRes.data || []).filter((c) => Number(c.status) === 1);
        const prods = (prodRes.data || []).filter((p) => Number(p.status) === 1);

        const mappedProducts: ProductUI[] = prods.map((p: ApiProduct) => ({
          id: Number(p.id),
          name: p.description,
          category: p.category,
          categoryId: Number(p.category_id),
          price: Number(p.price || 0),
          cost: Number(p.cost || 0),
          stock: Number((p as any).stock || 0),
          minStock: Number((p as any).min_stock || 0),
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

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(term);
      const matchesCategory =
        selectedCategoryId === "all" ? true : p.categoryId === selectedCategoryId;

      return matchesSearch && matchesCategory && p.isActive;
    });
  }, [products, searchTerm, selectedCategoryId]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.subtotal, 0),
    [cart]
  );

  const cartItemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const addToCart = (product: ProductUI) => {
    setCart((prev) => {
      const found = prev.find((i) => i.product.id === product.id);

      if (found) {
        return prev.map((i) =>
          i.product.id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: Number(((i.quantity + 1) * i.unitPrice).toFixed(2)),
              }
            : i
        );
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.price,
          subtotal: Number(product.price.toFixed(2)),
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;

          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;

          return {
            ...item,
            quantity: nextQty,
            subtotal: Number((nextQty * item.unitPrice).toFixed(2)),
          };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateUnitPrice = (productId: number, value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;

        const nextPrice = Number(value || 0);

        return {
          ...item,
          unitPrice: nextPrice,
          subtotal: Number((item.quantity * nextPrice).toFixed(2)),
        };
      })
    );
  };

  const resetUnitPrice = (productId: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;

        return {
          ...item,
          unitPrice: item.product.price,
          subtotal: Number((item.quantity * item.product.price).toFixed(2)),
        };
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPaymentMethod("cash");
  };

  const completeCreditSale = async () => {
    if (cart.length === 0) return;

    const invalidPrice = cart.some((item) => item.unitPrice <= 0);
    if (invalidPrice) {
      await Swal.fire({
        title: "Precio inválido",
        text: "Todos los productos deben tener un precio unitario mayor a 0.",
        icon: "warning",
        confirmButtonText: "Ok",
      });
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const balRes = await getActiveCashout();
      if (!balRes.success) {
        throw new Error(balRes.error || balRes.message || "No se pudo validar la caja");
      }

      if (!balRes.data) {
        navigate("/abrir-caja", { replace: true });
        return;
      }

      const payload: CreateSaleCreditPayload = {
        pay_method: mapPaymentToApi(paymentMethod),
        total: Number(cartTotal.toFixed(2)),
        cash_received: 0,
        change: 0,
        products: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: Number(item.unitPrice.toFixed(2)),
          cost: Number(item.product.cost.toFixed(2)),
          subtotal: Number(item.subtotal.toFixed(2)),
        })),
      };

      Swal.fire({
        title: "Guardando venta a crédito...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await createSaleCredit(payload);
      if (!res.success) {
        throw new Error(res.error || res.message || "No se pudo crear la venta a crédito");
      }

      const prodRes = await getActiveProducts();
      if (prodRes.success) {
        const prods = (prodRes.data || []).filter((p) => Number(p.status) === 1);

        const mappedProducts: ProductUI[] = prods.map((p: ApiProduct) => ({
          id: Number(p.id),
          name: p.description,
          category: p.category,
          categoryId: Number(p.category_id),
          price: Number(p.price || 0),
          cost: Number(p.cost || 0),
          stock: Number((p as any).stock || 0),
          minStock: Number((p as any).min_stock || 0),
          isActive: Number(p.status) === 1,
        }));

        setProducts(mappedProducts);
      }

      await Swal.fire({
        title: "Venta a crédito guardada",
        html: `
          <div style="text-align:center">
            <div><b>Total:</b> ${formatCurrency(cartTotal)}</div>
            <div><b>Tipo:</b> Crédito / Mayoreo</div>
            <div><b>Método:</b> ${mapPaymentToApi(paymentMethod)}</div>
            <div><b>Artículos:</b> ${cartItemsCount}</div>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Listo",
      });

      clearCart();
      setCartOpen(false);
    } catch (e: any) {
      setCreateError(e?.message || "Error creando venta a crédito");

      await Swal.fire({
        title: "No se pudo completar",
        text: e?.message || "Error creando venta a crédito",
        icon: "error",
        confirmButtonText: "Ok",
      });
    } finally {
      setCreating(false);
      Swal.close();
    }
  };

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

  return (
    <div className="h-[calc(100vh-0px)] flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col min-h-0 lg:border-r lg:border-slate-200">
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
          <div className="px-3 pt-3 pb-2 md:px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                autoFocus
              />
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategoryId("all")}
                  className={[
                    "px-3 py-2 rounded-xl text-sm font-semibold transition",
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
                        "px-3 py-2 rounded-xl text-sm font-semibold transition",
                        active
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                      ].join(" ")}
                    >
                      {c.description}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 md:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((p) => {
              const low = p.stock <= p.minStock;

              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition p-3 text-left"
                >
                  <div className="w-full aspect-square md:aspect-[4/3] rounded-xl bg-slate-100 grid place-items-center mb-2">
                    <ShoppingBag className="h-8 w-8 text-slate-400" />
                  </div>

                  <p className="font-semibold text-sm text-slate-900 line-clamp-2 text-center">
                    {p.name}
                  </p>

                  <p className="text-center font-extrabold text-emerald-600 mt-1">
                    {formatCurrency(p.price)}
                  </p>

                  <div className="mt-2 text-center">
                    <span
                      className={[
                        "px-3 py-1 rounded-full text-xs font-bold",
                        low
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700",
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

      <div className="hidden lg:block w-[440px] min-w-[440px] h-full">
        <CreditCartPanel
          cart={cart}
          cartItemsCount={cartItemsCount}
          cartTotal={cartTotal}
          creating={creating}
          createError={createError}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          updateQuantity={updateQuantity}
          updateUnitPrice={updateUnitPrice}
          resetUnitPrice={resetUnitPrice}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          completeCreditSale={completeCreditSale}
        />
      </div>

      <div className="lg:hidden">
        {!isTablet && (
          <button
            onClick={() => setCartOpen(true)}
            className="fixed bottom-8 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-3 shadow-xl"
          >
            <ShoppingBag className="h-5 w-5" />
            Crédito ({cartItemsCount})
            <span className="ml-1">{formatCurrency(cartTotal)}</span>
          </button>
        )}

        {isTablet && (
          <div className="fixed bottom-4 right-4 z-40">
            <button
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-4 py-3 shadow-xl"
            >
              <ShoppingBag className="h-5 w-5" />
              Ver carrito
              <span className="ml-2 rounded-xl bg-white/20 px-2 py-1 text-sm">
                {cartItemsCount}
              </span>
              <span className="ml-2">{formatCurrency(cartTotal)}</span>
            </button>
          </div>
        )}

        {cartOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-[92%] max-w-md md:w-[520px] md:max-w-none">
              <div className="h-full relative">
                <button
                  onClick={() => setCartOpen(false)}
                  className="absolute -left-12 top-4 h-10 w-10 rounded-full bg-white/90 hover:bg-white grid place-items-center shadow"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5 text-slate-800" />
                </button>

                <CreditCartPanel
                  cart={cart}
                  cartItemsCount={cartItemsCount}
                  cartTotal={cartTotal}
                  creating={creating}
                  createError={createError}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  updateQuantity={updateQuantity}
                  updateUnitPrice={updateUnitPrice}
                  resetUnitPrice={resetUnitPrice}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                  completeCreditSale={completeCreditSale}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}