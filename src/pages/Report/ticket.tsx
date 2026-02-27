// src/pages/Report/ticket.tsx
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
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Ticket({ sale }: { sale: SaleUI }) {
  const items = sale.items || [];

  return (
    <div style={{  fontFamily: "Arial, sans-serif",
        fontSize: 12,
        background: "#fff",
        color: "#111",
        padding: 12}}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>VENTA FÁCIL</div>
        <div style={{ color: "#666" }}>Ticket de venta</div>
      </div>

      <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />

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

      <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />

      <div style={{ fontWeight: 700, marginBottom: 6 }}>Productos</div>

      {items.length ? (
        <div>
          {items.map((it, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: 11 }}>
                <span>{formatCurrency(it.price)} c/u</span>
                <span />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#666" }}>Sin detalle</div>
      )}

      <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14 }}>
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

      <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />
      <div style={{ textAlign: "center", color: "#666" }}>Gracias por su compra ✨</div>
    </div>
  );
}