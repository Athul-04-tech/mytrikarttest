import React from 'react';
import {
  CheckCircle2,
  Truck,
  MapPin,
  Download,
  Package,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  formatVerbatimMoney,
  isNonZeroMoneyString,
  ORDER_CHARGE_KIND_LABELS,
} from '../../utils/orderPricingUtils';
import {
  formatShipmentStatusLabel,
  getShipmentStatusBadgeClass,
  formatDateTime,
  formatFulfilmentStageLabel,
} from '../../utils/warehouseUtils';

export default function OrderSuccessConfirmation({ order, onBackToHome }) {
  const toast = useToast();

  const orderIdDisplay = order?.order_number || order?.orderId || order?.id;
  const currency = order?.currency || 'INR';
  const customerCharges = Array.isArray(order?.customer_charges)
    ? order.customer_charges
    : [];

  const handleDownloadInvoice = () => {
    toast.info(
      'Tax Invoice',
      `Invoice for ${orderIdDisplay} will be available once payment is confirmed.`
    );
  };

  return (
    <div
      data-testid="order-success-confirmation"
      className="max-w-3xl mx-auto space-y-6 py-6 animate-reveal text-xs"
    >
      {/* Top Success Banner */}
      <div className="bg-gradient-to-br from-[#FA661C] via-[#16523F] to-[#0A2A1F] text-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#FF811A]/50 shadow-xl text-center space-y-3 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-[#FF811A] text-[#FA661C] flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-[#FF811A] text-[#FA661C] px-2.5 py-0.5 rounded-full">
            ORDER CONFIRMED
          </span>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] mt-2">
            Thank You for Your Order!
          </h1>
          <p className="text-xs text-[#FFFFFF]/80 mt-1 max-w-md mx-auto">
            Your order has been created.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <div
            data-testid="confirmed-order-number"
            className="px-3 py-1.5 rounded-xl bg-[#0A2A1F]/80 border border-[#FF811A]/40 font-mono text-xs font-bold text-[#FF811A]"
          >
            Order ID: {orderIdDisplay}
          </div>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-white text-[#FA661C] font-bold text-xs btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#FA661C]" />
            <span>Invoice</span>
          </button>
        </div>
      </div>

      {/* Items & Server Charges Summary */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
          Ordered Items ({order?.items?.length || 0})
        </h3>

        <div className="space-y-3 divide-y divide-[#EAE3DC]/40">
          {(order?.items || []).map((item, idx) => (
            <div
              key={item.id ?? idx}
              data-testid={`confirmed-order-item-${item.id ?? idx}`}
              className="pt-3 first:pt-0 flex items-center justify-between gap-3"
            >
              <div className="truncate">
                <h4 className="font-bold text-xs text-[#FA661C] truncate max-w-[320px]">
                  {item.product_name_snapshot || item.name}
                </h4>
                <span className="text-[10px] text-[#6B6058]">
                  Qty: {item.quantity}
                  {item.sku_snapshot ? ` • SKU: ${item.sku_snapshot}` : ''}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="font-['Outfit'] font-mono font-black text-xs text-[#FA661C]">
                  {formatVerbatimMoney(
                    currency,
                    item.line_total ?? item.unit_price ?? item.price
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Server Totals & Customer Charges Breakdown */}
        <div
          data-testid="confirmed-order-charges-panel"
          className="pt-4 border-t border-[#EAE3DC] space-y-2 text-xs text-[#6B6058]"
        >
          {order?.subtotal !== undefined && (
            <div className="flex justify-between">
              <span>Item subtotal</span>
              <span
                data-testid="confirmed-order-subtotal"
                className="font-mono font-bold text-[#1A2420]"
              >
                {formatVerbatimMoney(currency, order.subtotal)}
              </span>
            </div>
          )}

          {order?.tax_total !== undefined && (
            <div className="flex justify-between">
              <span>Item tax</span>
              <span
                data-testid="confirmed-order-tax-total"
                className="font-mono font-bold text-[#1A2420]"
              >
                {formatVerbatimMoney(currency, order.tax_total)}
              </span>
            </div>
          )}

          {isNonZeroMoneyString(order?.discount_total) && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span
                data-testid="confirmed-order-discount-total"
                className="font-mono font-bold"
              >
                - {formatVerbatimMoney(currency, order.discount_total)}
              </span>
            </div>
          )}

          {/* Customer charges lines (delivery and per-vendor packaging) */}
          {customerCharges.length > 0 ? (
            <div
              data-testid="confirmed-order-customer-charges"
              className="space-y-1.5 pt-1"
            >
              {customerCharges.map((charge, cIdx) => (
                <div
                  key={charge.id ?? cIdx}
                  data-testid={`confirmed-order-charge-${charge.kind}-${
                    charge.id ?? cIdx
                  }`}
                  className="flex justify-between"
                >
                  <span>
                    {ORDER_CHARGE_KIND_LABELS[charge.kind] || charge.kind}
                    {charge.vendor_order
                      ? ` (Parcel #${charge.vendor_order})`
                      : ''}
                    {charge.rule_version ? ` (v${charge.rule_version})` : ''}
                  </span>
                  <span className="font-mono font-bold text-[#1A2420]">
                    {formatVerbatimMoney(
                      charge.currency || currency,
                      charge.amount
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              {isNonZeroMoneyString(order?.delivery_charge) && (
                <div className="flex justify-between">
                  <span>Delivery charge</span>
                  <span
                    data-testid="confirmed-order-delivery-charge"
                    className="font-mono font-bold text-[#1A2420]"
                  >
                    {formatVerbatimMoney(currency, order.delivery_charge)}
                  </span>
                </div>
              )}
              {isNonZeroMoneyString(order?.packaging_fee_total) && (
                <div className="flex justify-between">
                  <span>Packaging fee</span>
                  <span
                    data-testid="confirmed-order-packaging-fee"
                    className="font-mono font-bold text-[#1A2420]"
                  >
                    {formatVerbatimMoney(currency, order.packaging_fee_total)}
                  </span>
                </div>
              )}
            </>
          )}

          {isNonZeroMoneyString(order?.fee_tax_total) && (
            <div className="flex justify-between">
              <span>Fee tax</span>
              <span
                data-testid="confirmed-order-fee-tax-total"
                className="font-mono font-bold text-[#1A2420]"
              >
                {formatVerbatimMoney(currency, order.fee_tax_total)}
              </span>
            </div>
          )}
        </div>

        {/* Final Grand Total */}
        <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-between text-sm font-bold text-[#FA661C]">
          <span>Order Total</span>
          <span
            data-testid="confirmed-order-grand-total"
            className="font-['Outfit'] font-mono font-black text-lg text-[#FA661C]"
          >
            {formatVerbatimMoney(
              currency,
              order?.grand_total ?? order?.total ?? '0.00'
            )}
          </span>
        </div>

        {/* Shipments tracking if present on order */}
        {Array.isArray(order?.shipments) && order.shipments.length > 0 && (
          <div
            data-testid="confirmed-order-shipments"
            className="pt-3 border-t border-[#EAE3DC] space-y-2"
          >
            <span className="font-bold text-[#1A2420] block">
              Shipments
            </span>
            {order.shipments.map((shp, sIdx) => (
              <div
                key={shp.vendor_order_id ?? sIdx}
                className="p-2.5 rounded-xl bg-[#FFF8F2] border border-[#EAE3DC] flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getShipmentStatusBadgeClass(
                      shp.status
                    )}`}
                  >
                    {formatShipmentStatusLabel(shp.status)}
                  </span>
                  {shp.courier_name && <span>Courier: {shp.courier_name}</span>}
                  {shp.tracking_number && (
                    <span className="font-mono font-bold">
                      Tracking: {shp.tracking_number}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#6B6058] space-x-2">
                  {shp.shipped_at && (
                    <span>Shipped: {formatDateTime(shp.shipped_at)}</span>
                  )}
                  {shp.delivered_at && (
                    <span>Delivered: {formatDateTime(shp.delivered_at)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fulfilment stages if present on order */}
        {Array.isArray(order?.fulfilment_stages) &&
          order.fulfilment_stages.length > 0 && (
            <div
              data-testid="confirmed-order-fulfilment-stages"
              className="pt-3 border-t border-[#EAE3DC] space-y-2"
            >
              <span className="font-bold text-[#1A2420] block">
                Parcel Fulfilment Status
              </span>
              {order.fulfilment_stages.map((st, idx) => (
                <div
                  key={st.vendor_order_id ?? idx}
                  data-testid={`confirmed-order-stage-${
                    st.vendor_order_id ?? idx
                  }`}
                  className="p-2.5 rounded-xl bg-[#FFF8F2] border border-[#EAE3DC] flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <span className="font-mono font-bold text-[#1A2420]">
                    Parcel #{st.vendor_order_id}
                  </span>
                  <span className="font-bold text-[#FA661C]">
                    {formatFulfilmentStageLabel(st.stage)}
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBackToHome}
          className="px-6 py-3 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] font-bold text-xs rounded-2xl btn-interactive shadow-md cursor-pointer"
        >
          Return to Marketplace Home
        </button>
      </div>
    </div>
  );
}
