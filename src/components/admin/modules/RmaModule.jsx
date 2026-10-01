import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  DollarSign,
  Eye,
  X,
  FileText,
  Clock,
  PackageCheck,
  Ban,
  Check
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

export default function RmaModule() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [selectedRma, setSelectedRma] = useState(null);

  const [disputeModalRma, setDisputeModalRma] = useState(null);
  const [disputeDecision, setDisputeDecision] = useState('favor_customer');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState(null);

  const [refundModalRma, setRefundModalRma] = useState(null);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState(null);

  const toast = useToast();

  const fetchReturns = async (targetPage = page, targetStatus = statusFilter, targetPageSize = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/rma/admin/rma/?page=${targetPage}&page_size=${targetPageSize}`;
      if (targetStatus) {
        url += `&status=${encodeURIComponent(targetStatus)}`;
      }

      const data = await apiRequest(url);

      // Confirm backend contract: paginated envelope ({count, next, previous, results})
      const totalCount = typeof data.count === 'number' ? data.count : (Array.isArray(data) ? data.length : 0);
      const results = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);

      setReturns(results);
      setCount(totalCount);
      setHasNext(Boolean(data.next));
      setHasPrevious(Boolean(data.previous));
      setPage(targetPage);
    } catch (err) {
      console.error("Failed to fetch admin RMA return requests:", err);
      const msg = err.data?.detail
        ? (Array.isArray(err.data.detail) ? err.data.detail.join(' ') : err.data.detail)
        : (err.message || "Failed to load admin RMA return requests.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns(1, statusFilter, pageSize);
  }, [statusFilter, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchReturns(newPage, statusFilter, pageSize);
    }
  };

  const totalPages = Math.ceil(count / pageSize) || 1;

  // 1. Dispute Resolution Action Handler
  const handleResolveDisputeSubmit = async (e) => {
    e?.preventDefault();
    if (!disputeModalRma) return;

    setDisputeSubmitting(true);
    setDisputeError(null);

    try {
      // Endpoint: POST /api/rma/admin/rma/<id>/resolve-dispute/
      // Body expected by DisputeCaseSerializer/View: { decision: "favor_customer" | "favor_vendor", notes: "..." }
      const res = await apiRequest(`/api/rma/admin/rma/${disputeModalRma.id}/resolve-dispute/`, {
        method: 'POST',
        body: JSON.stringify({
          decision: disputeDecision,
          notes: disputeNotes,
        }),
      });

      toast?.success(
        "Dispute Resolved",
        `RMA #${disputeModalRma.id} dispute resolved in ${disputeDecision === 'favor_customer' ? 'Customer' : 'Vendor'} favor.`
      );

      setDisputeModalRma(null);
      setDisputeNotes('');
      if (selectedRma && selectedRma.id === disputeModalRma.id) {
        setSelectedRma(null);
      }
      fetchReturns(page, statusFilter, pageSize);
    } catch (err) {
      console.error("Error resolving dispute:", err);
      const backendErr = err.data?.detail
        ? (Array.isArray(err.data.detail) ? err.data.detail.join(' ') : err.data.detail)
        : (err.message || "Failed to resolve dispute.");
      setDisputeError(backendErr);
    } finally {
      setDisputeSubmitting(false);
    }
  };

  // 2. Refund Processing Action Handler
  const handleProcessRefundSubmit = async () => {
    if (!refundModalRma) return;

    setRefundSubmitting(true);
    setRefundError(null);

    try {
      // Endpoint: POST /api/rma/admin/rma/<id>/refund/
      // Body expected: {}
      const res = await apiRequest(`/api/rma/admin/rma/${refundModalRma.id}/refund/`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      toast?.success(
        "Refund Processed",
        `Refund for RMA #${refundModalRma.id} processed successfully.`
      );

      setRefundModalRma(null);
      if (selectedRma && selectedRma.id === refundModalRma.id) {
        setSelectedRma(null);
      }
      fetchReturns(page, statusFilter, pageSize);
    } catch (err) {
      console.error("Error processing refund:", err);
      const backendErr = err.data?.detail
        ? (Array.isArray(err.data.detail) ? err.data.detail.join(' ') : err.data.detail)
        : (err.message || "Failed to process refund.");
      setRefundError(backendErr);
    } finally {
      setRefundSubmitting(false);
    }
  };

  // Status Badge Formatting Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'disputed':
        return (
          <span className="bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/30 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-[#D97706]" />
            <span>Disputed</span>
          </span>
        );
      case 'inspection':
        return (
          <span className="bg-[#EFF6FF] text-[#1D4ED8] border border-[#3B82F6]/30 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center space-x-1">
            <Clock className="w-3 h-3 text-[#2563EB]" />
            <span>Inspection</span>
          </span>
        );
      case 'refund_processed':
        return (
          <span className="bg-[#D1FAE5] text-[#047857] border border-[#10B981]/30 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center space-x-1">
            <DollarSign className="w-3 h-3 text-[#059669]" />
            <span>Refund Processed</span>
          </span>
        );
      case 'approved':
        return (
          <span className="bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-[#0D9488]" />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
      case 'closed':
        return (
          <span className="bg-[#F1F5F9] text-[#475569] border border-[#94A3B8]/30 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center space-x-1">
            <Ban className="w-3 h-3 text-[#64748B]" />
            <span>{status === 'closed' ? 'Closed' : 'Rejected'}</span>
          </span>
        );
      default:
        return (
          <span className="bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/30 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center space-x-1">
            <PackageCheck className="w-3 h-3 text-[#FA661C]" />
            <span>{status || 'Submitted'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
              <RotateCcw className="w-5 h-5" />
            </span>
            <h2 className="font-['Outfit'] font-black text-2xl text-[#FA661C]">
              Returns, Refunds &amp; RMA Central
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-1">
            Paginated Reverse Logistics Queue: Process disputes, execute customer refunds, and manage merchant RMAs.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <span className="text-xs font-bold text-[#FA661C] bg-[#FFF3EC] border border-[#FA661C]/30 px-3 py-1.5 rounded-xl">
            {count} Total Request{count !== 1 ? 's' : ''}
          </span>

          <button
            type="button"
            onClick={() => fetchReturns(page, statusFilter, pageSize)}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-[#FFF8F2] border border-[#EAE3DC] text-[#FA661C] btn-interactive cursor-pointer disabled:opacity-50"
            title="Refresh RMA Requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filters & Status Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EAE3DC] shadow-xs">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: '', label: 'All Statuses' },
            { id: 'disputed', label: 'Disputed' },
            { id: 'inspection', label: 'Inspection' },
            { id: 'refund_processed', label: 'Refunded' },
            { id: 'approved', label: 'Approved' },
            { id: 'closed', label: 'Closed' }
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#FA661C] text-white shadow-xs'
                    : 'bg-[#FFF8F2] text-[#6B6058] hover:bg-[#FFF3EC] hover:text-[#FA661C]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center space-x-2 text-xs text-[#6B6058] self-end md:self-auto">
          <span>Items per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl px-2 py-1 text-xs font-bold text-[#FA661C] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* 3. Global Error Banner */}
      {error && (
        <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl flex items-start space-x-3 text-xs text-[#D7263D]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Error Loading RMA Queue</div>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 4. Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-10 text-center animate-pulse text-xs text-[#6B6058] space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#FA661C] mx-auto" />
          <div>Fetching paginated RMA requests from backend API...</div>
        </div>
      )}

      {/* 5. Empty State */}
      {!loading && !error && returns.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-[#EAE3DC] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[#52B788]" />
          </div>
          <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
            No Return Requests Found
          </h3>
          <p className="text-xs text-[#6B6058] max-w-md mx-auto">
            {statusFilter
              ? `There are currently no RMA return requests matching the filter "${statusFilter}".`
              : "No customer return requests or refund disputes are currently in the queue."}
          </p>
        </div>
      )}

      {/* 6. Real Paginated RMA Table */}
      {!loading && !error && returns.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">RMA ID &amp; Date</th>
                  <th className="p-3">Vendor Order ID</th>
                  <th className="p-3">Action &amp; Reason</th>
                  <th className="p-3">Eligibility</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                {returns.map((rma) => {
                  const createdDate = rma.created_at ? new Date(rma.created_at).toLocaleString() : 'N/A';
                  const isDisputed = rma.status === 'disputed';
                  const isInspection = rma.status === 'inspection';

                  return (
                    <tr key={rma.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#FA661C]">
                        #{rma.id}
                        <span className="text-[10px] text-[#6B6058] block font-sans font-normal mt-0.5">{createdDate}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-[#1A2420]">
                          Order #{rma.vendor_order || rma.vendor_order_id}
                        </span>
                        {rma.customer_refund && (
                          <span className="text-[10px] text-[#059669] block font-medium">
                            Refund Ref: {rma.customer_refund.gateway_reference || `#${rma.customer_refund.id}`}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-[#FA661C] block capitalize">{rma.requested_action || 'Return'}</span>
                        <span className="text-[10px] uppercase font-bold text-[#6B6058]">{rma.reason || 'N/A'}</span>
                        {rma.reason_notes && (
                          <span className="text-[10px] text-[#6B6058] block truncate max-w-xs italic">
                            "{rma.reason_notes}"
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {rma.is_eligible ? (
                          <span className="bg-[#D1FAE5] text-[#047857] border border-[#10B981]/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            Eligible
                          </span>
                        ) : (
                          <span className="bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            Ineligible
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(rma.status)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* View Details button */}
                          <button
                            type="button"
                            onClick={() => setSelectedRma(rma)}
                            className="p-1.5 rounded-lg bg-[#FFF8F2] hover:bg-[#FFF3EC] text-[#FA661C] border border-[#EAE3DC] text-xs font-bold btn-interactive flex items-center space-x-1 cursor-pointer"
                            title="View RMA Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {/* Dispute Action button */}
                          {isDisputed && (
                            <button
                              type="button"
                              onClick={() => {
                                setDisputeModalRma(rma);
                                setDisputeDecision('favor_customer');
                                setDisputeNotes('');
                                setDisputeError(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#B45309] border border-[#F59E0B]/40 text-xs font-extrabold btn-interactive flex items-center space-x-1 cursor-pointer"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
                              <span>Resolve Dispute</span>
                            </button>
                          )}

                          {/* Refund Action button */}
                          {isInspection && (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundModalRma(rma);
                                setRefundError(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#047857] border border-[#10B981]/40 text-xs font-extrabold btn-interactive flex items-center space-x-1 cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5 text-[#059669]" />
                              <span>Process Refund</span>
                            </button>
                          )}

                          {/* Action fallback for already resolved/refunded to test invalid repeat */}
                          {!isDisputed && !isInspection && (
                            <button
                              type="button"
                              onClick={() => {
                                if (rma.status === 'refund_processed' || rma.status === 'approved' || rma.status === 'closed') {
                                  // Open dispute or refund modal to test repeat action rejection
                                  if (rma.customer_refund || rma.status === 'refund_processed') {
                                    setRefundModalRma(rma);
                                    setRefundError(null);
                                  } else {
                                    setDisputeModalRma(rma);
                                    setDisputeDecision('favor_customer');
                                    setDisputeNotes('Attempting repeat resolution');
                                    setDisputeError(null);
                                  }
                                }
                              }}
                              className="p-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] border border-[#94A3B8]/30 text-[11px] font-bold cursor-pointer"
                              title="Test repeat action rejection"
                            >
                              <span>Act Again</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 7. Pagination Footer */}
          <div className="p-4 bg-[#FFF8F2]/60 border-t border-[#EAE3DC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-[#6B6058] font-medium">
              Showing page <span className="font-bold text-[#FA661C]">{page}</span> of{' '}
              <span className="font-bold text-[#FA661C]">{totalPages}</span> ({count} total records)
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={!hasPrevious || page <= 1 || loading}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] font-bold hover:bg-[#FFF3EC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1 shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (totalPages > 5 && page > 3) {
                    pNum = page - 3 + i;
                    if (pNum > totalPages) pNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => handlePageChange(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer ${
                        pNum === page
                          ? 'bg-[#FA661C] text-white shadow-xs'
                          : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:bg-[#FFF3EC]'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={!hasNext || page >= totalPages || loading}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] font-bold hover:bg-[#FFF3EC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1 shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Dispute Resolution Modal */}
      {disputeModalRma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#FFF3EC] p-5 border-b border-[#EAE3DC] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-[#FEF3C7] text-[#B45309]">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C]">
                    Resolve Dispute — RMA #{disputeModalRma.id}
                  </h3>
                  <p className="text-xs text-[#6B6058]">Vendor Order #{disputeModalRma.vendor_order}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDisputeModalRma(null);
                  setDisputeError(null);
                }}
                className="p-1.5 rounded-xl bg-white hover:bg-[#FFF8F2] text-[#6B6058] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleResolveDisputeSubmit} className="p-6 space-y-4">
              {/* Real Backend Error Display */}
              {disputeError && (
                <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl flex items-start space-x-3 text-xs text-[#D7263D] animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold">Backend Action Error</div>
                    <p className="mt-0.5">{disputeError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1A2420] block">
                  Dispute Decision <span className="text-[#D7263D]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setDisputeDecision('favor_customer')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      disputeDecision === 'favor_customer'
                        ? 'bg-[#FFF3EC] border-[#FA661C] text-[#FA661C] font-bold shadow-xs'
                        : 'bg-white border-[#EAE3DC] text-[#6B6058] hover:bg-[#FFF8F2]'
                    }`}
                  >
                    <div className="text-xs font-black uppercase">Favor Customer</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Approve Return Request</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDisputeDecision('favor_vendor')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      disputeDecision === 'favor_vendor'
                        ? 'bg-[#FFF3EC] border-[#FA661C] text-[#FA661C] font-bold shadow-xs'
                        : 'bg-white border-[#EAE3DC] text-[#6B6058] hover:bg-[#FFF8F2]'
                    }`}
                  >
                    <div className="text-xs font-black uppercase">Favor Vendor</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Close Return Request</div>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1A2420] block">
                  Resolution Notes / Audit Justification
                </label>
                <textarea
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                  placeholder="Provide rationale for customer or vendor resolution..."
                  rows={3}
                  className="w-full bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl p-3 text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setDisputeModalRma(null);
                    setDisputeError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-[#EAE3DC] text-xs font-bold text-[#6B6058] hover:bg-[#FFF8F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#FA661C] hover:bg-[#FF811A] text-white text-xs font-bold btn-interactive shadow-xs disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                >
                  {disputeSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit Resolution</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Refund Processing Modal */}
      {refundModalRma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#D1FAE5]/40 p-5 border-b border-[#EAE3DC] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-[#D1FAE5] text-[#047857]">
                  <DollarSign className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-['Outfit'] font-extrabold text-lg text-[#047857]">
                    Execute Customer Refund — RMA #{refundModalRma.id}
                  </h3>
                  <p className="text-xs text-[#6B6058]">Vendor Order #{refundModalRma.vendor_order}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRefundModalRma(null);
                  setRefundError(null);
                }}
                className="p-1.5 rounded-xl bg-white hover:bg-[#FFF8F2] text-[#6B6058] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Real Backend Error Display */}
              {refundError && (
                <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl flex items-start space-x-3 text-xs text-[#D7263D] animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold">Backend Refund Error</div>
                    <p className="mt-0.5">{refundError}</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-[#FFF8F2] rounded-2xl border border-[#EAE3DC] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B6058]">RMA Requested Action:</span>
                  <span className="font-bold text-[#FA661C] capitalize">{refundModalRma.requested_action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6058]">Return Reason:</span>
                  <span className="font-bold text-[#1A2420] capitalize">{refundModalRma.reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6058]">Current Status:</span>
                  <span className="font-bold text-[#1D4ED8] uppercase">{refundModalRma.status}</span>
                </div>
              </div>

              <p className="text-xs text-[#6B6058]">
                Processing this refund will invoke the backend service <code className="bg-[#FFF8F2] text-[#FA661C] px-1 py-0.5 rounded font-mono">process_refund()</code>, calculating exact ledger reversals and issuing gateway credits.
              </p>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setRefundModalRma(null);
                    setRefundError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-[#EAE3DC] text-xs font-bold text-[#6B6058] hover:bg-[#FFF8F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessRefundSubmit}
                  disabled={refundSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold btn-interactive shadow-xs disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                >
                  {refundSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Refund...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      <span>Execute Refund</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. Details Modal */}
      {selectedRma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#FFF3EC] p-5 border-b border-[#EAE3DC] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C]">
                  RMA Return Request #{selectedRma.id}
                </h3>
                <p className="text-xs text-[#6B6058]">
                  Created: {new Date(selectedRma.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRma(null)}
                className="p-1.5 rounded-xl bg-white hover:bg-[#FFF8F2] text-[#6B6058] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#FFF8F2] rounded-xl border border-[#EAE3DC]">
                  <span className="text-[10px] text-[#6B6058] uppercase font-bold block">Vendor Order ID</span>
                  <span className="font-mono font-bold text-[#FA661C] text-sm">#{selectedRma.vendor_order}</span>
                </div>
                <div className="p-3 bg-[#FFF8F2] rounded-xl border border-[#EAE3DC]">
                  <span className="text-[10px] text-[#6B6058] uppercase font-bold block">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedRma.status)}</div>
                </div>
              </div>

              <div className="p-3 bg-[#FFF8F2] rounded-xl border border-[#EAE3DC] space-y-1">
                <span className="text-[10px] text-[#6B6058] uppercase font-bold block">Requested Action &amp; Reason</span>
                <div className="font-bold text-[#1A2420] capitalize">{selectedRma.requested_action} — {selectedRma.reason}</div>
                {selectedRma.reason_notes && (
                  <p className="text-xs text-[#6B6058] italic mt-1 font-sans">
                    "{selectedRma.reason_notes}"
                  </p>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#1A2420] block">Returned Order Items ({selectedRma.items?.length || 0})</span>
                <div className="divide-y divide-[#EAE3DC] border border-[#EAE3DC] rounded-xl overflow-hidden bg-white">
                  {selectedRma.items && selectedRma.items.length > 0 ? (
                    selectedRma.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center">
                        <span className="font-mono font-bold text-[#FA661C]">Order Item #{item.order_item}</span>
                        <span className="bg-[#FFF3EC] text-[#FA661C] px-2 py-0.5 rounded text-xs font-bold">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[#6B6058]">No item details available</div>
                  )}
                </div>
              </div>

              {/* Customer Refund Facts */}
              {selectedRma.customer_refund && (
                <div className="p-4 bg-[#D1FAE5]/30 rounded-2xl border border-[#10B981]/30 space-y-2">
                  <div className="font-bold text-[#047857] flex items-center space-x-1">
                    <DollarSign className="w-4 h-4 text-[#059669]" />
                    <span>Customer Refund Executed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Amount: <span className="font-mono font-bold text-[#047857]">{selectedRma.customer_refund.currency} {selectedRma.customer_refund.refund_amount}</span></div>
                    <div>Status: <span className="font-bold uppercase text-[#047857]">{selectedRma.customer_refund.status}</span></div>
                    <div className="col-span-2 text-[10px] text-[#6B6058]">Gateway Ref: {selectedRma.customer_refund.gateway_reference}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#FFF8F2] border-t border-[#EAE3DC] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRma(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#EAE3DC] text-xs font-bold text-[#6B6058] hover:bg-[#FFF8F2] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
