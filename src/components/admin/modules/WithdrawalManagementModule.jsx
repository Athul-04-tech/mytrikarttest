import React, { useState, useEffect } from 'react';
import { Landmark, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, Search, Eye, EyeOff, Copy, ShieldCheck, ShieldAlert, CreditCard } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { apiRequest } from '../../../utils/api';

const fmtMoney = (currency, value) =>
  `${currency || ''} ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();

const maskAccount = (num) => (num && num.length > 4 ? `${'•'.repeat(Math.max(4, num.length - 4))}${num.slice(-4)}` : num || '—');

function PayoutDetailsPanel({ request, toast }) {
  const [reveal, setReveal] = useState(false);
  const d = request?.payout_details;
  const bc = request?.balance_context;
  const copy = (label, value) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).then(() => toast.success('Copied', `${label} copied to clipboard.`)).catch(() => {});
  };
  if (!d || !d.configured) {
    return (
      <div className="p-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-[11px] flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0" /> This vendor has not configured payout details. Do not pay out.
      </div>
    );
  }
  const Row = ({ label, value, display, mono = true }) => (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[#6B6058] font-medium shrink-0">{label}</span>
      <span className="flex items-center gap-1.5 min-w-0">
        <span className={`${mono ? 'font-mono' : ''} font-bold text-[#2D231D] truncate`}>{display ?? (value || '—')}</span>
        {value && (
          <button type="button" onClick={() => copy(label, value)} className="p-1 rounded-md hover:bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C] cursor-pointer" title={`Copy ${label}`}>
            <Copy className="w-3 h-3" />
          </button>
        )}
      </span>
    </div>
  );
  const method = (d.method || '').toLowerCase();
  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-[#EAE3DC] bg-gradient-to-br from-[#FFF8F2] to-white p-3.5">
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#EAE3DC]">
          <span className="flex items-center gap-1.5 font-['Outfit'] font-black text-[#2D231D]"><CreditCard className="w-4 h-4 text-[#FA661C]" /> Payout Destination</span>
          {d.is_verified ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold uppercase"><ShieldCheck className="w-3 h-3" /> Verified</span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-100 text-red-800 border border-red-300 text-[10px] font-extrabold uppercase"><ShieldAlert className="w-3 h-3" /> Unverified</span>
          )}
        </div>
        <Row label="Method" value="" display={method === 'bank' ? 'Bank Transfer (NEFT/IMPS)' : method === 'upi' ? 'UPI' : method === 'stripe_connect' ? 'Stripe Connect' : d.method || '—'} mono={false} />
        {method === 'bank' && (
          <>
            <Row label="Account Holder" value={d.bank_account_holder} mono={false} />
            <div className="flex items-center justify-between gap-3 py-1.5">
              <span className="text-[#6B6058] font-medium">Account Number</span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-[#2D231D] tracking-wider">{reveal ? d.bank_account_number || '—' : maskAccount(d.bank_account_number)}</span>
                <button type="button" onClick={() => setReveal((v) => !v)} className="p-1 rounded-md hover:bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C] cursor-pointer" title={reveal ? 'Hide' : 'Reveal'}>
                  {reveal ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                {d.bank_account_number && (
                  <button type="button" onClick={() => copy('Account number', d.bank_account_number)} className="p-1 rounded-md hover:bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C] cursor-pointer" title="Copy account number"><Copy className="w-3 h-3" /></button>
                )}
              </span>
            </div>
            <Row label="IFSC" value={d.bank_ifsc} />
          </>
        )}
        {method === 'upi' && <Row label="UPI ID" value={d.upi_id} />}
        {method === 'stripe_connect' && <Row label="Stripe Account" value={d.stripe_connect_account_id} />}
      </div>
      {!d.is_verified && (
        <div className="p-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[11px] flex gap-2"><ShieldAlert className="w-4 h-4 shrink-0" /> Payout details are not verified. Verify them before sending any money.</div>
      )}
      {d.method_changed_since_request && (
        <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-[11px] flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> Payout method changed after this request was raised (was “{request.payout_method_snapshot}”). Confirm with the vendor.</div>
      )}
      {bc && (
        <div className="rounded-2xl border border-[#EAE3DC] p-3 text-[11px] space-y-1">
          <div className="flex justify-between"><span className="text-[#6B6058]">Wallet balance</span><span className="font-bold">{fmtMoney(request.currency, bc.wallet_balance)}</span></div>
          <div className="flex justify-between"><span className="text-[#6B6058]">Reserved by other requests</span><span className="font-bold">− {fmtMoney(request.currency, bc.other_in_flight)}</span></div>
          <div className="flex justify-between border-t border-[#EAE3DC] pt-1"><span className="text-[#2D231D] font-bold">Available for this request</span><span className={`font-black ${bc.covers_request ? 'text-emerald-700' : 'text-red-600'}`}>{fmtMoney(request.currency, bc.available_for_this_request)}</span></div>
          {['pending', 'under_review', 'approved'].includes(request.status) && !bc.covers_request && (
            <p className="text-red-600 font-semibold pt-1">Insufficient balance — this request cannot be approved or paid.</p>
          )}
        </div>
      )}
    </div>
  );
}

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
  const [detailsRequest, setDetailsRequest] = useState(null);

  const toast = useToast();

  const fetchWithdrawals = async (status = statusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const url = status && status !== 'all' 
        ? `/api/settlements/admin/withdrawals/?status=${status}` 
        : '/api/settlements/admin/withdrawals/';
      
      const data = await apiRequest(url);
      setWithdrawals(Array.isArray(data) ? data : data?.results || []);
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
    const needsReason = actionType === 'reject' || actionType === 'reverse';
    if (needsReason && !rejectReason.trim()) {
      toast.error('Reason Required', actionType === 'reject' ? 'Please specify a rejection reason.' : 'Please specify a reversal reason.');
      return;
    }

    setSubmitting(true);
    try {
      const body = needsReason ? { action: actionType, reason: rejectReason.trim() } : { action: actionType };

      const updatedData = await apiRequest(`/api/settlements/withdrawals/${selectedRequest.id}/review/`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      toast.success(ACTION_META[actionType].done, `Request #${updatedData.id} is now ${updatedData.status}.`);

      // Close modal and refresh
      setSelectedRequest(null);
      setActionType(null);
      setRejectReason('');
      fetchWithdrawals(statusFilter);
    } catch (err) {
      const d = err.data?.detail;
      toast.error('Action Failed', (Array.isArray(d) ? d.join(' ') : d) || err.data?.reason || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const ACTION_META = {
    approve: { title: 'Approve Withdrawal Request', confirm: 'Confirm Approval', done: 'Withdrawal Approved', btn: 'bg-emerald-600 hover:bg-emerald-700', note: 'Approval reserves the amount. Funds are debited from the vendor wallet when you start the payout.' },
    reject: { title: 'Reject Withdrawal Request', confirm: 'Confirm Rejection', done: 'Withdrawal Rejected', btn: 'bg-red-600 hover:bg-red-700', note: 'The reserved amount returns to the vendor\'s withdrawable balance.' },
    processing: { title: 'Start Payout', confirm: 'Debit Wallet & Start Payout', done: 'Payout Started', btn: 'bg-blue-600 hover:bg-blue-700', note: 'This debits the vendor wallet now. Initiate the bank transfer, then mark it Paid once confirmed.' },
    paid: { title: 'Mark Payout as Paid', confirm: 'Confirm Paid', done: 'Payout Completed', btn: 'bg-green-700 hover:bg-green-800', note: 'Confirm the bank transfer has succeeded. The vendor will be notified.' },
    reverse: { title: 'Reverse Failed Payout', confirm: 'Reverse & Refund Wallet', done: 'Payout Reversed', btn: 'bg-gray-700 hover:bg-gray-800', note: 'Use only if the bank transfer failed. The debited amount is credited back to the vendor wallet.' },
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
        (w.payout_method_snapshot && w.payout_method_snapshot.toLowerCase().includes(term)) ||
        (w.payout_details?.bank_account_holder || '').toLowerCase().includes(term) ||
        (w.payout_details?.upi_id || '').toLowerCase().includes(term)
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
                  const ROW_ACTIONS = {
                    pending: ['approve', 'reject'],
                    under_review: ['approve', 'reject'],
                    approved: ['processing', 'reject'],
                    processing: ['paid', 'reverse'],
                  };
                  const rowActions = ROW_ACTIONS[w.status] || [];
                  const ROW_LABEL = { approve: 'Approve', reject: 'Reject', processing: 'Start Payout', paid: 'Mark Paid', reverse: 'Reverse' };
                  const ROW_CLS = { approve: 'bg-emerald-600 hover:bg-emerald-700', reject: 'bg-red-600 hover:bg-red-700', processing: 'bg-blue-600 hover:bg-blue-700', paid: 'bg-green-700 hover:bg-green-800', reverse: 'bg-gray-600 hover:bg-gray-700' };

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
                        <button
                          type="button"
                          onClick={() => setDetailsRequest(w)}
                          title="View payout / bank details"
                          className="flex items-center gap-1.5 capitalize text-[#6B6058] font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-200 hover:border-[#FA661C] hover:text-[#FA661C] transition-colors cursor-pointer"
                        >
                          {w.payout_details?.configured && (w.payout_details.is_verified
                            ? <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            : <ShieldAlert className="w-3 h-3 text-red-600" />)}
                          <span>{w.payout_method_snapshot || 'Bank Transfer'}</span>
                          <Eye className="w-3 h-3" />
                        </button>
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
                          <span>By {w.reviewed_by_email || `Admin #${w.reviewed_by}`} at {new Date(w.reviewed_at).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-gray-400 italic">Unreviewed</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {rowActions.length ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {rowActions.map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => {
                                  setSelectedRequest(w);
                                  setActionType(a);
                                  setRejectReason('');
                                }}
                                className={`px-2.5 py-1 rounded-lg text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs ${ROW_CLS[a]}`}
                              >
                                {a === 'reject' || a === 'reverse' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                <span>{ROW_LABEL[a]}</span>
                              </button>
                            ))}
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
          <div className="bg-white rounded-3xl border border-[#EAE3DC] max-w-md w-full p-6 shadow-2xl space-y-4 animate-dropdown text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
              <div className="flex items-center space-x-2">
                {actionType === 'reject' || actionType === 'reverse' ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="font-['Outfit'] font-black text-base text-[#2D231D]">
                  {ACTION_META[actionType].title}
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

            {['approve', 'processing', 'paid', 'reverse'].includes(actionType) && (
              <PayoutDetailsPanel request={selectedRequest} toast={toast} />
            )}

            <p className="text-[11px] text-[#6B6058] bg-[#FFF3EC] border border-[#FF811A]/30 rounded-xl p-2.5">{ACTION_META[actionType].note}</p>

            {(actionType === 'reject' || actionType === 'reverse') && (
              <div className="space-y-1.5">
                <label className="block font-bold text-[#2D231D]">
                  {actionType === 'reject' ? 'Rejection' : 'Reversal'} Reason <span className="text-red-500">*</span>
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
                  ACTION_META[actionType].btn
                } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{ACTION_META[actionType].confirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout details modal */}
      {detailsRequest && (
        <div className="fixed inset-0 bg-[#2D231D]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setDetailsRequest(null)}>
          <div className="bg-white rounded-3xl border border-[#EAE3DC] max-w-md w-full p-6 shadow-2xl space-y-4 animate-dropdown text-xs max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
              <div>
                <h3 className="font-['Outfit'] font-black text-base text-[#2D231D]">{detailsRequest.vendor_name || `Vendor #${detailsRequest.vendor}`}</h3>
                <p className="text-[11px] text-[#6B6058]">Request #{detailsRequest.id} · {fmtMoney(detailsRequest.currency, detailsRequest.amount)}</p>
              </div>
              <button type="button" onClick={() => setDetailsRequest(null)} className="text-[#6B6058] hover:text-[#2D231D] font-bold cursor-pointer">✕</button>
            </div>
            <PayoutDetailsPanel request={detailsRequest} toast={toast} />
          </div>
        </div>
      )}
    </div>
  );
}
