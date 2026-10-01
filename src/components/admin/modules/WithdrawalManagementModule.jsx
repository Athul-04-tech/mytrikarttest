import React, { useState, useEffect } from 'react';
import { Landmark, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { apiRequest } from '../../../utils/api';

export default function WithdrawalManagementModule() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Review modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const fetchWithdrawals = async (status = statusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const url = status && status !== 'all' 
        ? `/api/settlements/admin/withdrawals/?status=${status}` 
        : '/api/settlements/admin/withdrawals/';
      
      const data = await apiRequest(url);
      setWithdrawals(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals(statusFilter);
  }, [statusFilter]);

  const handleReviewAction = async () => {
    if (!selectedRequest || !actionType) return;
    if (actionType === 'reject' && !rejectReason.trim()) {
      toast.error('Reason Required', 'Please specify a rejection reason.');
      return;
    }

    setSubmitting(true);
    try {
      const body = actionType === 'approve' 
        ? { action: 'approve' }
        : { action: 'reject', reason: rejectReason.trim() };

      const updatedData = await apiRequest(`/api/settlements/withdrawals/${selectedRequest.id}/review/`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      toast.success(
        actionType === 'approve' ? 'Withdrawal Approved' : 'Withdrawal Rejected',
        `Request #${updatedData.id} has been ${updatedData.status}.`
      );

      // Close modal and refresh
      setSelectedRequest(null);
      setActionType(null);
      setRejectReason('');
      fetchWithdrawals(statusFilter);
    } catch (err) {
      toast.error('Action Failed', err.data?.detail || err.data?.reason || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadges = {
    pending: { label: 'Pending', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    approved: { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    rejected: { label: 'Rejected', bg: 'bg-red-100 text-red-800 border-red-300' },
    processing: { label: 'Processing', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
    paid: { label: 'Paid', bg: 'bg-green-100 text-green-800 border-green-300' },
    failed_reversed: { label: 'Reversed', bg: 'bg-gray-100 text-gray-800 border-gray-300' },
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        w.id.toString().includes(term) ||
        (w.vendor_name && w.vendor_name.toLowerCase().includes(term)) ||
        (w.amount && w.amount.includes(term)) ||
        (w.payout_method_snapshot && w.payout_method_snapshot.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
              <Landmark className="w-5 h-5" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#2D231D]">
              Vendor Withdrawal Management
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-1">
            Review, approve, or reject vendor payout requests with verified audit logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchWithdrawals(statusFilter)}
          className="px-3.5 py-2 bg-[#FFFFFF] border border-[#EAE3DC] text-[#2D231D] rounded-xl text-xs font-bold hover:border-[#FA661C] transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#6B6058] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-[#FFF8F2] p-1 rounded-2xl border border-[#EAE3DC] overflow-x-auto">
          {['all', 'pending', 'approved', 'rejected', 'processing', 'paid'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-[#FA661C] text-[#FFFFFF] shadow-xs'
                  : 'text-[#6B6058] hover:text-[#2D231D]'
              }`}
            >
              {tab === 'all' ? 'All Statuses' : tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#6B6058] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, amount, vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE3DC] rounded-xl text-xs font-medium focus:outline-none focus:border-[#FA661C] transition-colors"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-700 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B6058] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FA661C]" />
            <p>Loading withdrawal requests...</p>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6B6058] space-y-1">
            <Clock className="w-8 h-8 text-[#A89F91] mx-auto mb-2" />
            <p className="font-bold text-[#2D231D]">No withdrawal requests found</p>
            <p className="text-[11px]">There are no withdrawal requests matching the selected status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Req ID</th>
                  <th className="p-3.5">Vendor</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Requested At</th>
                  <th className="p-3.5">Reviewed / Reason</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                {filteredWithdrawals.map((w) => {
                  const badge = statusBadges[w.status] || { label: w.status, bg: 'bg-gray-100 text-gray-800' };
                  const isReviewable = w.status === 'pending' || w.status === 'under_review';

                  return (
                    <tr key={w.id} className="hover:bg-[#FFF8F2]/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#FA661C]">
                        #{w.id}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-[#2D231D]">{w.vendor_name || `Vendor #${w.vendor}`}</div>
                      </td>
                      <td className="p-3.5 font-['Outfit'] font-black text-sm text-[#2D231D]">
                        {w.currency} {parseFloat(w.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5">
                        <span className="capitalize text-[#6B6058] font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {w.payout_method_snapshot || 'Bank Transfer'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#6B6058] text-[11px]">
                        {new Date(w.requested_at).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-[#6B6058] text-[11px] max-w-[200px] truncate">
                        {w.rejection_reason ? (
                          <span className="text-red-600 font-semibold" title={w.rejection_reason}>
                            {w.rejection_reason}
                          </span>
                        ) : w.reviewed_at ? (
                          <span>By Admin #{w.reviewed_by} at {new Date(w.reviewed_at).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-gray-400 italic">Unreviewed</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {isReviewable ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequest(w);
                                setActionType('approve');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequest(w);
                                setActionType('reject');
                                setRejectReason('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#A89F91]">Finalized</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 bg-[#2D231D]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] max-w-md w-full p-6 shadow-2xl space-y-4 animate-dropdown text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
              <div className="flex items-center space-x-2">
                {actionType === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-['Outfit'] font-black text-base text-[#2D231D]">
                  {actionType === 'approve' ? 'Approve Withdrawal Request' : 'Reject Withdrawal Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                className="text-[#6B6058] hover:text-[#2D231D] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-[#FFF8F2] p-3.5 rounded-2xl border border-[#EAE3DC]">
              <div className="flex justify-between">
                <span className="text-[#6B6058] font-medium">Request ID:</span>
                <span className="font-mono font-bold text-[#FA661C]">#{selectedRequest.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6058] font-medium">Vendor:</span>
                <span className="font-bold text-[#2D231D]">{selectedRequest.vendor_name || `Vendor #${selectedRequest.vendor}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6058] font-medium">Amount:</span>
                <span className="font-['Outfit'] font-black text-sm text-[#2D231D]">
                  {selectedRequest.currency} {parseFloat(selectedRequest.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6058] font-medium">Payout Method:</span>
                <span className="capitalize font-semibold text-[#2D231D]">{selectedRequest.payout_method_snapshot || 'Bank Transfer'}</span>
              </div>
            </div>

            {actionType === 'reject' && (
              <div className="space-y-1.5">
                <label className="block font-bold text-[#2D231D]">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="State clear audit reason for rejecting this withdrawal (e.g., IFSC mismatch, compliance document verification failure)..."
                  className="w-full p-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-medium focus:outline-none focus:border-[#FA661C] transition-colors"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#EAE3DC]">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                className="px-4 py-2 bg-white border border-[#EAE3DC] text-[#6B6058] rounded-xl font-bold text-xs hover:border-[#2D231D] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleReviewAction}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
