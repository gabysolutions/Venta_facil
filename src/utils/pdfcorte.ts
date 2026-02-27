import jsPDF from "jspdf";
import type { ActiveCashout } from "../services/cashout.service";

function money(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function safeNum(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

type PdfCorteParams = {
  active: ActiveCashout;
  countedCash: number;
  note?: string;
};

export function downloadCortePdf({ active, countedCash, note }: PdfCorteParams) {
  const initial = safeNum(active.initial_cash);
  const cashSales = safeNum(active.cash_sales);
  const cardSales = safeNum(active.card_sales);
  const transferSales = safeNum(active.transfer_sales);
  const expenses = safeNum(active.cash_expenses);
  const refunds = safeNum(active.refund_sales);

  
  const expectedCash = initial + cashSales - expenses - refunds;
  const diff = countedCash - expectedCash;

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const margin = 40;
  let y = 48;

  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CORTE DE CAJA", margin, y);

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Corte #${active.id}`, margin, y);
  y += 14;
  doc.text(`Apertura: ${active.open_date}`, margin, y);
  y += 14;
  doc.text(`Cajero: ${active.name}`, margin, y);
  y += 14;
  doc.text(`Movimientos: ${active.transactions}`, margin, y);

 
  y += 16;
  doc.setDrawColor(200);
  doc.line(margin, y, 555, y);


  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Resumen", margin, y);

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const rows: Array<[string, string]> = [
    ["Fondo inicial", money(initial)],
    ["Ventas efectivo", money(cashSales)],
    ["Ventas tarjeta", money(cardSales)],
    ["Ventas transferencia", money(transferSales)],
    ["Egresos efectivo", `- ${money(expenses)}`],
    ["Devoluciones", `- ${money(refunds)}`],
  ];

  
  const col1 = margin;
  const col2 = 370;
  const rowH = 18;

  rows.forEach(([k, v]) => {
    doc.text(k, col1, y);
    doc.text(v, col2, y, { align: "right" });
    y += rowH;
  });

  
  y += 8;
  doc.setDrawColor(200);
  doc.line(margin, y, 555, y);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.text("Efectivo esperado en caja", col1, y);
  doc.text(money(expectedCash), col2, y, { align: "right" });

  y += 16;
  doc.text("Efectivo contado", col1, y);
  doc.text(money(countedCash), col2, y, { align: "right" });

  y += 16;
  doc.text("Diferencia", col1, y);
  doc.text(money(diff), col2, y, { align: "right" });

  
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.text("Notas", margin, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  const noteText = (note || "").trim() || "—";
  const wrapped = doc.splitTextToSize(noteText, 515);
  doc.text(wrapped, margin, y);

  
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Generado: ${new Date().toLocaleString("es-MX")}`,
    margin,
    805
  );

 
  const filename = `corte_${active.id}_${active.open_date.replace(/[:\s]/g, "-")}.pdf`;
  doc.save(filename);
}