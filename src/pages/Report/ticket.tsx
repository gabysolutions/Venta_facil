type PaymentMethod = "cash" | "card" | "transfer";

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
  cashReceived?: number;
  change?: number;
  items?: SaleItem[];
};

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
}

function formatDateTime(date: Date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default function Ticket({ sale }: { sale: SaleUI }) {
  const items = sale.items || [];

  return (
    <div
      style={{
        width: 280,
        fontFamily: "Arial, sans-serif",
        fontSize: 12,
        background: "#fff",
        color: "#111",
        padding: 12,
        lineHeight: 1.4,
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>SNAQUII</div>
        <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>Healthy Bites</div>

        <div style={{ color: "#666", fontSize: 10, marginTop: 6 }}>
          Dirección: Juan Silveti 101, El Toreo
          <br />
          82120 Mazatlán, Sin.
        </div>

        <div style={{ color: "#666", fontSize: 10, marginTop: 2 }}>
          Contacto: 667 898 7730
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

      {/* INFO */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>ID</span>
        <span style={{ fontWeight: 700 }}>#{String(sale.id).padStart(4, "0")}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Fecha</span>
        <span>{formatDateTime(sale.createdAt)}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Cajero</span>
        <span>{sale.cashierName}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Método</span>
        <span>{paymentLabels[sale.paymentMethod]}</span>
      </div>

      <div style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

      {/* PRODUCTOS */}
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Productos</div>

      {items.length ? (
        <div>
          {items.map((it, idx) => (
            <div key={idx} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                <div
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.quantity}x {it.productName}
                </div>
                <div style={{ fontWeight: 700 }}>{formatCurrency(it.subtotal)}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: 10 }}>
                <span>{formatCurrency(it.price)} c/u</span>
                <span />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#666" }}>Sin detalle</div>
      )}

      <div style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

      {/* TOTAL */}
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 14 }}>
        <span>TOTAL</span>
        <span>{formatCurrency(sale.total)}</span>
      </div>

      {sale.paymentMethod === "cash" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Recibido</span>
            <span>{formatCurrency(sale.cashReceived || 0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Cambio</span>
            <span>{formatCurrency(sale.change || 0)}</span>
          </div>
        </>
      )}

      <div style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

      {/* FOOTER */}
      <div style={{ textAlign: "center", color: "#666", fontSize: 10 }}>
        Gracias por su compra ✨
        <br />
        Conserve su ticket
      </div>
    </div>
  );
}