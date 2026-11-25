import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Check,
  XCircle,
  Eye,
  Calculator,
  History,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Lock,
  Layers,
  Package,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  RATE_CARD_STATUSES,
  RATE_CARD_STATUS_LABELS,
  getRateCardStatusBadgeClass,
  formatDateTime,
  parseRateCardApiError,
} from '../../utils/warehouseUtils';
import RateCardEstimateCalculator from './RateCardEstimateCalculator';

export default function AdminRateCardsSection({
  warehouses = [],
  onOpenAuditLog,
  onAuditUpdated,
}) {
  // 'queue' | 'review' | 'estimate'
  const [subView, setSubView] = useState('queue');

  // Queue filters — default view is 'submitted' cards waiting for a decision
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [page, setPage] = useState(1);

  // Queue data
  const [cards, setCards] = useState([]);
  const [cardsCount, setCardsCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState('');
  const [forbiddenError, setForbiddenError] = useState('');

  // All approved/superseded cards cache for estimate packing helper
  const [allEstimateCards, setAllEstimateCards] = useState([]);

  // Banners
  const [feedbackBanner, setFeedbackBanner] = useState('');
  const [conflictAlert, setConflictAlert] = useState('');

  // Review detail state
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [comparisonCard, setComparisonCard] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Approve / Reject Modal Dialog state
  // { action: 'approve' | 'reject', card: obj }
  const [decisionDialog, setDecisionDialog] = useState(null);
  const [approveEffectiveFrom, setApproveEffectiveFrom] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionFieldErrors, setDecisionFieldErrors] = useState({});
  const [decisionGeneralError, setDecisionGeneralError] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (decisionDialog) {
      if (typeof el.showModal === 'function') {
        if (!el.open) {
          try {
            el.showModal();
          } catch {
            el.setAttribute('open', '');
          }
        }
      } else {
        el.setAttribute('open', '');
      }
    } else if (el.open) {
      if (typeof el.close === 'function') {
        try {
          el.close();
        } catch {
          el.removeAttribute('open');
        }
      } else {
        el.removeAttribute('open');
      }
    }
  }, [decisionDialog]);

  const fetchAdminQueue = useCallback(
    async (
      targetPage = page,
      wh = warehouseFilter,
      st = statusFilter
    ) => {
      setQueueLoading(true);
      setQueueError('');
      setForbiddenError('');
      try {
        const params = new URLSearchParams();
        if (targetPage > 1) params.set('page', String(targetPage));
        if (wh) params.set('warehouse', String(wh));
        if (st) params.set('status', String(st));
        const qs = params.toString() ? `?${params.toString()}` : '';
        const data = await apiRequest(`/api/admin/warehouse/rate-cards/${qs}`);
        const rows = Array.isArray(data) ? data : data?.results || [];
        setCards(rows);
        setCardsCount(
          typeof data?.count === 'number' ? data.count : rows.length
        );
        setNextPageUrl(data?.next || null);
        setPrevPageUrl(data?.previous || null);
        return rows;
      } catch (err) {
        if (err?.status === 401 || err?.status === 403) {
          setForbiddenError(
            err?.data?.detail ||
              'Admin staff authorization is required to view or decide warehouse rate cards.'
          );
        } else {
          setQueueError(
            err?.data?.detail ||
              err?.message ||
              'Failed to load admin rate cards queue.'
          );
        }
        return [];
      } finally {
        setQueueLoading(false);
      }
    },
    [page, warehouseFilter, statusFilter]
  );

  const fetchAllEstimateCards = useCallback(async () => {
    try {
      const data = await apiRequest('/api/admin/warehouse/rate-cards/');
      const rows = Array.isArray(data) ? data : data?.results || [];
      setAllEstimateCards(rows);
    } catch {
      // Non-fatal helper fetch
    }
  }, []);

  const fetchReviewCardAndComparison = useCallback(async (cardId) => {
    if (!cardId) return null;
    setReviewLoading(true);
    setReviewError('');
    try {
      const detail = await apiRequest(
        `/api/admin/warehouse/rate-cards/${cardId}/`
      );
      setSelectedCard(detail);

      // Fetch existing approved cards for this warehouse for side-by-side comparison
      if (detail?.warehouse) {
        try {
          const approvedData = await apiRequest(
            `/api/admin/warehouse/rate-cards/?warehouse=${detail.warehouse}&status=approved`
          );
          const approvedRows = Array.isArray(approvedData)
            ? approvedData
            : approvedData?.results || [];
          const otherApproved =
            approvedRows.find((c) => Number(c.id) !== Number(detail.id)) ||
            null;
          setComparisonCard(otherApproved);
        } catch {
          setComparisonCard(null);
        }
      } else {
        setComparisonCard(null);
      }
      return detail;
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        setForbiddenError(
          err?.data?.detail ||
            'Admin staff authorization is required to inspect warehouse rate cards.'
        );
      } else {
        setReviewError(
          err?.data?.detail ||
            err?.message ||
            `Failed to load rate card #${cardId}.`
        );
      }
      return null;
    } finally {
      setReviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminQueue(page, warehouseFilter, statusFilter);
  }, [fetchAdminQueue, page, warehouseFilter, statusFilter]);

  useEffect(() => {
    if (subView === 'estimate') {
      fetchAllEstimateCards();
    }
  }, [subView, fetchAllEstimateCards]);

  const openReviewView = async (cardOrId) => {
    setConflictAlert('');
    const cardId = typeof cardOrId === 'object' ? cardOrId.id : cardOrId;
    setSelectedCardId(cardId);
    if (typeof cardOrId === 'object' && cardOrId !== null) {
      setSelectedCard(cardOrId);
    }
    setSubView('review');
    await fetchReviewCardAndComparison(cardId);
  };

  const openDecisionModal = (action, card) => {
    setFeedbackBanner('');
    setConflictAlert('');
    setDecisionFieldErrors({});
    setDecisionGeneralError('');
    setDecisionReason('');
    setApproveEffectiveFrom(card?.effective_from || '');
    setDecisionDialog({ action, card });
  };

  const closeDecisionModal = () => {
    setDecisionDialog(null);
    setDecisionReason('');
    setDecisionFieldErrors({});
    setDecisionGeneralError('');
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionDialog) return;
    setDecisionFieldErrors({});
    setDecisionGeneralError('');
    setDecisionSubmitting(true);

    const { action, card } = decisionDialog;
    try {
      const endpoint =
        action === 'approve'
          ? `/api/admin/warehouse/rate-cards/${card.id}/approve/`
          : `/api/admin/warehouse/rate-cards/${card.id}/reject/`;

      const updated = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason: decisionReason }),
      });

      await fetchAdminQueue(page, warehouseFilter, statusFilter);
      if (subView === 'review') {
        await fetchReviewCardAndComparison(updated.id);
      }
      if (onAuditUpdated) {
        onAuditUpdated();
      }
      setSelectedCard(updated);
      closeDecisionModal();
      setFeedbackBanner(
        action === 'approve'
          ? `Rate card v${updated.version} (#${updated.id}) for ${updated.warehouse_name} approved (effective from ${updated.effective_from}).`
          : `Rate card v${updated.version} (#${updated.id}) for ${updated.warehouse_name} rejected.`
      );
    } catch (err) {
      const parsed = parseRateCardApiError(err, ['reason', 'effective_from']);
      const msg =
        parsed.generalError ||
        err?.data?.detail ||
        'Failed to record rate-card decision.';

      if (err?.status === 409) {
        const isDateOverlap = /effective date|overlap/i.test(msg);
        if (isDateOverlap && action === 'approve') {
          // Date overlap 409: show server's message directly under the effective-from date input
          setDecisionFieldErrors((prev) => ({
            ...prev,
            ...parsed.fieldErrors,
            effective_from: msg,
          }));
          setDecisionGeneralError(msg);
        } else {
          // State transition 409 (e.g. another tab already decided this card): show conflict alert & refetch
          closeDecisionModal();
          setConflictAlert(msg);
          await fetchAdminQueue(page, warehouseFilter, statusFilter);
          if (card?.id) {
            await fetchReviewCardAndComparison(card.id);
          }
          if (onAuditUpdated) {
            onAuditUpdated();
          }
        }
      } else {
        setDecisionFieldErrors(parsed.fieldErrors);
        setDecisionGeneralError(parsed.generalError);
      }
    } finally {
      setDecisionSubmitting(false);
    }
  };

  if (forbiddenError) {
    return (
      <div
        data-testid="admin-rate-cards-forbidden"
        role="alert"
        className="p-8 rounded-3xl border border-[#FCA5A5] bg-[#FFF3F3] text-center space-y-3"
      >
        <ShieldAlert className="w-8 h-8 text-[#DC2626] mx-auto" />
        <h3 className="font-['Outfit'] font-extrabold text-xl text-[#991B1B]">
          Admin Authorization Required
        </h3>
        <p className="text-xs text-[#7F1D1D] max-w-md mx-auto">
          {forbiddenError}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="admin-rate-cards-section" className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="p-5 rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6058]">
            Warehouse Phase 3a • Admin Rate Card Governance
          </span>
          <h2 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
            Warehouse Rate Cards Queue, Review &amp; Estimate Calculator
          </h2>
          <p className="text-xs text-[#6B6058]">
            Review manager-submitted rate cards, compare against current approved rates, approve with a future effective date or reject with a reason, and run read-only estimates for any warehouse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="admin-rate-cards-subtab-queue"
            onClick={() => setSubView('queue')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer ${
              subView === 'queue' || subView === 'review'
                ? 'bg-[#FA661C] text-white shadow-2xs'
                : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#1A2420]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rate Cards Queue ({cardsCount})</span>
          </button>

          <button
            type="button"
            data-testid="admin-rate-cards-subtab-estimate"
            onClick={() => setSubView('estimate')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer ${
              subView === 'estimate'
                ? 'bg-[#1A2420] text-white shadow-2xs'
                : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#1A2420]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Admin Estimate Calculator</span>
          </button>

          {onOpenAuditLog && (
            <button
              type="button"
              data-testid="admin-view-rate-card-audit-btn"
              onClick={() => onOpenAuditLog({ objectType: 'RateCard', objectId: '' })}
              className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-[#F9F6F0] hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#FA661C]" />
              <span>Rate Card Audit Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Banner */}
      {feedbackBanner && (
        <div
          data-testid="admin-rate-card-feedback-banner"
          role="status"
          className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/40 flex items-center justify-between gap-3 text-xs text-[#065F46]"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span className="font-semibold">{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner('')}
            className="text-[#065F46] hover:text-[#047857] cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 409 Conflict Banner */}
      {conflictAlert && (
        <div
          data-testid="admin-rate-card-conflict-alert"
          role="alert"
          className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B] flex items-center justify-between gap-3 text-xs text-[#92400E]"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
            <span className="font-bold">
              {conflictAlert} (Reloaded latest state from server.)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setConflictAlert('')}
            className="text-[#92400E] hover:text-[#78350F] cursor-pointer"
            aria-label="Dismiss conflict alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUBVIEW 1: RATE CARDS QUEUE */}
      {subView === 'queue' && (
        <section
          data-testid="admin-rate-cards-queue-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden"
        >
          <div className="p-5 border-b border-[#EAE3DC] flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label
                  htmlFor="admin-rc-warehouse-filter"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Filter by Warehouse
                </label>
                <select
                  id="admin-rc-warehouse-filter"
                  data-testid="admin-rate-cards-warehouse-filter"
                  value={warehouseFilter}
                  onChange={(e) => {
                    setWarehouseFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white font-semibold"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="admin-rc-status-filter"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Filter by Status
                </label>
                <select
                  id="admin-rc-status-filter"
                  data-testid="admin-rate-cards-status-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white font-semibold"
                >
                  <option value="">All Statuses</option>
                  {RATE_CARD_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.value === 'submitted'
                        ? 'Submitted (Waiting for Decision)'
                        : st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="admin-submitted-only-toggle-btn"
                onClick={() => {
                  setStatusFilter((prev) =>
                    prev === 'submitted' ? '' : 'submitted'
                  );
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer border ${
                  statusFilter === 'submitted'
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD]'
                }`}
              >
                {statusFilter === 'submitted'
                  ? 'Showing Submitted Queue (Click for All)'
                  : 'Submitted Waiting for Decision'}
              </button>
            </div>
          </div>

          {queueError && (
            <div
              data-testid="admin-rate-cards-error"
              role="alert"
              className="m-5 p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
            >
              {queueError}
            </div>
          )}

          {queueLoading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading warehouse rate cards queue...
            </div>
          ) : cards.length === 0 ? (
            <div
              data-testid="admin-rate-cards-empty"
              className="p-8 text-center text-xs text-[#6B6058]"
            >
              {statusFilter === 'submitted'
                ? 'No submitted rate cards are currently waiting for an admin decision.'
                : 'No rate cards match the selected warehouse and status filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                data-testid="admin-rate-cards-table"
                className="w-full text-left border-collapse text-xs"
              >
                <caption className="sr-only">
                  Admin warehouse rate cards queue
                </caption>
                <thead>
                  <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                    <th scope="col" className="py-3 px-4">
                      ID &amp; Version
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Warehouse
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Status
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Effective Window
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Free Days / Min Charge
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Submitted By
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Decision
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {cards.map((card) => (
                    <tr
                      key={card.id}
                      data-testid={`admin-rate-card-row-${card.id}`}
                      className="hover:bg-[#FFF3EC]/20"
                    >
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-extrabold text-[#1A2420]">
                          v{card.version}
                        </div>
                        <div className="text-[11px] text-[#6B6058]">
                          Card #{card.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1A2420]">
                          {card.warehouse_name}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B6058]">
                          WH #{card.warehouse}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          data-testid={`admin-rate-card-status-${card.id}`}
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getRateCardStatusBadgeClass(
                            card.status
                          )}`}
                        >
                          {RATE_CARD_STATUS_LABELS[card.status] || card.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div>From: {card.effective_from}</div>
                        <div className="text-[#6B6058]">
                          To: {card.effective_to || 'Open-ended'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-[#1A2420]">
                          {card.currency} {card.minimum_charge}
                        </div>
                        <div className="text-[11px] text-[#6B6058]">
                          {card.free_storage_days} free days
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="font-semibold text-[#1A2420]">
                          {card.submitted_by_username ||
                            card.created_by_username ||
                            '—'}
                        </div>
                        {card.submitted_at && (
                          <div className="text-[#6B6058]">
                            {formatDateTime(card.submitted_at)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        {card.decided_by_username ? (
                          <div>
                            <div className="font-semibold text-[#1A2420]">
                              {card.decided_by_username}
                            </div>
                            <div className="text-[#6B6058] truncate max-w-44">
                              {card.decision_reason}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#6B6058]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            data-testid={`admin-review-rate-card-btn-${card.id}`}
                            aria-label={`${
                              card.status === 'submitted'
                                ? 'Review & Decide'
                                : 'Inspect'
                            } rate card ${card.id}`}
                            onClick={() => openReviewView(card)}
                            className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#FA661C]" />
                            <span>
                              {card.status === 'submitted'
                                ? 'Review & Decide'
                                : 'Inspect'}
                            </span>
                          </button>

                          {card.status === 'submitted' && (
                            <>
                              <button
                                type="button"
                                data-testid={`admin-row-approve-btn-${card.id}`}
                                aria-label={`Approve rate card ${card.id}`}
                                onClick={() =>
                                  openDecisionModal('approve', card)
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                data-testid={`admin-row-reject-btn-${card.id}`}
                                aria-label={`Reject rate card ${card.id}`}
                                onClick={() =>
                                  openDecisionModal('reject', card)
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(prevPageUrl || nextPageUrl) && (
            <div className="px-6 py-3 border-t border-[#EAE3DC] flex items-center justify-between text-xs">
              <span className="text-[#6B6058]">
                Page {page} • Total {cardsCount}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={!prevPageUrl}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer inline-flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={!nextPageUrl}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer inline-flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SUBVIEW 2: ADMIN REVIEW VIEW & COMPARISON WITH CURRENT APPROVED CARD */}
      {subView === 'review' && (
        <section
          data-testid="admin-rate-card-review-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs p-6 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <button
              type="button"
              data-testid="admin-back-to-queue-btn"
              onClick={() => setSubView('queue')}
              className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#FA661C]" />
              <span>Back to Rate Cards Queue</span>
            </button>

            {selectedCard && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  data-testid="admin-review-status-badge"
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${getRateCardStatusBadgeClass(
                    selectedCard.status
                  )}`}
                >
                  {RATE_CARD_STATUS_LABELS[selectedCard.status] ||
                    selectedCard.status}
                </span>

                {selectedCard.status === 'submitted' ? (
                  <>
                    <button
                      type="button"
                      data-testid="admin-open-approve-btn"
                      onClick={() => openDecisionModal('approve', selectedCard)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Rate Card</span>
                    </button>
                    <button
                      type="button"
                      data-testid="admin-open-reject-btn"
                      onClick={() => openDecisionModal('reject', selectedCard)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Rate Card</span>
                    </button>
                  </>
                ) : (
                  <span
                    data-testid="admin-review-immutable-badge"
                    className="px-3 py-1 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] inline-flex items-center space-x-1"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Read-Only ({selectedCard.status})</span>
                  </span>
                )}

                {onOpenAuditLog && (
                  <button
                    type="button"
                    data-testid="admin-view-card-audit-btn"
                    onClick={() =>
                      onOpenAuditLog({
                        objectType: 'RateCard',
                        objectId: String(selectedCard.id),
                      })
                    }
                    className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-[#F9F6F0] hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-[#FA661C]" />
                    <span>Audit Trail (#{selectedCard.id})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {reviewLoading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading rate card #{selectedCardId}...
            </div>
          ) : reviewError ? (
            <div
              data-testid="admin-review-error"
              role="alert"
              className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
            >
              {reviewError}
            </div>
          ) : selectedCard ? (
            <div className="space-y-6">
              {/* Metadata Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Warehouse &amp; Version
                  </span>
                  <div
                    data-testid="admin-review-card-title"
                    className="font-mono font-extrabold text-base text-[#1A2420]"
                  >
                    {selectedCard.warehouse_name} — v{selectedCard.version} (#{selectedCard.id})
                  </div>
                  <div className="font-mono">
                    <span className="text-[#6B6058]">Proposed Effective From:</span>{' '}
                    <span
                      data-testid="admin-review-effective-from"
                      className="font-bold text-[#1A2420]"
                    >
                      {selectedCard.effective_from}
                    </span>
                  </div>
                  <div className="font-mono">
                    <span className="text-[#6B6058]">Effective To:</span>{' '}
                    <span className="font-bold text-[#1A2420]">
                      {selectedCard.effective_to || 'Open-ended'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B6058]">Free Days / Min Charge:</span>{' '}
                    <span className="font-mono font-bold text-[#1A2420]">
                      {selectedCard.free_storage_days} days •{' '}
                      {selectedCard.currency} {selectedCard.minimum_charge}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Manager &amp; Submission
                  </span>
                  <div>
                    <span className="text-[#6B6058]">Created By:</span>{' '}
                    <span className="font-bold text-[#1A2420]">
                      {selectedCard.created_by_username ||
                        `User #${selectedCard.created_by}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B6058]">Submitted By:</span>{' '}
                    <span
                      data-testid="admin-review-submitted-by"
                      className="font-bold text-[#1A2420]"
                    >
                      {selectedCard.submitted_by_username || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B6058]">Submitted Time:</span>{' '}
                    <span
                      data-testid="admin-review-submitted-at"
                      className="text-[#1A2420]"
                    >
                      {formatDateTime(selectedCard.submitted_at)}
                    </span>
                  </div>
                  {selectedCard.notes && (
                    <div>
                      <span className="text-[#6B6058]">Manager Notes:</span>{' '}
                      <span className="font-semibold text-[#1A2420]">
                        {selectedCard.notes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Immutable Decision Result
                  </span>
                  {selectedCard.decided_by || selectedCard.decision_reason ? (
                    <>
                      <div>
                        <span className="text-[#6B6058]">Decided By:</span>{' '}
                        <span
                          data-testid="admin-review-decided-by"
                          className="font-bold text-[#1A2420]"
                        >
                          {selectedCard.decided_by_username ||
                            `Admin #${selectedCard.decided_by}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B6058]">Decided At:</span>{' '}
                        <span className="text-[#1A2420]">
                          {formatDateTime(selectedCard.decided_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B6058]">Decision Reason:</span>{' '}
                        <span
                          data-testid="admin-review-decision-reason"
                          className="font-bold text-[#1A2420]"
                        >
                          {selectedCard.decision_reason}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[#6B6058]">
                      No admin decision recorded yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Submitted Card Size Bands */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#1A2420]" />
                  <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                    Size Bands on v{selectedCard.version} (
                    {selectedCard.size_bands?.length || 0})
                  </h4>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                  <table
                    data-testid="admin-review-bands-table"
                    className="w-full text-left border-collapse text-xs"
                  >
                    <caption className="sr-only">
                      Size bands for reviewed rate card
                    </caption>
                    <thead>
                      <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                        <th scope="col" className="py-2.5 px-4">
                          Label
                        </th>
                        <th scope="col" className="py-2.5 px-4 text-right">
                          Max Length (cm)
                        </th>
                        <th scope="col" className="py-2.5 px-4 text-right">
                          Max Width (cm)
                        </th>
                        <th scope="col" className="py-2.5 px-4 text-right">
                          Max Height (cm)
                        </th>
                        <th scope="col" className="py-2.5 px-4 text-right">
                          Max Weight (kg)
                        </th>
                        <th scope="col" className="py-2.5 px-4 text-right">
                          Storage Rate / Unit / Day
                        </th>
                        <th scope="col" className="py-2.5 px-4 text-right">
                          Handling Rate / Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3DC]">
                      {(selectedCard.size_bands || []).map((band, idx) => (
                        <tr key={band.id ?? idx}>
                          <td className="py-2.5 px-4 font-bold text-[#1A2420]">
                            {band.label}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono">
                            {band.max_length_cm} cm
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono">
                            {band.max_width_cm} cm
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono">
                            {band.max_height_cm} cm
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono">
                            {band.max_weight_kg} kg
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold">
                            {selectedCard.currency}{' '}
                            {band.storage_rate_per_unit_per_day}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold">
                            {selectedCard.currency}{' '}
                            {band.handling_rate_per_unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submitted Card Packing Items */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-[#1A2420]" />
                  <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                    Packing Items on v{selectedCard.version} (
                    {selectedCard.packing_items?.length || 0})
                  </h4>
                </div>
                {(selectedCard.packing_items || []).length === 0 ? (
                  <p className="text-xs text-[#6B6058] italic">
                    No packing items configured on this card.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                    <table
                      data-testid="admin-review-packing-table"
                      className="w-full text-left border-collapse text-xs"
                    >
                      <caption className="sr-only">
                        Packing items for reviewed rate card
                      </caption>
                      <thead>
                        <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                          <th scope="col" className="py-2.5 px-4">
                            ID
                          </th>
                          <th scope="col" className="py-2.5 px-4">
                            Name
                          </th>
                          <th scope="col" className="py-2.5 px-4">
                            Unit
                          </th>
                          <th scope="col" className="py-2.5 px-4 text-right">
                            Price per Unit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE3DC]">
                        {(selectedCard.packing_items || []).map((item, idx) => (
                          <tr key={item.id ?? idx}>
                            <td className="py-2.5 px-4 font-mono text-[#6B6058]">
                              #{item.id}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-[#1A2420]">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-4 font-mono">
                              {item.unit}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold">
                              {selectedCard.currency} {item.price_per_unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Current Approved Card Comparison Panel */}
              <div
                data-testid="admin-rate-card-comparison-panel"
                className="p-5 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0] space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <GitCompare className="w-4 h-4 text-[#1A2420]" />
                  <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                    Current Approved Card for Comparison (
                    {selectedCard.warehouse_name})
                  </h4>
                </div>

                {comparisonCard ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white border border-[#EAE3DC]">
                      <div>
                        <span className="text-[#6B6058]">Approved Version:</span>{' '}
                        <span
                          data-testid="admin-comparison-card-version"
                          className="font-mono font-extrabold text-[#1A2420]"
                        >
                          v{comparisonCard.version} (#{comparisonCard.id})
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B6058]">Effective Window:</span>{' '}
                        <span className="font-mono font-semibold text-[#1A2420]">
                          {comparisonCard.effective_from} →{' '}
                          {comparisonCard.effective_to || 'Open-ended'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B6058]">
                          Free Days / Min Charge:
                        </span>{' '}
                        <span className="font-mono font-semibold text-[#1A2420]">
                          {comparisonCard.free_storage_days} days •{' '}
                          {comparisonCard.currency}{' '}
                          {comparisonCard.minimum_charge}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#EAE3DC] bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <caption className="sr-only">
                          Comparison approved card size bands
                        </caption>
                        <thead>
                          <tr className="bg-[#F5F1EC] border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black">
                            <th scope="col" className="py-2 px-3">
                              Band Label (v{comparisonCard.version})
                            </th>
                            <th scope="col" className="py-2 px-3 text-right">
                              Max Envelope (L×W×H cm / Wt kg)
                            </th>
                            <th scope="col" className="py-2 px-3 text-right">
                              Storage Rate
                            </th>
                            <th scope="col" className="py-2 px-3 text-right">
                              Handling Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAE3DC]">
                          {(comparisonCard.size_bands || []).map((b) => (
                            <tr key={b.id}>
                              <td className="py-2 px-3 font-bold">{b.label}</td>
                              <td className="py-2 px-3 text-right font-mono">
                                {b.max_length_cm} × {b.max_width_cm} ×{' '}
                                {b.max_height_cm} cm / {b.max_weight_kg} kg
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold">
                                {comparisonCard.currency}{' '}
                                {b.storage_rate_per_unit_per_day}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold">
                                {comparisonCard.currency}{' '}
                                {b.handling_rate_per_unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p
                    data-testid="admin-no-comparison-card"
                    className="text-xs text-[#6B6058]"
                  >
                    No other approved rate card currently exists for{' '}
                    {selectedCard.warehouse_name}.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* SUBVIEW 3: ADMIN ESTIMATE CALCULATOR (FOR ANY WAREHOUSE) */}
      {subView === 'estimate' && (
        <RateCardEstimateCalculator
          isAdmin={true}
          warehouses={warehouses}
          rateCards={allEstimateCards.length > 0 ? allEstimateCards : cards}
          defaultWarehouseId={
            warehouseFilter || (warehouses[0]?.id ? String(warehouses[0].id) : '')
          }
        />
      )}

      {/* NATIVE MODAL DIALOG: ADMIN APPROVE OR REJECT */}
      <dialog
        ref={dialogRef}
        aria-labelledby="admin-rate-card-decision-dialog-title"
        data-testid={
          decisionDialog?.action === 'reject'
            ? 'admin-reject-rate-card-modal'
            : 'admin-approve-rate-card-modal'
        }
        onClose={closeDecisionModal}
        className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xl max-w-md w-full p-0 m-auto text-[#1A2420]"
      >
        {decisionDialog && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3
                id="admin-rate-card-decision-dialog-title"
                className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]"
              >
                {decisionDialog.action === 'approve'
                  ? `Approve Rate Card v${decisionDialog.card?.version} (#${decisionDialog.card?.id})`
                  : `Reject Rate Card v${decisionDialog.card?.version} (#${decisionDialog.card?.id})`}
              </h3>
              <button
                type="button"
                onClick={closeDecisionModal}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close decision dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B6058]">
              {decisionDialog.action === 'approve'
                ? `Approving rate card v${decisionDialog.card?.version} for ${decisionDialog.card?.warehouse_name} makes it immutable. Approval requires an effective-from date strictly after today that does not overlap a later approved card.`
                : `Rejecting rate card v${decisionDialog.card?.version} for ${decisionDialog.card?.warehouse_name} records an immutable rejection with your reason.`}
            </p>

            {decisionGeneralError && (
              <div
                data-testid="admin-decision-dialog-error"
                role="alert"
                className="p-3.5 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
              >
                {decisionGeneralError}
              </div>
            )}

            <form
              onSubmit={handleDecisionSubmit}
              className="space-y-3"
              noValidate
            >
              {decisionDialog.action === 'approve' && (
                <div>
                  <label
                    htmlFor="admin-approve-effective-from"
                    className="block text-xs font-bold text-[#1A2420] mb-1"
                  >
                    Effective-From Date (Proposed on Submitted Card)
                  </label>
                  <input
                    id="admin-approve-effective-from"
                    name="effective_from"
                    data-testid="admin-approve-effective-from-input"
                    type="date"
                    value={approveEffectiveFrom}
                    readOnly
                    aria-invalid={Boolean(decisionFieldErrors.effective_from)}
                    aria-describedby={
                      decisionFieldErrors.effective_from
                        ? 'admin-approve-err-effective_from'
                        : undefined
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#F9F6F0] text-xs font-mono text-[#1A2420]"
                  />
                  {decisionFieldErrors.effective_from && (
                    <p
                      id="admin-approve-err-effective_from"
                      data-testid="admin-approve-error-effective_from"
                      className="text-[11px] font-semibold text-[#DC2626] mt-1"
                    >
                      {decisionFieldErrors.effective_from}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-decision-reason"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Decision Audit Reason{' '}
                  <span aria-hidden="true" className="text-[#DC2626]">
                    *
                  </span>
                </label>
                <textarea
                  id="admin-decision-reason"
                  name="reason"
                  data-testid={
                    decisionDialog.action === 'reject'
                      ? 'admin-reject-reason-input'
                      : 'admin-approve-reason-input'
                  }
                  rows={2}
                  value={decisionReason}
                  aria-invalid={Boolean(decisionFieldErrors.reason)}
                  onChange={(e) => {
                    setDecisionReason(e.target.value);
                    setDecisionFieldErrors((fe) => ({ ...fe, reason: '' }));
                  }}
                  placeholder={
                    decisionDialog.action === 'approve'
                      ? 'Enter mandatory approval audit reason...'
                      : 'Enter mandatory rejection reason...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                />
                {decisionFieldErrors.reason && (
                  <p
                    data-testid={
                      decisionDialog.action === 'reject'
                        ? 'admin-reject-error-reason'
                        : 'admin-approve-error-reason'
                    }
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {decisionFieldErrors.reason}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeDecisionModal}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid={
                    decisionDialog.action === 'reject'
                      ? 'admin-confirm-reject-btn'
                      : 'admin-confirm-approve-btn'
                  }
                  disabled={decisionSubmitting}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                    decisionDialog.action === 'reject'
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                      : 'bg-[#059669] hover:bg-[#047857]'
                  }`}
                >
                  {decisionSubmitting
                    ? 'Submitting...'
                    : decisionDialog.action === 'approve'
                    ? 'Confirm Approve'
                    : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </div>
  );
}
