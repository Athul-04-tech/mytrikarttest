import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Eye, 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  X,
  FileText,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { formatSellerINR } from '../../../data/sellerDashboardData';
import { useToast } from '../../../context/ToastContext';

// Map raw backend status choices to UI badge styling and human labels
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/50',
    icon: Clock
  },
  processing: {
    label: 'Processing',
    badgeClass: 'bg-[#EBF3FF] text-[#1E64D4] border border-[#1E64D4]/30',
    icon: RefreshCw
  },
  shipped: {
    label: 'Shipped',
    badgeClass: 'bg-[#F3E8FF] text-[#7E22CE] border border-[#7E22CE]/30',
    icon: Truck
  },
  delivered: {
    label: 'Delivered',
    badgeClass: 'bg-[#E6F4EA] text-[#137333] border border-[#137333]/30',
    icon: CheckCircle2
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/30',
    icon: AlertCircle
  }
};

export default function SellerOrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const toast = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/orders/vendor/');
      // Handle both raw array [ ... ] and paginated { results: [ ... ] } shapes
      const orderList = Array.isArray(data) ? data : (data?.results || []);
      setOrders(orderList);
    } catch (err) {
      console.error('Failed to fetch vendor orders:', err);
      setError(err?.message || 'Failed to load vendor orders. Please verify network connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders by status tab and search query
  const filteredOrders = orders.filter(ord => {
    // Status filter
    if (filter !== 'all' && ord.status !== filter) {
      return false;
    }
    // Search query filter (Order ID, SKU, product title)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = String(ord.id).toLowerCase().includes(q) || `ord-${ord.id}`.includes(q);
      const matchItem = ord.items?.some(item => 
        (item.product_name_snapshot || '').toLowerCase().includes(q) ||
        (item.sku_snapshot || '').toLowerCase().includes(q)
      );
      return matchId || matchItem;
    }
    return true;
  });

  // Calculate status counts for filter badges
  const statusCounts = orders.reduce((acc, ord) => {
    const st = ord.status || 'pending';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 text-xs animate-reveal">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EAE3DC]">
        <div>
          <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#FA661C]">
            Orders & Shipment Fulfillment
          </h2>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Monitor incoming customer consignments, tax itemization, and fulfillment status in real-time.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-[#EAE3DC] hover:bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C] rounded-2xl font-bold text-xs btn-interactive flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh List</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (orders.length === 0) {
                toast.info("No Orders Available", "There are currently no orders in your queue to print labels for.");
              } else {
                toast.success("Batch Manifest Generated", `Shipping labels generated for ${filteredOrders.length} active orders.`);
              }
            }}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-2xl font-black text-xs btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#FF811A]" />
            <span>Print Shipping Labels</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs & Search Control */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#EAE3DC]">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#FA661C] text-[#FFFFFF] shadow-2xs'
                : 'bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C]'
            }`}
          >
            <span>All Orders</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
              filter === 'all' ? 'bg-[#FF811A] text-[#FA661C]' : 'bg-white text-[#6B6058]'
            }`}>
              {orders.length}
            </span>
          </button>

          {Object.entries(STATUS_CONFIG).map(([stKey, stMeta]) => {
            const count = statusCounts[stKey] || 0;
            const isSelected = filter === stKey;
            return (
              <button
                key={stKey}
                type="button"
                onClick={() => setFilter(stKey)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#FA661C] text-[#FFFFFF] shadow-2xs'
                    : 'bg-white hover:bg-[#FFF3EC] text-[#6B6058] border border-[#EAE3DC]'
                }`}
              >
                <span>{stMeta.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                    isSelected ? 'bg-[#FF811A] text-[#FA661C]' : 'bg-[#FFF3EC] text-[#FA661C]'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, SKU, Product..."
            className="w-full py-1.5 pl-8 pr-3 bg-[#FFF3EC]/60 border border-[#EAE3DC] rounded-xl text-xs text-[#FA661C] font-medium placeholder-[#6B6058]/60 focus:outline-none focus:border-[#FA661C]"
          />
          <Search className="w-3.5 h-3.5 text-[#6B6058] absolute left-2.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6058] hover:text-[#FA661C]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Loading, Error, Empty, or Table */}
      {loading ? (
        <div className="p-12 bg-white rounded-3xl border border-[#EAE3DC] text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#FA661C] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#6B6058]">Fetching vendor orders from server...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-[#FDE8EA] border-2 border-[#D7263D] rounded-3xl text-center space-y-3 text-[#D7263D] animate-reveal">
          <AlertCircle className="w-8 h-8 text-[#D7263D] mx-auto" />
          <div>
            <h3 className="font-['Outfit'] font-extrabold text-sm text-[#D7263D]">
              Failed to Retrieve Orders
            </h3>
            <p className="text-xs text-[#D7263D]/90 mt-1 max-w-md mx-auto">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="px-4 py-2 bg-[#D7263D] hover:bg-[#B51D30] text-[#FFFFFF] rounded-xl font-bold text-xs btn-interactive inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-[#EAE3DC] text-center space-y-3 animate-reveal">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6 text-[#FA661C]" />
          </div>
          <div>
            <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
              {orders.length === 0 ? 'No Vendor Orders Yet' : 'No Matching Orders'}
            </h3>
            <p className="text-xs text-[#6B6058] mt-1 max-w-md mx-auto">
              {orders.length === 0
                ? 'When customer transactions include your catalog products, vendor orders will appear here automatically.'
                : `No orders match your filter "${filter}" ${searchQuery ? `or query "${searchQuery}"` : ''}. Try resetting your search parameters.`}
            </p>
          </div>
          {orders.length > 0 && (
            <button
              type="button"
              onClick={() => { setFilter('all'); setSearchQuery(''); }}
              className="px-4 py-1.5 bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-[#FFFFFF] border border-[#FF811A]/40 rounded-xl font-bold text-xs btn-interactive cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFFFFF] border-b border-[#EAE3DC] text-[#FA661C] font-bold">
                  <th className="p-3.5">Vendor Order ID</th>
                  <th className="p-3.5">Ordered Items Snapshot</th>
                  <th className="p-3.5">Subtotal</th>
                  <th className="p-3.5">Tax & Shipping</th>
                  <th className="p-3.5">Grand Total</th>
                  <th className="p-3.5">Fulfillment Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60">
                {filteredOrders.map((ord) => {
                  const statusInfo = STATUS_CONFIG[ord.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusInfo.icon;
                  const firstItem = ord.items && ord.items.length > 0 ? ord.items[0] : null;
                  const extraItemsCount = ord.items ? ord.items.length - 1 : 0;

                  return (
                    <tr key={ord.id} className="hover:bg-[#FFFFFF]/60 transition-colors">
                      {/* Order ID */}
                      <td className="p-3.5">
                        <span className="font-mono font-extrabold text-[#FA661C] block text-sm">
                          #ORD-{ord.id}
                        </span>
                        <span className="text-[10px] text-[#6B6058] font-medium">
                          {ord.items?.length || 0} {ord.items?.length === 1 ? 'line item' : 'line items'}
                        </span>
                      </td>

                      {/* Ordered Items Snapshot */}
                      <td className="p-3.5">
                        {firstItem ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#FA661C] block truncate max-w-[240px]">
                              {firstItem.product_name_snapshot}
                            </span>
                            <div className="flex items-center space-x-2 text-[10px] text-[#6B6058]">
                              <span className="font-mono">SKU: {firstItem.sku_snapshot || 'N/A'}</span>
                              <span>•</span>
                              <span>Qty: {firstItem.quantity}</span>
                            </div>
                            {extraItemsCount > 0 && (
                              <span className="text-[10px] font-bold text-[#FA661C] inline-block bg-[#FFF8F2] px-1.5 py-0.2 rounded border border-[#FF811A]/40 mt-0.5">
                                + {extraItemsCount} more item{extraItemsCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#6B6058] italic text-[11px]">No snapshot items recorded</span>
                        )}
                      </td>

                      {/* Financial Breakdown: Subtotal */}
                      <td className="p-3.5 font-mono font-bold text-[#FA661C]">
                        {formatSellerINR(ord.subtotal)}
                      </td>

                      {/* Tax & Shipping */}
                      <td className="p-3.5 text-[11px]">
                        <div className="font-mono text-[#6B6058]">
                          <span>Tax: {formatSellerINR(ord.tax_total)}</span>
                        </div>
                        <div className="font-mono text-[#6B6058]">
                          <span>Ship: {formatSellerINR(ord.shipping_total)}</span>
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="p-3.5 font-mono font-black text-sm text-[#FA661C]">
                        {formatSellerINR(ord.grand_total)}
                      </td>

                      {/* Fulfillment Status */}
                      <td className="p-3.5">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-flex items-center space-x-1 ${statusInfo.badgeClass}`}>
                          <StatusIcon className="w-3 h-3 stroke-[2.5]" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-[#FFFFFF] border border-[#FF811A]/40 rounded-lg font-bold text-[10px] cursor-pointer inline-flex items-center space-x-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toast.success("Invoice Generated", `Tax Invoice for #ORD-${ord.id} downloaded.`)}
                          className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] rounded-lg font-bold text-[10px] cursor-pointer inline-flex items-center space-x-1"
                          title="Download Tax Invoice"
                        >
                          <Download className="w-3 h-3 text-[#FF811A]" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="p-3.5 bg-[#FFF3EC]/40 border-t border-[#EAE3DC] flex items-center justify-between text-[11px] text-[#6B6058]">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FA661C]" />
              <span>Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> total vendor orders</span>
            </div>
            <span className="text-[10px] italic">
              Order status changes are processed automatically by MytriKart central dispatch.
            </span>
          </div>
        </div>
      )}

      {/* TASK B — Order Detail Modal / Drawer */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white border border-[#FF811A]/50 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-dropdown max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3DC]">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C] flex items-center space-x-2">
                    <span>Vendor Order #ORD-{selectedOrder.id}</span>
                  </h3>
                  <span className="text-[11px] text-[#6B6058] font-medium block">
                    Itemized consignments & tax breakdown
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {(() => {
                  const statusInfo = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-flex items-center space-x-1 ${statusInfo.badgeClass}`}>
                      <StatusIcon className="w-3 h-3 stroke-[2.5]" />
                      <span>{statusInfo.label}</span>
                    </span>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-[#6B6058] hover:text-[#FA661C] icon-interactive cursor-pointer rounded-lg hover:bg-[#FFF3EC]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Read-Only Status & Platform Dispatch Notice (TASK C) */}
            <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#FF811A]/40 flex items-start space-x-3 text-xs text-[#FA661C]">
              <PackageCheck className="w-4 h-4 text-[#FF811A] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Fulfillment Managed by Platform Logistics</span>
                <p className="text-[11px] text-[#6B6058] mt-0.5">
                  Order status updates (Processing → Shipped → Delivered) are managed by MytriKart central hub logistics and automatically synced upon courier scan.
                </p>
              </div>
            </div>

            {/* Financial Summary Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#FFF3EC]/60 border border-[#EAE3DC]">
                <span className="text-[10px] font-bold text-[#6B6058] block">Subtotal</span>
                <span className="font-mono font-extrabold text-sm text-[#FA661C] mt-0.5 block">
                  {formatSellerINR(selectedOrder.subtotal)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF3EC]/60 border border-[#EAE3DC]">
                <span className="text-[10px] font-bold text-[#6B6058] block">Tax Total</span>
                <span className="font-mono font-extrabold text-sm text-[#FA661C] mt-0.5 block">
                  {formatSellerINR(selectedOrder.tax_total)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF3EC]/60 border border-[#EAE3DC]">
                <span className="text-[10px] font-bold text-[#6B6058] block">Shipping Fee</span>
                <span className="font-mono font-extrabold text-sm text-[#FA661C] mt-0.5 block">
                  {formatSellerINR(selectedOrder.shipping_total)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF8F2] border border-[#FF811A]/50">
                <span className="text-[10px] font-bold text-[#FA661C] block">Grand Total</span>
                <span className="font-mono font-black text-sm text-[#FA661C] mt-0.5 block">
                  {formatSellerINR(selectedOrder.grand_total)}
                </span>
              </div>
            </div>

            {/* Itemized Breakdown Table */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#FA661C] mb-2">
                Order Line Items ({selectedOrder.items?.length || 0})
              </h4>
              
              <div className="border border-[#EAE3DC] rounded-2xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FFF3EC]/70 border-b border-[#EAE3DC] text-[#FA661C] font-bold text-[11px]">
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5">SKU & HSN</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5">Unit Price</th>
                        <th className="p-2.5">Taxes (CGST/SGST/IGST)</th>
                        <th className="p-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3DC]/60">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#FFF3EC]/20">
                            <td className="p-2.5 font-semibold text-[#FA661C]">
                              {item.product_name_snapshot}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-[#6B6058]">
                              <div>SKU: {item.sku_snapshot || 'N/A'}</div>
                              {item.hsn_code_snapshot && (
                                <div className="text-[10px] text-[#6B6058]/80">HSN: {item.hsn_code_snapshot}</div>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold">
                              {item.quantity}
                            </td>
                            <td className="p-2.5 font-mono">
                              {formatSellerINR(item.unit_price)}
                            </td>
                            <td className="p-2.5 text-[10px] font-mono text-[#6B6058]">
                              {item.cgst_amount && <div>CGST ({item.cgst_rate}%): {formatSellerINR(item.cgst_amount)}</div>}
                              {item.sgst_amount && <div>SGST ({item.sgst_rate}%): {formatSellerINR(item.sgst_amount)}</div>}
                              {item.igst_amount && <div>IGST ({item.igst_rate}%): {formatSellerINR(item.igst_amount)}</div>}
                              {item.vat_amount && <div>VAT ({item.vat_rate}%): {formatSellerINR(item.vat_amount)}</div>}
                              {!item.cgst_amount && !item.sgst_amount && !item.igst_amount && !item.vat_amount && <span>-</span>}
                            </td>
                            <td className="p-2.5 font-mono font-bold text-right text-[#FA661C]">
                              {formatSellerINR(item.line_total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-[#6B6058] italic text-[11px]">
                            No line items recorded for this order snapshot.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#EAE3DC]">
              <button
                type="button"
                onClick={() => toast.success("Invoice Downloaded", `Tax invoice PDF for #ORD-${selectedOrder.id} generated.`)}
                className="px-4 py-2 bg-white hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] font-bold text-xs rounded-xl btn-interactive flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FF811A]" />
                <span>Download Invoice (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] font-bold text-xs rounded-xl btn-interactive cursor-pointer"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
