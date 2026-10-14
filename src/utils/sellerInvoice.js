import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND = [250, 102, 28];
const MUTED = [107, 96, 88];
const DARK = [26, 36, 32];

const money = (value, currency = 'INR') => {
  const num = Number(value || 0);
  const prefix = currency === 'INR' ? 'Rs. ' : `${currency} `;
  return prefix + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const taxLines = (item, currency) => {
  const parts = [];
  if (item.cgst_amount) parts.push(`CGST ${item.cgst_rate}%: ${money(item.cgst_amount, currency)}`);
  if (item.sgst_amount) parts.push(`SGST ${item.sgst_rate}%: ${money(item.sgst_amount, currency)}`);
  if (item.igst_amount) parts.push(`IGST ${item.igst_rate}%: ${money(item.igst_amount, currency)}`);
  if (item.vat_amount) parts.push(`VAT ${item.vat_rate}%: ${money(item.vat_amount, currency)}`);
  return parts.length ? parts.join('\n') : '-';
};

/**
 * Build and download a tax invoice PDF for a seller's vendor order.
 * @param {object} order VendorOrderSerializer payload
 * @param {object} [vendor] optional vendor profile (store_name, gstin...)
 */
export function downloadSellerInvoice(order, vendor = {}) {
  const currency = order.currency || 'INR';
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const M = 40;

  // Header band
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('TAX INVOICE', M, 48);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('MytriKart Marketplace', pageW - M, 36, { align: 'right' });
  doc.text(`Invoice #INV-ORD-${order.id}`, pageW - M, 52, { align: 'right' });

  // Meta
  let y = 110;
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  const meta = [
    ['Order No.', order.order_number || `ORD-${order.id}`],
    ['Vendor Order', `#ORD-${order.id}`],
    ['Order Date', fmtDate(order.order_created_at || order.created_at)],
    ['Payment', (order.payment_status || 'pending').toUpperCase()],
    ['Status', (order.status || 'pending').toUpperCase()],
  ];
  meta.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...MUTED);
    doc.text(k, pageW - M - 200, y + i * 14);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
    doc.text(String(v), pageW - M, y + i * 14, { align: 'right' });
  });

  // Sold by
  const storeName = vendor.store_name || order.vendor_store_name || 'Merchant Store';
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...BRAND); doc.setFontSize(9);
  doc.text('SOLD BY', M, y);
  doc.setTextColor(...DARK); doc.setFontSize(11);
  doc.text(storeName, M, y + 15);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
  if (vendor.gstin) doc.text(`GSTIN: ${vendor.gstin}`, M, y + 29);

  // Bill / Ship to
  y += 85;
  const addr = order.shipping_address || {};
  const cust = order.customer || {};
  const addrLines = [
    addr.recipient_name,
    addr.address_line1,
    addr.address_line2,
    [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
    addr.country,
    addr.recipient_phone ? `Phone: ${addr.recipient_phone}` : null,
  ].filter(Boolean);

  doc.setFont('helvetica', 'bold'); doc.setTextColor(...BRAND); doc.setFontSize(9);
  doc.text('BILLED TO', M, y);
  doc.text('SHIP TO', pageW / 2, y);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK); doc.setFontSize(10);
  [cust.full_name || cust.username || 'Customer', cust.username ? `@${cust.username}` : null, cust.email]
    .filter(Boolean).forEach((l, i) => doc.text(l, M, y + 15 + i * 13));
  addrLines.forEach((l, i) => doc.text(l, pageW / 2, y + 15 + i * 13));

  // Items table
  y += 30 + Math.max(3, addrLines.length) * 13;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['#', 'Item', 'SKU / HSN', 'Qty', 'Unit Price', 'Taxable', 'Taxes', 'Total']],
    body: (order.items || []).map((it, i) => [
      i + 1,
      it.product_name_snapshot,
      `${it.sku_snapshot || '-'}${it.hsn_code_snapshot ? `\nHSN ${it.hsn_code_snapshot}` : ''}`,
      it.quantity,
      money(it.unit_price, currency),
      money(it.taxable_value, currency),
      taxLines(it, currency),
      money(it.line_total, currency),
    ]),
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 5, textColor: DARK, lineColor: [234, 227, 220], lineWidth: 0.5 },
    alternateRowStyles: { fillColor: [255, 248, 242] },
    columnStyles: { 0: { cellWidth: 20 }, 3: { halign: 'center' }, 7: { halign: 'right', fontStyle: 'bold' } },
  });

  // Totals
  y = doc.lastAutoTable.finalY + 20;
  const totals = [
    ['Subtotal', order.subtotal],
    ['Tax Total', order.tax_total],
    ['Shipping Charges', order.shipping_total],
  ];
  const tx = pageW - M - 220;
  doc.setFontSize(10);
  totals.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED);
    doc.text(k, tx, y + i * 16);
    doc.setTextColor(...DARK);
    doc.text(money(v, currency), pageW - M, y + i * 16, { align: 'right' });
  });
  y += totals.length * 16 + 4;
  doc.setFillColor(...BRAND);
  doc.roundedRect(tx - 10, y - 4, 230, 28, 4, 4, 'F');
  doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.setFontSize(12);
  doc.text('Grand Total', tx, y + 14);
  doc.text(money(order.grand_total, currency), pageW - M, y + 14, { align: 'right' });

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text('This is a computer-generated invoice and does not require a signature.', pageW / 2, pageH - 30, { align: 'center' });

  doc.save(`Invoice_ORD-${order.id}.pdf`);
}
