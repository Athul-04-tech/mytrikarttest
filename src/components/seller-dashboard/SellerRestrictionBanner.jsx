import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Ban,
  History,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  Wallet
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useVendorProfile } from '../../context/VendorProfileContext';

const ACTION_LABELS = {
  suspend: { label: 'Suspended Selling', cls: 'bg-[#FDE8EA] text-[#D7263D] border-[#D7263D]/30' },
  reactivate: { label: 'Reactivated Selling', cls: 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/40' },
  block_withdrawals: { label: 'Blocked New Withdrawals', cls: 'bg-amber-100 text-amber-900 border-amber-300' },
  release_withdrawals: { label: 'Released Withdrawals', cls: 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/40' },
};

function formatStateSummary(values) {
  if (!values || typeof values !== 'object') return '—';
  const parts = [];
  if (values.operational_state) parts.push(`state: ${values.operational_state}`);
  if (typeof values.can_sell === 'boolean') parts.push(`can_sell: ${values.can_sell ? 'true' : 'false'}`);
  if (typeof values.can_withdraw === 'boolean') parts.push(`can_withdraw: ${values.can_withdraw ? 'true' : 'false'}`);
  return parts.join(', ') || '—';
}

export function SellerControlHistoryPanel({ defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [historyData, setHistoryData] = useState({ count: 0, next: null, previous: null, results: [] });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/vendors/me/control-history/?page=${targetPage}`);
      if (Array.isArray(data)) {
        setHistoryData({ count: data.length, next: null, previous: null, results: data });
      } else {
        setHistoryData({
          count: data?.count ?? 0,
          next: data?.next ?? null,
          previous: data?.previous ?? null,
          results: Array.isArray(data?.results) ? data.results : [],
        });
      }
      setPage(targetPage);
    } catch (err) {
      setError(err?.data?.detail || err?.message || 'Failed to load account control history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHistory(1);
    }
  }, [isOpen, fetchHistory]);

  return (
    <div
      data-testid="seller-control-history-section"
      className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-2xs text-xs"
    >
      <div className="px-4 py-3 bg-[#FFF8F2] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#FA661C] shrink-0" />
          <div>
            <span className="font-bold text-[#1A2420]">Account Control History</span>
            <span className="text-[11px] text-[#6B6058] ml-2">
              Seller-visible operational status changes from marketplace governance
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOpen && (
            <button
              type="button"
              onClick={() => fetchHistory(page)}
              disabled={loading}
              className="p-1.5 rounded-lg border border-[#EAE3DC] bg-white text-[#FA661C] hover:bg-[#FFF3EC] cursor-pointer disabled:opacity-50"
              title="Refresh Control History"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            type="button"
            data-testid="toggle-seller-control-history"
            onClick={() => setIsOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#EAE3DC] hover:bg-[#FFF3EC] text-[#FA661C] font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{isOpen ? 'Hide History' : 'View Control History'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-[#EAE3DC] space-y-3">
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-[#FDE8EA] border border-[#D7263D]/30 text-[#D7263D] font-semibold">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-4 text-center text-[#6B6058] animate-pulse">
              Loading seller control history...
            </div>
          ) : historyData.results.length === 0 ? (
            <div className="py-4 text-center text-[#6B6058] bg-[#FFF8F2]/50 rounded-xl border border-dashed border-[#EAE3DC]">
              No seller-visible control history events recorded for this store.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAE3DC] text-[10px] uppercase tracking-wider text-[#FA661C] font-extrabold">
                      <th className="p-2">Action</th>
                      <th className="p-2">Date &amp; Time</th>
                      <th className="p-2">State Change</th>
                      <th className="p-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]/60">
                    {historyData.results.map((item) => {
                      const meta = ACTION_LABELS[item.action] || {
                        label: item.action,
                        cls: 'bg-gray-100 text-gray-800 border-gray-300',
                      };
                      return (
                        <tr key={item.id} data-testid={`seller-history-row-${item.id}`}>
                          <td className="p-2 align-top">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.cls}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="p-2 align-top text-[#6B6058] whitespace-nowrap font-mono text-[11px]">
                            {item.occurred_at ? new Date(item.occurred_at).toLocaleString() : '—'}
                          </td>
                          <td className="p-2 align-top font-mono text-[10px] text-[#6B6058]">
                            <div>From: {formatStateSummary(item.old_values)}</div>
                            <div className="text-[#1A2420] font-semibold">To: {formatStateSummary(item.new_values)}</div>
                          </td>
                          <td className="p-2 align-top font-medium text-[#1A2420]">
                            {item.reason || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {(historyData.previous || historyData.next) && (
                <div className="flex items-center justify-between pt-2 border-t border-[#EAE3DC]">
                  <span className="text-[11px] text-[#6B6058]">
                    Total events: {historyData.count} (Page {page})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!historyData.previous || loading}
                      onClick={() => fetchHistory(page - 1)}
                      className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white text-[#FA661C] font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={!historyData.next || loading}
                      onClick={() => fetchHistory(page + 1)}
                      className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white text-[#FA661C] font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerRestrictionBanner({ vendorProfile: propProfile }) {
  const context = useVendorProfile();
  const profile = propProfile !== undefined ? propProfile : context?.vendorProfile;

  // Render nothing when profile is not loaded yet or when nothing is restricted
  if (!profile) return null;

  const sellingBlocked = profile.may_sell === false;
  const withdrawalsBlocked = profile.can_withdraw === false;

  if (!sellingBlocked && !withdrawalsBlocked) {
    return null;
  }

  const isSuspended = profile.operational_state === 'suspended';
  const isUnapproved = !['approved', 'verified', 'wizard_in_progress', 'store_published'].includes(
    profile.onboarding_status
  );

  let headline = 'Account Operational Restriction Active';
  if (sellingBlocked && withdrawalsBlocked) {
    headline = 'Selling & New Withdrawals Are Currently Blocked';
  } else if (sellingBlocked) {
    headline = isSuspended
      ? 'Store Suspended — Selling Is Currently Blocked'
      : 'Selling Is Currently Restricted';
  } else if (withdrawalsBlocked) {
    headline = 'New Withdrawal Requests Are Currently Blocked';
  }

  return (
    <section
      role="alert"
      aria-live="polite"
      data-testid="seller-restriction-banner"
      className="rounded-3xl border-2 border-[#D7263D] bg-[#FDE8EA]/90 p-5 sm:p-6 text-xs text-[#1A2420] shadow-sm space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[#D7263D] text-white shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D7263D] text-white">
                Operational Restriction
              </span>
              <span
                data-testid="banner-operational-state"
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border border-[#D7263D]/40 bg-white text-[#D7263D]"
              >
                State: {profile.operational_state || 'active'}
              </span>
              <span
                data-testid="banner-selling-switch"
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  sellingBlocked
                    ? 'border-[#D7263D]/40 bg-white text-[#D7263D]'
                    : 'border-[#52B788]/40 bg-[#EAF5ED] text-[#40916C]'
                }`}
              >
                Selling: {sellingBlocked ? 'Blocked' : 'Allowed'}
              </span>
              <span
                data-testid="banner-withdrawals-switch"
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  withdrawalsBlocked
                    ? 'border-[#D7263D]/40 bg-white text-[#D7263D]'
                    : 'border-[#52B788]/40 bg-[#EAF5ED] text-[#40916C]'
                }`}
              >
                Withdrawals: {withdrawalsBlocked ? 'Blocked' : 'Allowed'}
              </span>
            </div>

            <h2 className="font-['Outfit'] font-black text-base sm:text-lg text-[#D7263D]">
              {headline}
            </h2>

            {/* Seller-visible control_reason from /api/vendors/me/ */}
            {profile.control_reason ? (
              <div
                data-testid="seller-restriction-reason"
                className="p-3 rounded-2xl bg-white border border-[#D7263D]/30 text-[#1A2420]"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D7263D] block">
                  Reason from Marketplace Governance
                </span>
                <p className="font-semibold text-xs mt-0.5">{profile.control_reason}</p>
              </div>
            ) : (
              <p data-testid="seller-restriction-no-reason" className="text-xs text-[#6B6058]">
                {isUnapproved && !isSuspended && profile.can_sell !== false
                  ? `Your onboarding status is "${profile.onboarding_status}". Storefront selling activates once onboarding is approved.`
                  : 'No public reason was shared for the latest control action.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Policy & Impact Disclosures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {sellingBlocked && (
          <div className="p-3 rounded-2xl bg-white/90 border border-[#D7263D]/25 flex items-start gap-2.5">
            <Ban className="w-4 h-4 text-[#D7263D] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#D7263D] block">Storefront Visibility &amp; Checkout</span>
              <p className="text-[11px] text-[#6B6058] mt-0.5">
                Your products are hidden from the public storefront and cannot be bought (<code>vendor_cannot_sell</code>). Your product fields are untouched, and reactivation restores them.
              </p>
            </div>
          </div>
        )}

        {withdrawalsBlocked && (
          <div className="p-3 rounded-2xl bg-white/90 border border-[#D7263D]/25 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#D7263D] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#D7263D] block">In-Flight Withdrawals Continue</span>
              <p className="text-[11px] text-[#6B6058] mt-0.5">
                Blocking withdrawals only refuses <strong>NEW</strong> withdrawal requests (<code>withdrawals_blocked</code>). Requests already in flight continue unchanged.
              </p>
            </div>
          </div>
        )}

        <div className="p-3 rounded-2xl bg-white/90 border border-[#EAE3DC] flex items-start gap-2.5">
          <Wallet className="w-4 h-4 text-[#40916C] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#1A2420] block">Settled Money Stays Yours</span>
            <p className="text-[11px] text-[#6B6058] mt-0.5">
              Settled earnings in your seller wallet remain your property. A suspension or restriction never removes or confiscates settled money.
            </p>
          </div>
        </div>
      </div>

      {/* Seller-safe Control History inside the banner */}
      <SellerControlHistoryPanel defaultOpen={false} />
    </section>
  );
}

