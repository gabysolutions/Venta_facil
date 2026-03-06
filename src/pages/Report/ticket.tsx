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
  status: number;
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
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
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



function getStatusColor(status: number) {
  if (status === 0) return "#dc2626";
  if (status === 1) return "#059669";
  if (status === 2) return "#d97706";
  return "#475569";
}

export default function Ticket({ sale }: { sale: SaleUI }) {
  const items = sale.items || [];
  const isCredit = sale.status === 2;
  const isCancelled = sale.status === 0;
  const isCashFinalized = sale.status === 1 && sale.paymentMethod === "cash";

  return (
    <div
      style={{
        width: 280,
        fontFamily: "Arial, sans-serif",
        fontSize: 15,
        background: "#fff",
        color: "#111",
        padding: 12,
        lineHeight: 1.4,
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: 0.5 }}>SNAQUII</div>
        <div style={{ color: "#666", fontSize: 18, marginTop: 2 }}>Healthy Bites</div>

        <div style={{ color: "#666", fontSize: 15, marginTop: 6 }}>
          Dirección: Juan Silveti 101, El Toreo
          <br />
          82120 Mazatlán, Sin.
        </div>

        <div style={{ color: "#666", fontSize: 15, marginTop: 2 }}>
          Contacto: 667 898 7730
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

      {/* STATUS */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: 16,
          color: getStatusColor(sale.status),
          marginBottom: 8,
        }}
      >
        {isCredit
          ? "VENTA A CRÉDITO"
          : isCancelled
          ? "VENTA CANCELADA"
          : "VENTA FINALIZADA"}
      </div>

    

      <div style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

      {/* INFO */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>ID</span>
        <span style={{ fontWeight: 800 }}>#{String(sale.id).padStart(4, "0")}</span>
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
      <div style={{ fontWeight: 800, marginBottom: 4 }}>Productos</div>

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
                <div style={{ fontWeight: 800 }}>{formatCurrency(it.subtotal)}</div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#666",
                  fontSize: 14,
                }}
              >
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        <span>TOTAL</span>
        <span>{formatCurrency(sale.total)}</span>
      </div>

      {/* SOLO SI ES EFECTIVO Y FINALIZADA */}
      {isCashFinalized && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Recibido</span>
            <span>{formatCurrency(sale.cashReceived ?? 0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Cambio</span>
            <span>{formatCurrency(sale.change ?? 0)}</span>
          </div>
        </>
      )}

      {/* MENSAJE EXTRA PARA CREDITO */}
      {isCredit && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            border: "1px dashed #d97706",
            color: "#92400e",
            background: "#fffbeb",
            fontSize: 13,
            textAlign: "center",
            fontWeight: 700,
          }}
        >
          PENDIENTE DE PAGO
          <br />
          Este ticket corresponde a una venta a crédito.
        </div>
      )}

      {/* MENSAJE EXTRA PARA CANCELADA */}
      {isCancelled && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            border: "1px dashed #dc2626",
            color: "#991b1b",
            background: "#fef2f2",
            fontSize: 13,
            textAlign: "center",
            fontWeight: 700,
          }}
        >
          TICKET DE VENTA CANCELADA
        </div>
      )}

      <div style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

      {/* FOOTER */}
      <div style={{ textAlign: "center", color: "#666", fontSize: 14 }}>
        Gracias por su compra ✨
        <br />
        Conserve su ticket
      </div>

      <div style={{ borderTop: "2px dashed #999", margin: "8px 0" }} />
    </div>
  );
}