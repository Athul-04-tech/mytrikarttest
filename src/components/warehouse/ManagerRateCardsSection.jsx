import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Send,
  Trash2,
  Eye,
  Calculator,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Calendar,
  Clock,
  Layers,
  Package,
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

const DRAFT_KNOWN_FIELDS = [
  'currency',
  'effective_from',
  'free_storage_days',
  'minimum_charge',
  'notes',
  'reason',
  'size_bands',
  'packing_items',
];

const EMPTY_BAND = {
  label: '',
  max_length_cm: '',
  max_width_cm: '',
  max_height_cm: '',
  max_weight_kg: '',
  storage_rate_per_unit_per_day: '',
  handling_rate_per_unit: '0.00',
};

const EMPTY_PACKING_ITEM = {
  name: '',
  unit: 'each',
  price_per_unit: '',
};

function isNegativeInput(val) {
  const s = String(val ?? '').trim();
  return s.startsWith('-');
}

export default function ManagerRateCardsSection({
  warehouse,
  initialSubView = 'list',
  onSubViewChange,
  onUnauthorized,
}) {
  // 'list' | 'editor' | 'detail' | 'estimate'
  const [subView, setSubView] = useState(initialSubView);

  useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  const changeSubView = (nextView) => {
    setSubView(nextView);
    if (onSubViewChange) {
      onSubViewChange(nextView);
    }
  };

  // List & current state
  const [cards, setCards] = useState([]);
  const [cardsCount, setCardsCount] = useState(0);
  const [currentInfo, setCurrentInfo] = useState({
    as_of_date: '',
    current: null,
    next: null,
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  // Feedback & Conflict banners
  const [feedbackBanner, setFeedbackBanner] = useState('');
  const [conflictAlert, setConflictAlert] = useState('');

  // Detail state
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Draft Editor state (null = creating new draft; number = editing existing draft id)
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [draftEffectiveFrom, setDraftEffectiveFrom] = useState('');
  const [draftFreeDays, setDraftFreeDays] = useState('0');
  const [draftMinCharge, setDraftMinCharge] = useState('0.00');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftReason, setDraftReason] = useState('');
  const [draftBands, setDraftBands] = useState([{ ...EMPTY_BAND }]);
  const [draftPackingItems, setDraftPackingItems] = useState([]);
  const [draftFieldErrors, setDraftFieldErrors] = useState({});
  const [draftBandErrors, setDraftBandErrors] = useState([]);
  const [draftPackingErrors, setDraftPackingErrors] = useState([]);
  const [draftGeneralError, setDraftGeneralError] = useState('');
  const [draftSaving, setDraftSaving] = useState(false);

  // Submit / Discard Confirm Dialog state
  // { action: 'submit' | 'discard', card: obj }
  const [actionDialog, setActionDialog] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [actionFieldErrors, setActionFieldErrors] = useState({});
  const [actionGeneralError, setActionGeneralError] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (actionDialog) {
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
  }, [actionDialog]);

  const fetchRateCardsAndCurrent = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const [listData, currData] = await Promise.all([
        apiRequest('/api/warehouse/rate-cards/'),
        apiRequest('/api/warehouse/rate-cards/current/'),
      ]);
      const rows = Array.isArray(listData) ? listData : listData?.results || [];
      setCards(rows);
      setCardsCount(
        typeof listData?.count === 'number' ? listData.count : rows.length
      );
      if (currData && typeof currData === 'object') {
        setCurrentInfo({
          as_of_date: currData.as_of_date || '',
          current: currData.current || null,
          next: currData.next || null,
        });
      }
      return rows;
    } catch (err) {
      if (err?.status === 401 && onUnauthorized) {
        await onUnauthorized();
        return [];
      }
      setListError(
        err?.data?.detail ||
          err?.message ||
          'Failed to load warehouse rate cards from the server.'
      );
      return [];
    } finally {
      setListLoading(false);
    }
  }, [onUnauthorized]);

  const fetchCardDetail = useCallback(
    async (cardId) => {
      if (!cardId) return null;
      setDetailLoading(true);
      setDetailError('');
      try {
        const data = await apiRequest(`/api/warehouse/rate-cards/${cardId}/`);
        setSelectedCard(data);
        return data;
      } catch (err) {
        if (err?.status === 401 && onUnauthorized) {
          await onUnauthorized();
          return null;
        }
        setSelectedCard(null);
        setDetailError(
          err?.data?.detail ||
            err?.message ||
            `Failed to load rate card #${cardId}.`
        );
        return null;
      } finally {
        setDetailLoading(false);
      }
    },
    [onUnauthorized]
  );

  useEffect(() => {
    fetchRateCardsAndCurrent();
  }, [fetchRateCardsAndCurrent]);

  const openViewDetail = async (cardOrId) => {
    setConflictAlert('');
    const cardId = typeof cardOrId === 'object' ? cardOrId.id : cardOrId;
    setSelectedCardId(cardId);
    if (typeof cardOrId === 'object' && cardOrId !== null) {
      setSelectedCard(cardOrId);
    }
    changeSubView('detail');
    await fetchCardDetail(cardId);
  };

  const openCreateDraftEditor = () => {
    setFeedbackBanner('');
    setConflictAlert('');
    setEditingDraftId(null);
    setDraftEffectiveFrom('');
    setDraftFreeDays('0');
    setDraftMinCharge('0.00');
    setDraftNotes('');
    setDraftReason('');
    setDraftBands([{ ...EMPTY_BAND }]);
    setDraftPackingItems([]);
    setDraftFieldErrors({});
    setDraftBandErrors([]);
    setDraftPackingErrors([]);
    setDraftGeneralError('');
    changeSubView('editor');
  };

  const populateDraftFormFromCard = (card) => {
    setEditingDraftId(card.id);
    setDraftEffectiveFrom(card.effective_from || '');
    setDraftFreeDays(
      card.free_storage_days !== undefined && card.free_storage_days !== null
        ? String(card.free_storage_days)
        : '0'
    );
    setDraftMinCharge(
      card.minimum_charge !== undefined && card.minimum_charge !== null
        ? String(card.minimum_charge)
        : '0.00'
    );
    setDraftNotes(card.notes || '');
    setDraftReason('');
    setDraftBands(
      Array.isArray(card.size_bands) && card.size_bands.length > 0
        ? card.size_bands.map((b) => ({
            label: b.label || '',
            max_length_cm:
              b.max_length_cm != null ? String(b.max_length_cm) : '',
            max_width_cm: b.max_width_cm != null ? String(b.max_width_cm) : '',
            max_height_cm:
              b.max_height_cm != null ? String(b.max_height_cm) : '',
            max_weight_kg:
              b.max_weight_kg != null ? String(b.max_weight_kg) : '',
            storage_rate_per_unit_per_day:
              b.storage_rate_per_unit_per_day != null
                ? String(b.storage_rate_per_unit_per_day)
                : '',
            handling_rate_per_unit:
              b.handling_rate_per_unit != null
                ? String(b.handling_rate_per_unit)
                : '0.00',
          }))
        : []
    );
    setDraftPackingItems(
      Array.isArray(card.packing_items)
        ? card.packing_items.map((p) => ({
            name: p.name || '',
            unit: p.unit || 'each',
            price_per_unit:
              p.price_per_unit != null ? String(p.price_per_unit) : '',
          }))
        : []
    );
    setDraftFieldErrors({});
    setDraftBandErrors([]);
    setDraftPackingErrors([]);
    setDraftGeneralError('');
  };

  const openEditDraftEditor = async (card) => {
    setFeedbackBanner('');
    setConflictAlert('');
    if (!card || card.status !== 'draft') {
      // Non-draft cards are immutable; redirect to read-only detail
      await openViewDetail(card);
      return;
    }
    populateDraftFormFromCard(card);
    setSelectedCardId(card.id);
    setSelectedCard(card);
    changeSubView('editor');
  };

  const handleAddBandRow = () => {
    setDraftBands((prev) => [...prev, { ...EMPTY_BAND }]);
    setDraftFieldErrors((fe) => ({ ...fe, size_bands: '' }));
  };

  const handleRemoveBandRow = (idx) => {
    setDraftBands((prev) => prev.filter((_, i) => i !== idx));
    setDraftBandErrors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateBandRow = (idx, field, val) => {
    setDraftBands((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
    setDraftBandErrors((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], [field]: '' };
      }
      return next;
    });
    setDraftFieldErrors((fe) => ({ ...fe, size_bands: '' }));
  };

  const handleAddPackingRow = () => {
    setDraftPackingItems((prev) => [...prev, { ...EMPTY_PACKING_ITEM }]);
    setDraftFieldErrors((fe) => ({ ...fe, packing_items: '' }));
  };

  const handleRemovePackingRow = (idx) => {
    setDraftPackingItems((prev) => prev.filter((_, i) => i !== idx));
    setDraftPackingErrors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdatePackingRow = (idx, field, val) => {
    setDraftPackingItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
    setDraftPackingErrors((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], [field]: '' };
      }
      return next;
    });
    setDraftFieldErrors((fe) => ({ ...fe, packing_items: '' }));
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    setDraftFieldErrors({});
    setDraftBandErrors([]);
    setDraftPackingErrors([]);
    setDraftGeneralError('');
    setConflictAlert('');
    setFeedbackBanner('');

    // Client checks limited to obvious things (negative values)
    const clientFieldErrs = {};
    if (isNegativeInput(draftFreeDays)) {
      clientFieldErrs.free_storage_days = 'Free storage days cannot be negative.';
    }
    if (isNegativeInput(draftMinCharge)) {
      clientFieldErrs.minimum_charge = 'Minimum charge cannot be negative.';
    }

    const clientBandErrs = [];
    let hasClientBandErr = false;
    draftBands.forEach((band, idx) => {
      const bErr = {};
      if (isNegativeInput(band.max_length_cm)) {
        bErr.max_length_cm = 'Max length cannot be negative.';
        hasClientBandErr = true;
      }
      if (isNegativeInput(band.max_width_cm)) {
        bErr.max_width_cm = 'Max width cannot be negative.';
        hasClientBandErr = true;
      }
      if (isNegativeInput(band.max_height_cm)) {
        bErr.max_height_cm = 'Max height cannot be negative.';
        hasClientBandErr = true;
      }
      if (isNegativeInput(band.max_weight_kg)) {
        bErr.max_weight_kg = 'Max weight cannot be negative.';
        hasClientBandErr = true;
      }
      if (isNegativeInput(band.storage_rate_per_unit_per_day)) {
        bErr.storage_rate_per_unit_per_day = 'Storage rate cannot be negative.';
        hasClientBandErr = true;
      }
      if (isNegativeInput(band.handling_rate_per_unit)) {
        bErr.handling_rate_per_unit = 'Handling rate cannot be negative.';
        hasClientBandErr = true;
      }
      clientBandErrs[idx] = bErr;
    });

    const clientPackingErrs = [];
    let hasClientPackingErr = false;
    draftPackingItems.forEach((item, idx) => {
      const pErr = {};
      if (isNegativeInput(item.price_per_unit)) {
        pErr.price_per_unit = 'Price per unit cannot be negative.';
        hasClientPackingErr = true;
      }
      clientPackingErrs[idx] = pErr;
    });

    if (
      Object.keys(clientFieldErrs).length > 0 ||
      hasClientBandErr ||
      hasClientPackingErr
    ) {
      setDraftFieldErrors(clientFieldErrs);
      setDraftBandErrors(clientBandErrs);
      setDraftPackingErrors(clientPackingErrs);
      setDraftGeneralError('Please correct negative values before saving.');
      return;
    }

    setDraftSaving(true);
    try {
      const payload = {
        effective_from: draftEffectiveFrom,
        free_storage_days:
          String(draftFreeDays).trim() !== ''
            ? Number(draftFreeDays)
            : draftFreeDays,
        minimum_charge: String(draftMinCharge).trim(),
        notes: draftNotes,
        reason: draftReason,
        size_bands: draftBands.map((b, idx) => ({
          label: b.label,
          max_length_cm: String(b.max_length_cm).trim(),
          max_width_cm: String(b.max_width_cm).trim(),
          max_height_cm: String(b.max_height_cm).trim(),
          max_weight_kg: String(b.max_weight_kg).trim(),
          storage_rate_per_unit_per_day: String(
            b.storage_rate_per_unit_per_day
          ).trim(),
          handling_rate_per_unit:
            String(b.handling_rate_per_unit).trim() !== ''
              ? String(b.handling_rate_per_unit).trim()
              : '0.00',
          display_order: idx + 1,
        })),
        packing_items: draftPackingItems.map((p) => ({
          name: p.name,
          unit: p.unit,
          price_per_unit: String(p.price_per_unit).trim(),
        })),
      };

      let savedCard;
      if (editingDraftId) {
        savedCard = await apiRequest(
          `/api/warehouse/rate-cards/${editingDraftId}/`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          }
        );
      } else {
        savedCard = await apiRequest('/api/warehouse/rate-cards/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      await fetchRateCardsAndCurrent();
      setSelectedCardId(savedCard.id);
      setSelectedCard(savedCard);
      changeSubView('detail');
      setFeedbackBanner(
        editingDraftId
          ? `Draft rate card v${savedCard.version} (#${savedCard.id}) updated.`
          : `Draft rate card v${savedCard.version} (#${savedCard.id}) created.`
      );
    } catch (err) {
      if (err?.status === 401 && onUnauthorized) {
        await onUnauthorized();
        return;
      }
      const parsed = parseRateCardApiError(err, DRAFT_KNOWN_FIELDS);
      if (err?.status === 409) {
        const msg =
          parsed.generalError ||
          err?.data?.detail ||
          'This rate card can no longer be edited because its state has changed.';
        setConflictAlert(msg);
        await fetchRateCardsAndCurrent();
        if (editingDraftId) {
          const refreshed = await fetchCardDetail(editingDraftId);
          if (refreshed) {
            changeSubView('detail');
          } else {
            changeSubView('list');
          }
        }
      } else {
        setDraftFieldErrors(parsed.fieldErrors);
        setDraftBandErrors(parsed.bandErrors);
        setDraftPackingErrors(parsed.packingErrors);
        setDraftGeneralError(parsed.generalError);
      }
    } finally {
      setDraftSaving(false);
    }
  };

  // Open Submit / Discard Modal
  const openActionDialog = (action, card) => {
    setFeedbackBanner('');
    setConflictAlert('');
    setActionReason('');
    setActionFieldErrors({});
    setActionGeneralError('');
    setActionDialog({ action, card });
  };

  const closeActionDialog = () => {
    setActionDialog(null);
    setActionReason('');
    setActionFieldErrors({});
    setActionGeneralError('');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionDialog) return;
    setActionFieldErrors({});
    setActionGeneralError('');
    setActionSubmitting(true);

    const { action, card } = actionDialog;
    try {
      if (action === 'submit') {
        const updated = await apiRequest(
          `/api/warehouse/rate-cards/${card.id}/submit/`,
          {
            method: 'POST',
            body: JSON.stringify({ reason: actionReason }),
          }
        );
        await fetchRateCardsAndCurrent();
        if (subView === 'editor') {
          changeSubView('detail');
        } else if (subView === 'detail') {
          await fetchCardDetail(updated.id);
        }
        setSelectedCardId(updated.id);
        setSelectedCard(updated);
        closeActionDialog();
        setFeedbackBanner(
          `Rate card v${updated.version} (#${updated.id}) submitted for admin approval. It is now read-only.`
        );
      } else if (action === 'discard') {
        const res = await apiRequest(
          `/api/warehouse/rate-cards/${card.id}/discard/`,
          {
            method: 'POST',
            body: JSON.stringify({ reason: actionReason }),
          }
        );
        if (selectedCardId === card.id) {
          setSelectedCardId(null);
          setSelectedCard(null);
        }
        await fetchRateCardsAndCurrent();
        changeSubView('list');
        closeActionDialog();
        setFeedbackBanner(
          `Draft rate card v${card.version} (#${res?.id ?? card.id}) discarded.`
        );
      }
    } catch (err) {
      if (err?.status === 401 && onUnauthorized) {
        await onUnauthorized();
        return;
      }
      const parsed = parseRateCardApiError(err, ['reason', 'size_bands']);
      if (err?.status === 409) {
        const msg =
          parsed.generalError ||
          err?.data?.detail ||
          'Rate card state has changed on the server.';
        closeActionDialog();
        setConflictAlert(msg);
        await fetchRateCardsAndCurrent();
        if (selectedCardId) {
          await fetchCardDetail(selectedCardId);
        }
      } else {
        setActionFieldErrors(parsed.fieldErrors);
        setActionGeneralError(parsed.generalError);
      }
    } finally {
      setActionSubmitting(false);
    }
  };

  const filteredCards = cards.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  const currentCard = currentInfo.current;
  const nextCard = currentInfo.next;
  const defaultEstimateDate =
    currentCard?.effective_from ||
    nextCard?.effective_from ||
    currentInfo.as_of_date ||
    '';

  return (
    <div data-testid="manager-rate-cards-section" className="space-y-6">
      {/* Section Header & Internal Sub-Navigation */}
      <div className="p-5 rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6058]">
            Warehouse Phase 3a • {warehouse?.name || 'Assigned Warehouse'}
          </span>
          <h2 className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[#1A2420]">
            Warehouse Rate Cards &amp; Read-Only Estimate Calculator
          </h2>
          <p className="text-xs text-[#6B6058]">
            Draft size-band rates and packing prices for {warehouse?.name || 'your warehouse'}, submit drafts for admin decision, and run read-only estimates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="manager-rate-cards-tab-list"
            onClick={() => changeSubView('list')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer ${
              subView === 'list' || subView === 'detail'
                ? 'bg-[#FA661C] text-white shadow-2xs'
                : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#1A2420]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rate Cards ({cardsCount})</span>
          </button>

          <button
            type="button"
            data-testid="manager-create-draft-rate-card-btn"
            onClick={openCreateDraftEditor}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer ${
              subView === 'editor' && !editingDraftId
                ? 'bg-[#FA661C] text-white shadow-2xs'
                : 'bg-[#FFF3EC] text-[#1A2420] border border-[#FA661C]/40 hover:bg-[#FA661C] hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Draft Rate Card</span>
          </button>

          <button
            type="button"
            data-testid="manager-rate-cards-tab-estimate"
            onClick={() => changeSubView('estimate')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer ${
              subView === 'estimate'
                ? 'bg-[#1A2420] text-white shadow-2xs'
                : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#1A2420]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Estimate Calculator</span>
          </button>
        </div>
      </div>

      {/* Server Confirmation Banner */}
      {feedbackBanner && (
        <div
          data-testid="manager-rate-card-feedback-banner"
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
            aria-label="Dismiss confirmation message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 409 Conflict Banner */}
      {conflictAlert && (
        <div
          data-testid="manager-rate-card-conflict-alert"
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

      {/* SUBVIEW 1: RATE CARDS LIST & CURRENT/NEXT APPROVED SUMMARY */}
      {subView === 'list' && (
        <div className="space-y-6">
          {/* Current & Next Approved Rate Cards Panel (from GET /api/warehouse/rate-cards/current/) */}
          <section
            data-testid="manager-current-rate-cards-panel"
            aria-label="Current and Next Approved Rate Cards"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* In Force Today */}
            <div
              data-testid="manager-current-card-box"
              className="p-5 rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#059669]" />
                  <div>
                    <span className="block text-[10px] font-black uppercase text-[#6B6058]">
                      In Force Today{' '}
                      {currentInfo.as_of_date
                        ? `(${currentInfo.as_of_date})`
                        : ''}
                    </span>
                    <h3 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                      Active Approved Rate Card
                    </h3>
                  </div>
                </div>
                {currentCard && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]">
                    In Force Today
                  </span>
                )}
              </div>

              {currentCard ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B6058]">Version</span>
                    <span
                      data-testid="manager-current-card-version"
                      className="font-mono font-extrabold text-[#1A2420]"
                    >
                      v{currentCard.version} (#{currentCard.id})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6058]">Effective Window</span>
                    <span className="font-mono font-semibold text-[#1A2420]">
                      {currentCard.effective_from} →{' '}
                      {currentCard.effective_to || 'Open-ended'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6058]">
                      Free Days / Minimum Charge
                    </span>
                    <span className="font-mono font-semibold text-[#1A2420]">
                      {currentCard.free_storage_days} days •{' '}
                      {currentCard.currency} {currentCard.minimum_charge}
                    </span>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      data-testid="manager-view-current-card-btn"
                      onClick={() => openViewDetail(currentCard)}
                      className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-[#F9F6F0] hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] cursor-pointer"
                    >
                      View Active Card v{currentCard.version}
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  data-testid="manager-no-current-card"
                  className="text-xs text-[#6B6058] py-2"
                >
                  No approved rate card is in force today.
                </p>
              )}
            </div>

            {/* Next Scheduled */}
            <div
              data-testid="manager-next-card-box"
              className="p-5 rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#1D4ED8]" />
                  <div>
                    <span className="block text-[10px] font-black uppercase text-[#6B6058]">
                      Upcoming Approved Schedule
                    </span>
                    <h3 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                      Next Scheduled Rate Card
                    </h3>
                  </div>
                </div>
                {nextCard && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]">
                    Starts {nextCard.effective_from}
                  </span>
                )}
              </div>

              {nextCard ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B6058]">Version</span>
                    <span
                      data-testid="manager-next-card-version"
                      className="font-mono font-extrabold text-[#1A2420]"
                    >
                      v{nextCard.version} (#{nextCard.id})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6058]">Effective Window</span>
                    <span className="font-mono font-semibold text-[#1A2420]">
                      {nextCard.effective_from} →{' '}
                      {nextCard.effective_to || 'Open-ended'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6058]">
                      Free Days / Minimum Charge
                    </span>
                    <span className="font-mono font-semibold text-[#1A2420]">
                      {nextCard.free_storage_days} days • {nextCard.currency}{' '}
                      {nextCard.minimum_charge}
                    </span>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      data-testid="manager-view-next-card-btn"
                      onClick={() => openViewDetail(nextCard)}
                      className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-[#F9F6F0] hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] cursor-pointer"
                    >
                      View Next Card v{nextCard.version}
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  data-testid="manager-no-next-card"
                  className="text-xs text-[#6B6058] py-2"
                >
                  No future approved rate card is scheduled.
                </p>
              )}
            </div>
          </section>

          {/* Rate Cards Table */}
          <section
            data-testid="manager-rate-cards-list-panel"
            className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden"
          >
            <div className="p-5 border-b border-[#EAE3DC] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                  Rate Card Versions — {warehouse?.name || 'Assigned Warehouse'}
                </h3>
                <p className="text-xs text-[#6B6058]">
                  Only draft cards can be edited, submitted, or discarded. Submitted, approved, rejected, and superseded versions are immutable.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <label
                  htmlFor="manager-rate-cards-status-filter"
                  className="text-xs font-bold text-[#6B6058]"
                >
                  Status:
                </label>
                <select
                  id="manager-rate-cards-status-filter"
                  data-testid="manager-rate-cards-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white font-semibold"
                >
                  <option value="">All Statuses</option>
                  {RATE_CARD_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {listError && (
              <div
                data-testid="manager-rate-cards-error"
                role="alert"
                className="m-5 p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
              >
                {listError}
              </div>
            )}

            {listLoading ? (
              <div className="p-8 text-center text-xs text-[#6B6058]">
                Loading rate cards from server...
              </div>
            ) : filteredCards.length === 0 ? (
              <div
                data-testid="manager-rate-cards-empty"
                className="p-8 text-center text-xs text-[#6B6058]"
              >
                No rate cards found for the selected status filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  data-testid="manager-rate-cards-table"
                  className="w-full text-left border-collapse text-xs"
                >
                  <caption className="sr-only">
                    Warehouse rate card versions and actions
                  </caption>
                  <thead>
                    <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                      <th scope="col" className="py-3 px-4">
                        Version
                      </th>
                      <th scope="col" className="py-3 px-4">
                        Status
                      </th>
                      <th scope="col" className="py-3 px-4">
                        Effective Dates
                      </th>
                      <th scope="col" className="py-3 px-4 text-right">
                        Free Days
                      </th>
                      <th scope="col" className="py-3 px-4 text-right">
                        Minimum Charge
                      </th>
                      <th scope="col" className="py-3 px-4">
                        Bands &amp; Packing
                      </th>
                      <th scope="col" className="py-3 px-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]">
                    {filteredCards.map((card) => {
                      const isCurrent =
                        currentCard && Number(currentCard.id) === Number(card.id);
                      const isNext =
                        nextCard && Number(nextCard.id) === Number(card.id);
                      return (
                        <tr
                          key={card.id}
                          data-testid={`manager-rate-card-row-${card.id}`}
                          className="hover:bg-[#FFF3EC]/20"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-extrabold text-[#1A2420] flex flex-wrap items-center gap-1.5">
                              <span>v{card.version}</span>
                              <span className="text-[11px] font-normal text-[#6B6058]">
                                (#{card.id})
                              </span>
                              {isCurrent && (
                                <span
                                  data-testid={`manager-rate-card-current-badge-${card.id}`}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]"
                                >
                                  In Force Today
                                </span>
                              )}
                              {isNext && (
                                <span
                                  data-testid={`manager-rate-card-next-badge-${card.id}`}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]"
                                >
                                  Next Scheduled
                                </span>
                              )}
                            </div>
                            {card.notes && (
                              <div className="text-[11px] text-[#6B6058] truncate max-w-xs mt-0.5">
                                {card.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              data-testid={`manager-rate-card-status-${card.id}`}
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getRateCardStatusBadgeClass(
                                card.status
                              )}`}
                            >
                              {RATE_CARD_STATUS_LABELS[card.status] || card.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#1A2420]">
                            <div>From: {card.effective_from}</div>
                            <div className="text-[#6B6058]">
                              To: {card.effective_to || 'Open-ended'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1A2420]">
                            {card.free_storage_days} days
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1A2420]">
                            {card.currency} {card.minimum_charge}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-[#6B6058]">
                            <div>
                              {card.size_bands?.length || 0} size band(s)
                            </div>
                            <div>
                              {card.packing_items?.length || 0} packing item(s)
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              <button
                                type="button"
                                data-testid={`manager-view-rate-card-btn-${card.id}`}
                                aria-label={`View Detail for rate card version ${card.version}`}
                                onClick={() => openViewDetail(card)}
                                className="px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Detail</span>
                              </button>

                              {card.status === 'draft' && (
                                <>
                                  <button
                                    type="button"
                                    data-testid={`manager-edit-rate-card-btn-${card.id}`}
                                    aria-label={`Edit Draft rate card version ${card.version}`}
                                    onClick={() => openEditDraftEditor(card)}
                                    className="px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-[#FA661C]" />
                                    <span>Edit Draft</span>
                                  </button>

                                  <button
                                    type="button"
                                    data-testid={`manager-submit-rate-card-btn-${card.id}`}
                                    aria-label={`Submit draft rate card version ${card.version}`}
                                    onClick={() => openActionDialog('submit', card)}
                                    className="px-2.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Submit</span>
                                  </button>

                                  <button
                                    type="button"
                                    data-testid={`manager-discard-rate-card-btn-${card.id}`}
                                    aria-label={`Discard draft rate card version ${card.version}`}
                                    onClick={() => openActionDialog('discard', card)}
                                    className="px-2.5 py-1.5 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Discard</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* SUBVIEW 2: DRAFT EDITOR (CREATE & EDIT WHILE DRAFT ONLY) */}
      {subView === 'editor' && (
        <section
          data-testid="manager-rate-card-editor-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                data-testid="draft-back-to-list-btn"
                onClick={() => changeSubView('list')}
                className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#FA661C]" />
                <span>Back to Rate Cards</span>
              </button>
              <h3
                id="draft-editor-heading"
                className="font-['Outfit'] font-extrabold text-base sm:text-lg text-[#1A2420]"
              >
                {editingDraftId
                  ? `Edit Draft Rate Card #${editingDraftId}${
                      selectedCard?.version ? ` (v${selectedCard.version})` : ''
                    }`
                  : 'Create New Draft Rate Card'}
              </h3>
            </div>

            {editingDraftId && selectedCard?.status === 'draft' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="editor-open-submit-btn"
                  onClick={() => openActionDialog('submit', selectedCard)}
                  className="px-3 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Draft</span>
                </button>
                <button
                  type="button"
                  data-testid="editor-open-discard-btn"
                  onClick={() => openActionDialog('discard', selectedCard)}
                  className="px-3 py-1.5 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard Draft</span>
                </button>
              </div>
            )}
          </div>

          {draftGeneralError && (
            <div
              data-testid="draft-general-error"
              role="alert"
              className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
            >
              {draftGeneralError}
            </div>
          )}

          <form
            onSubmit={handleSaveDraft}
            aria-labelledby="draft-editor-heading"
            data-testid="manager-rate-card-draft-form"
            className="space-y-6"
            noValidate
          >
            {/* Top-level Card Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="draft-effective-from"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Proposed Effective-From Date{' '}
                  <span aria-hidden="true" className="text-[#DC2626]">
                    *
                  </span>
                </label>
                <input
                  id="draft-effective-from"
                  name="effective_from"
                  data-testid="draft-effective-from-input"
                  type="date"
                  value={draftEffectiveFrom}
                  aria-invalid={Boolean(draftFieldErrors.effective_from)}
                  aria-describedby="draft-effective-from-help"
                  onChange={(e) => {
                    setDraftEffectiveFrom(e.target.value);
                    setDraftFieldErrors((fe) => ({ ...fe, effective_from: '' }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                />
                <p
                  id="draft-effective-from-help"
                  className="text-[11px] text-[#6B6058] mt-1"
                >
                  Proposed start date (`RateCardDraftSerializer.effective_from`). Admin approval requires a future non-overlapping date.
                </p>
                {draftFieldErrors.effective_from && (
                  <p
                    data-testid="draft-error-effective_from"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {draftFieldErrors.effective_from}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="draft-free-days"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Free Storage Days{' '}
                  <span aria-hidden="true" className="text-[#DC2626]">
                    *
                  </span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="draft-free-days"
                    name="free_storage_days"
                    data-testid="draft-free-days-input"
                    type="number"
                    min="0"
                    value={draftFreeDays}
                    aria-invalid={Boolean(draftFieldErrors.free_storage_days)}
                    onChange={(e) => {
                      setDraftFreeDays(e.target.value);
                      setDraftFieldErrors((fe) => ({
                        ...fe,
                        free_storage_days: '',
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                  />
                  <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                    days
                  </span>
                </div>
                {draftFieldErrors.free_storage_days && (
                  <p
                    data-testid="draft-error-free_storage_days"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {draftFieldErrors.free_storage_days}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="draft-minimum-charge"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Minimum Charge{' '}
                  <span aria-hidden="true" className="text-[#DC2626]">
                    *
                  </span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="draft-minimum-charge"
                    name="minimum_charge"
                    data-testid="draft-minimum-charge-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 10.00"
                    value={draftMinCharge}
                    aria-invalid={Boolean(draftFieldErrors.minimum_charge)}
                    onChange={(e) => {
                      setDraftMinCharge(e.target.value);
                      setDraftFieldErrors((fe) => ({
                        ...fe,
                        minimum_charge: '',
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                  />
                  <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                    INR
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6058] mt-1">
                  Applies to storage plus handling before packing.
                </p>
                {draftFieldErrors.minimum_charge && (
                  <p
                    data-testid="draft-error-minimum_charge"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {draftFieldErrors.minimum_charge}
                  </p>
                )}
              </div>
            </div>

            {/* Size Bands Fieldset */}
            <fieldset
              data-testid="draft-size-bands-section"
              className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-4"
            >
              <legend className="px-2 text-xs font-extrabold text-[#1A2420]">
                Size Bands (Maximum Envelopes &amp; Unit Rates)
              </legend>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#6B6058]">
                  A size band is a <strong>MAXIMUM envelope</strong> (maximum length, width, height in <code>cm</code> and maximum weight in <code>kg</code>). The server picks the smallest band that fits. At least one size band is required before submission.
                </p>
                <button
                  type="button"
                  data-testid="draft-add-band-btn"
                  onClick={handleAddBandRow}
                  className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FA661C]" />
                  <span>Add Size Band</span>
                </button>
              </div>

              {draftFieldErrors.size_bands && (
                <p
                  data-testid="draft-error-size_bands"
                  className="text-xs font-semibold text-[#DC2626]"
                >
                  {draftFieldErrors.size_bands}
                </p>
              )}

              {draftBands.length === 0 ? (
                <p
                  data-testid="draft-bands-empty"
                  className="text-xs text-[#6B6058] italic"
                >
                  No size bands added yet. Click &ldquo;Add Size Band&rdquo; to add a band.
                </p>
              ) : (
                <div className="space-y-3">
                  {draftBands.map((band, idx) => {
                    const bErr = draftBandErrors[idx] || {};
                    return (
                      <div
                        key={idx}
                        data-testid={`draft-band-row-${idx}`}
                        className="p-4 rounded-2xl border border-[#EAE3DC] bg-white space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-2">
                          <span className="text-xs font-extrabold text-[#1A2420]">
                            Size Band Row #{idx + 1}
                          </span>
                          <button
                            type="button"
                            data-testid={`draft-remove-band-btn-${idx}`}
                            aria-label={`Remove size band row ${idx + 1}`}
                            onClick={() => handleRemoveBandRow(idx)}
                            className="px-2.5 py-1 rounded-lg border border-[#FCA5A5] bg-[#FFF3F3] hover:bg-[#FEE2E2] text-[11px] font-bold text-[#DC2626] inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Band</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label
                              htmlFor={`draft-band-label-${idx}`}
                              className="block text-[11px] font-bold text-[#1A2420] mb-1"
                            >
                              Band Label <span aria-hidden="true" className="text-[#DC2626]">*</span>
                            </label>
                            <input
                              id={`draft-band-label-${idx}`}
                              name={`band_label_${idx}`}
                              data-testid={`draft-band-label-${idx}`}
                              type="text"
                              placeholder="e.g. Small"
                              value={band.label}
                              aria-invalid={Boolean(bErr.label)}
                              onChange={(e) =>
                                handleUpdateBandRow(idx, 'label', e.target.value)
                              }
                              className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs"
                            />
                            {bErr.label && (
                              <p
                                data-testid={`draft-band-error-label-${idx}`}
                                className="text-[11px] font-semibold text-[#DC2626] mt-1"
                              >
                                {bErr.label}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor={`draft-band-length-${idx}`}
                              className="block text-[11px] font-bold text-[#1A2420] mb-1"
                            >
                              Max Length <span aria-hidden="true" className="text-[#DC2626]">*</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`draft-band-length-${idx}`}
                                name={`band_max_length_cm_${idx}`}
                                data-testid={`draft-band-length-${idx}`}
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g. 10"
                                value={band.max_length_cm}
                                aria-invalid={Boolean(bErr.max_length_cm)}
                                onChange={(e) =>
                                  handleUpdateBandRow(
                                    idx,
                                    'max_length_cm',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                              />
                              <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                                cm
                              </span>
                            </div>
                            {bErr.max_length_cm && (
                              <p
                                data-testid={`draft-band-error-max_length_cm-${idx}`}
                                className="text-[11px] font-semibold text-[#DC2626] mt-1"
                              >
                                {bErr.max_length_cm}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor={`draft-band-width-${idx}`}
                              className="block text-[11px] font-bold text-[#1A2420] mb-1"
                            >
                              Max Width <span aria-hidden="true" className="text-[#DC2626]">*</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`draft-band-width-${idx}`}
                                name={`band_max_width_cm_${idx}`}
                                data-testid={`draft-band-width-${idx}`}
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g. 10"
                                value={band.max_width_cm}
                                aria-invalid={Boolean(bErr.max_width_cm)}
                                onChange={(e) =>
                                  handleUpdateBandRow(
                                    idx,
                                    'max_width_cm',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                              />
                              <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                                cm
                              </span>
                            </div>
                            {bErr.max_width_cm && (
                              <p
                                data-testid={`draft-band-error-max_width_cm-${idx}`}
                                className="text-[11px] font-semibold text-[#DC2626] mt-1"
                              >
                                {bErr.max_width_cm}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor={`draft-band-height-${idx}`}
                              className="block text-[11px] font-bold text-[#1A2420] mb-1"
                            >
                              Max Height <span aria-hidden="true" className="text-[#DC2626]">*</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`draft-band-height-${idx}`}
                                name={`band_max_height_cm_${idx}`}
                                data-testid={`draft-band-height-${idx}`}
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g. 10"
                                value={band.max_height_cm}
                                aria-invalid={Boolean(bErr.max_height_cm)}
                                onChange={(e) =>
                                  handleUpdateBandRow(
                                    idx,
                                    'max_height_cm',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                              />
                              <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                                cm
                              </span>
                            </div>
                            {bErr.max_height_cm && (
                              <p
                                data-testid={`draft-band-error-max_height_cm-${idx}`}
                                className="text-[11px] font-semibold text-[#DC2626] mt-1"
                              >
                                {bErr.max_height_cm}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label
                              htmlFor={`draft-band-weight-${idx}`}
                              className="block text-[11px] font-bold text-[#1A2420] mb-1"
                            >
                              Max Weight <span aria-hidden="true" className="text-[#DC2626]">*</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`draft-band-weight-${idx}`}
                                name={`band_max_weight_kg_${idx}`}
                                data-testid={`draft-band-weight-${idx}`}
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g. 2"
                                value={band.max_weight_kg}
                                aria-invalid={Boolean(bErr.max_weight_kg)}
                                onChange={(e) =>
                                  handleUpdateBandRow(
                                    idx,
                                    'max_weight_kg',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                              />
                              <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                                kg
                              </span>
                            </div>
                            {bErr.max_weight_kg && (
                              <p
                                data-testid={`draft-band-error-max_weight_kg-${idx}`}
                                className="text-[11px] font-semibold text-[#DC2626] mt-1"
                              >
                                {bErr.max_weight_kg}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor={`draft-band-storage-rate-${idx}`}
                              className="block text-[11px] font-bold text-[#1A2420] mb-1"
                            >
                              Storage Rate <span aria-hidden="true" className="text-[#DC2626]">*</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`draft-band-storage-rate-${idx}`}
                                name={`band_storage_rate_${idx}`}
                                data-testid={`draft-band-storage-rate-${idx}`}
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g. 1.005"
                                value={band.storage_rate_per_unit_per_day}
                                aria-invalid={Boolean(
                                  bErr.storage_rate_per_unit_per_day
                                )}
                                onChange={(e) =>
                                  handleUpdateBandRow(
                                    idx,
                                    'storage_rate_per_unit_per_day',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                              />
                              <span className="text-[11px] font-mono font-bold text-[#6B6058] shrink-0">
                                INR/unit/day
                              </span>
                            </div>
                            {bErr.storage_rate_per_unit_per_day && (
                              <p
                                data-testid={`draft-band-error-storage_rate_per_unit_per_day-${idx}`}
                                className="text-[11px] font-semibold text-[#DC2626] mt-1"
                              >
                                {bErr.storage_rate_per_unit_per_day}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor={`draft-band-handling-rate-${idx}`}
                              className="block text-[11px] font-bold text-[#1A2420] mb-1"
                            >
                              Handling Rate
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`draft-band-handling-rate-${idx}`}
                                name={`band_handling_rate_${idx}`}
                                data-testid={`draft-band-handling-rate-${idx}`}
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g. 2.005"
                                value={band.handling_rate_per_unit}
                                aria-invalid={Boolean(bErr.handling_rate_per_unit)}
                                onChange={(e) =>
                                  handleUpdateBandRow(
                                    idx,
                                    'handling_rate_per_unit',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                              />
                              <span className="text-[11px] font-mono font-bold text-[#6B6058] shrink-0">
                                INR/unit
                              </span>
                            </div>
                            {bErr.handling_rate_per_unit && (
                              <p
                                data-testid={`draft-band-error-handling_rate_per_unit-${idx}`}
                                className="text-[11px] font-semibold text-[#DC2626] mt-1"
                              >
                                {bErr.handling_rate_per_unit}
                              </p>
                            )}
                          </div>
                        </div>

                        {bErr._error && (
                          <p className="text-[11px] font-semibold text-[#DC2626]">
                            {bErr._error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </fieldset>

            {/* Packing Items Fieldset */}
            <fieldset
              data-testid="draft-packing-items-section"
              className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-4"
            >
              <legend className="px-2 text-xs font-extrabold text-[#1A2420]">
                Packing Materials &amp; Unit Prices
              </legend>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#6B6058]">
                  Define optional packing material prices (e.g. Box, Bubble Wrap) with their unit and price per unit in INR.
                </p>
                <button
                  type="button"
                  data-testid="draft-add-packing-btn"
                  onClick={handleAddPackingRow}
                  className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FA661C]" />
                  <span>Add Packing Item</span>
                </button>
              </div>

              {draftFieldErrors.packing_items && (
                <p
                  data-testid="draft-error-packing_items"
                  className="text-xs font-semibold text-[#DC2626]"
                >
                  {draftFieldErrors.packing_items}
                </p>
              )}

              {draftPackingItems.length === 0 ? (
                <p
                  data-testid="draft-packing-empty"
                  className="text-xs text-[#6B6058] italic"
                >
                  No packing items configured on this draft.
                </p>
              ) : (
                <div className="space-y-3">
                  {draftPackingItems.map((item, idx) => {
                    const pErr = draftPackingErrors[idx] || {};
                    return (
                      <div
                        key={idx}
                        data-testid={`draft-packing-row-${idx}`}
                        className="p-4 rounded-2xl border border-[#EAE3DC] bg-white space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-2">
                          <span className="text-xs font-extrabold text-[#1A2420]">
                            Packing Item Row #{idx + 1}
                          </span>
                          <button
                            type="button"
                            data-testid={`draft-remove-packing-btn-${idx}`}
                            aria-label={`Remove packing item row ${idx + 1}`}
                            onClick={() => handleRemovePackingRow(idx)}
                            className="px-2.5 py-1 rounded-lg border border-[#FCA5A5] bg-[#FFF3F3] hover:bg-[#FEE2E2] text-[11px] font-bold text-[#DC2626] inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Item</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label
                              htmlFor={`draft-packing-name-${idx}`}
                              className="block text-[11px] font-bold text-[#1A2420] mb-1"
                            >
                              Material Name <span aria-hidden="true" className="text-[#DC2626]">*</span>
                            </label>
                            <input
                              id={`draft-packing-name-${idx}`}
                              name={`packing_name_${idx}`}
                              data-testid={`draft-packing-name-${idx}`}
                              type="text"
                              placeholder="e.g. Corrugated Box"
                              value={item.name}
                              aria-invalid={Boolean(pErr.name)}
                              onChange={(e) =>
                                handleUpdatePackingRow(
                                  idx,
                                  'name',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs"
                            />
                            {pErr.name && (
                              <p
                                data-testid={`draft-packing-error-name-${idx}`}
                                className="text-[11px] font-semibold text-[#DC2626] mt-1"
                              >
                                {pErr.name}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor={`draft-packing-unit-${idx}`}
                              className="block text-[11px] font-bold text-[#1A2420] mb-1"
                            >
                              Unit <span aria-hidden="true" className="text-[#DC2626]">*</span>
                            </label>
                            <input
                              id={`draft-packing-unit-${idx}`}
                              name={`packing_unit_${idx}`}
                              data-testid={`draft-packing-unit-${idx}`}
                              type="text"
                              placeholder="e.g. each"
                              value={item.unit}
                              aria-invalid={Boolean(pErr.unit)}
                              onChange={(e) =>
                                handleUpdatePackingRow(
                                  idx,
                                  'unit',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                            />
                            {pErr.unit && (
                              <p
                                data-testid={`draft-packing-error-unit-${idx}`}
                                className="text-[11px] font-semibold text-[#DC2626] mt-1"
                              >
                                {pErr.unit}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor={`draft-packing-price-${idx}`}
                              className="block text-[11px] font-bold text-[#1A2420] mb-1"
                            >
                              Price per Unit <span aria-hidden="true" className="text-[#DC2626]">*</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`draft-packing-price-${idx}`}
                                name={`packing_price_${idx}`}
                                data-testid={`draft-packing-price-${idx}`}
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g. 1.005"
                                value={item.price_per_unit}
                                aria-invalid={Boolean(pErr.price_per_unit)}
                                onChange={(e) =>
                                  handleUpdatePackingRow(
                                    idx,
                                    'price_per_unit',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                              />
                              <span className="text-[11px] font-mono font-bold text-[#6B6058] shrink-0">
                                INR/{item.unit || 'unit'}
                              </span>
                            </div>
                            {pErr.price_per_unit && (
                              <p
                                data-testid={`draft-packing-error-price_per_unit-${idx}`}
                                className="text-[11px] font-semibold text-[#DC2626] mt-1"
                              >
                                {pErr.price_per_unit}
                              </p>
                            )}
                          </div>
                        </div>

                        {pErr._error && (
                          <p className="text-[11px] font-semibold text-[#DC2626]">
                            {pErr._error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </fieldset>

            {/* Notes & Mandatory Audit Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="draft-notes"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="draft-notes"
                  name="notes"
                  data-testid="draft-notes-input"
                  rows={2}
                  value={draftNotes}
                  onChange={(e) => {
                    setDraftNotes(e.target.value);
                    setDraftFieldErrors((fe) => ({ ...fe, notes: '' }));
                  }}
                  placeholder="Optional rate card notes..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                />
                {draftFieldErrors.notes && (
                  <p
                    data-testid="draft-error-notes"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {draftFieldErrors.notes}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="draft-reason"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Audit Reason <span aria-hidden="true" className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="draft-reason"
                  name="reason"
                  data-testid="draft-reason-input"
                  rows={2}
                  value={draftReason}
                  aria-invalid={Boolean(draftFieldErrors.reason)}
                  onChange={(e) => {
                    setDraftReason(e.target.value);
                    setDraftFieldErrors((fe) => ({ ...fe, reason: '' }));
                  }}
                  placeholder="Enter mandatory audit reason for creating or editing this draft..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                />
                {draftFieldErrors.reason && (
                  <p
                    data-testid="draft-error-reason"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {draftFieldErrors.reason}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => changeSubView('list')}
                className="px-4 py-2.5 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="draft-save-btn"
                disabled={draftSaving}
                className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                {draftSaving
                  ? 'Saving Draft...'
                  : editingDraftId
                  ? 'Save Draft Changes'
                  : 'Create Draft Rate Card'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* SUBVIEW 3: CARD DETAIL (READ-ONLY ONCE SUBMITTED, WITH VERSION HISTORY) */}
      {subView === 'detail' && (
        <section
          data-testid="manager-rate-card-detail-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs p-6 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <button
              type="button"
              data-testid="detail-back-to-list-btn"
              onClick={() => changeSubView('list')}
              className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#FA661C]" />
              <span>Back to Rate Cards</span>
            </button>

            {selectedCard && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  data-testid="detail-rate-card-status-badge"
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${getRateCardStatusBadgeClass(
                    selectedCard.status
                  )}`}
                >
                  {RATE_CARD_STATUS_LABELS[selectedCard.status] ||
                    selectedCard.status}
                </span>

                {selectedCard.status === 'draft' ? (
                  <>
                    <button
                      type="button"
                      data-testid="detail-edit-draft-btn"
                      onClick={() => openEditDraftEditor(selectedCard)}
                      className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#FA661C]" />
                      <span>Edit Draft</span>
                    </button>
                    <button
                      type="button"
                      data-testid="detail-submit-draft-btn"
                      onClick={() => openActionDialog('submit', selectedCard)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Draft</span>
                    </button>
                    <button
                      type="button"
                      data-testid="detail-discard-draft-btn"
                      onClick={() => openActionDialog('discard', selectedCard)}
                      className="px-3.5 py-1.5 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Discard Draft</span>
                    </button>
                  </>
                ) : (
                  <span
                    data-testid="detail-read-only-badge"
                    className="px-3 py-1 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] inline-flex items-center space-x-1"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Read-Only ({selectedCard.status})</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {detailLoading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading rate card details...
            </div>
          ) : detailError ? (
            <div
              data-testid="detail-rate-card-error"
              role="alert"
              className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
            >
              {detailError}
            </div>
          ) : selectedCard ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Version &amp; Effective Window
                  </span>
                  <div
                    data-testid="detail-rate-card-version"
                    className="font-mono font-extrabold text-base text-[#1A2420]"
                  >
                    v{selectedCard.version} (Card #{selectedCard.id})
                  </div>
                  <div>
                    <span className="text-[#6B6058]">Warehouse:</span>{' '}
                    <span className="font-bold text-[#1A2420]">
                      {selectedCard.warehouse_name}
                    </span>
                  </div>
                  <div className="font-mono">
                    <span className="text-[#6B6058]">Effective From:</span>{' '}
                    <span
                      data-testid="detail-effective-from"
                      className="font-bold text-[#1A2420]"
                    >
                      {selectedCard.effective_from}
                    </span>
                  </div>
                  <div className="font-mono">
                    <span className="text-[#6B6058]">Effective To:</span>{' '}
                    <span
                      data-testid="detail-effective-to"
                      className="font-bold text-[#1A2420]"
                    >
                      {selectedCard.effective_to || 'Open-ended'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Storage Terms &amp; Notes
                  </span>
                  <div>
                    <span className="text-[#6B6058]">Free Storage Days:</span>{' '}
                    <span
                      data-testid="detail-free-days"
                      className="font-mono font-bold text-[#1A2420]"
                    >
                      {selectedCard.free_storage_days} days
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B6058]">Minimum Charge:</span>{' '}
                    <span
                      data-testid="detail-minimum-charge"
                      className="font-mono font-bold text-[#1A2420]"
                    >
                      {selectedCard.currency} {selectedCard.minimum_charge}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B6058]">Created By:</span>{' '}
                    <span className="font-semibold text-[#1A2420]">
                      {selectedCard.created_by_username || '—'}
                    </span>
                  </div>
                  {selectedCard.submitted_by_username && (
                    <div>
                      <span className="text-[#6B6058]">Submitted By:</span>{' '}
                      <span className="font-semibold text-[#1A2420]">
                        {selectedCard.submitted_by_username} (
                        {formatDateTime(selectedCard.submitted_at)})
                      </span>
                    </div>
                  )}
                  {selectedCard.notes && (
                    <div>
                      <span className="text-[#6B6058]">Notes:</span>{' '}
                      <span
                        data-testid="detail-notes"
                        className="font-semibold text-[#1A2420]"
                      >
                        {selectedCard.notes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Decision & Reason Panel */}
                <div
                  data-testid="rate-card-decision-panel"
                  className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1.5"
                >
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Admin Decision &amp; Reason
                  </span>
                  {selectedCard.decided_by || selectedCard.decision_reason ? (
                    <>
                      <div>
                        <span className="text-[#6B6058]">Decision Status:</span>{' '}
                        <span className="font-extrabold uppercase text-[#1A2420]">
                          {RATE_CARD_STATUS_LABELS[selectedCard.status] ||
                            selectedCard.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B6058]">Decided By:</span>{' '}
                        <span
                          data-testid="detail-decided-by"
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
                          data-testid="detail-decision-reason"
                          className="font-bold text-[#1A2420]"
                        >
                          {selectedCard.decision_reason || '—'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[#6B6058]">
                      {selectedCard.status === 'submitted'
                        ? 'Submitted and awaiting admin approval or rejection.'
                        : 'Draft has not been submitted for decision yet.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Size Bands Table */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#1A2420]" />
                  <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                    Size Bands — Maximum Envelopes (
                    {selectedCard.size_bands?.length || 0})
                  </h4>
                </div>
                <p className="text-xs text-[#6B6058]">
                  Each size band is a maximum envelope (length, width, height in cm and weight in kg). The server selects the smallest band that fits.
                </p>
                {(selectedCard.size_bands || []).length === 0 ? (
                  <p className="text-xs text-[#6B6058] italic">
                    No size bands on this card.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                    <table
                      data-testid="detail-size-bands-table"
                      className="w-full text-left border-collapse text-xs"
                    >
                      <caption className="sr-only">
                        Size bands and rates for rate card version{' '}
                        {selectedCard.version}
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
                          <tr
                            key={band.id ?? idx}
                            data-testid={`detail-band-row-${band.id ?? idx}`}
                          >
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
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-[#1A2420]">
                              {selectedCard.currency}{' '}
                              {band.storage_rate_per_unit_per_day}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-[#1A2420]">
                              {selectedCard.currency}{' '}
                              {band.handling_rate_per_unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Packing Items Table */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-[#1A2420]" />
                  <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                    Packing Items ({selectedCard.packing_items?.length || 0})
                  </h4>
                </div>
                {(selectedCard.packing_items || []).length === 0 ? (
                  <p className="text-xs text-[#6B6058] italic">
                    No packing items configured on this card.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                    <table
                      data-testid="detail-packing-items-table"
                      className="w-full text-left border-collapse text-xs"
                    >
                      <caption className="sr-only">
                        Packing items for rate card version{' '}
                        {selectedCard.version}
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
                          <tr
                            key={item.id ?? idx}
                            data-testid={`detail-packing-row-${item.id ?? idx}`}
                          >
                            <td className="py-2.5 px-4 font-mono text-[#6B6058]">
                              #{item.id}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-[#1A2420]">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-4 font-mono">
                              {item.unit}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-[#1A2420]">
                              {selectedCard.currency} {item.price_per_unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Version History for the Warehouse */}
              <div
                data-testid="rate-card-version-history"
                className="space-y-2 border-t border-[#EAE3DC] pt-4"
              >
                <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                  Warehouse Rate Card Version History ({cards.length})
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                  <table className="w-full text-left border-collapse text-xs">
                    <caption className="sr-only">
                      Version history of rate cards for this warehouse
                    </caption>
                    <thead>
                      <tr className="bg-[#F9F6F0] border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                        <th scope="col" className="py-2.5 px-3">
                          Version
                        </th>
                        <th scope="col" className="py-2.5 px-3">
                          Status
                        </th>
                        <th scope="col" className="py-2.5 px-3">
                          Effective Dates
                        </th>
                        <th scope="col" className="py-2.5 px-3">
                          Decision / Notes
                        </th>
                        <th scope="col" className="py-2.5 px-3 text-right">
                          Inspect
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3DC]">
                      {cards.map((ver) => {
                        const isSelected =
                          Number(ver.id) === Number(selectedCard.id);
                        return (
                          <tr
                            key={ver.id}
                            data-testid={`version-history-row-${ver.id}`}
                            className={
                              isSelected ? 'bg-[#FFF3EC]/50 font-semibold' : ''
                            }
                          >
                            <td className="py-2.5 px-3 font-mono font-bold">
                              v{ver.version} (#{ver.id})
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getRateCardStatusBadgeClass(
                                  ver.status
                                )}`}
                              >
                                {RATE_CARD_STATUS_LABELS[ver.status] ||
                                  ver.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {ver.effective_from} →{' '}
                              {ver.effective_to || 'Open-ended'}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-[#6B6058]">
                              {ver.decision_reason || ver.notes || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isSelected ? (
                                <span className="text-[11px] font-bold text-[#6B6058]">
                                  Viewing
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  data-testid={`version-history-view-btn-${ver.id}`}
                                  onClick={() => openViewDetail(ver)}
                                  className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-[11px] font-bold text-[#1A2420] cursor-pointer"
                                >
                                  View v{ver.version}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* SUBVIEW 4: ESTIMATE CALCULATOR */}
      {subView === 'estimate' && (
        <RateCardEstimateCalculator
          isAdmin={false}
          rateCards={cards}
          defaultAsOfDate={defaultEstimateDate}
          onUnauthorized={onUnauthorized}
        />
      )}

      {/* NATIVE MODAL DIALOG: SUBMIT OR DISCARD DRAFT */}
      <dialog
        ref={dialogRef}
        aria-labelledby="manager-rate-card-action-dialog-title"
        data-testid={
          actionDialog?.action === 'discard'
            ? 'manager-discard-card-modal'
            : 'manager-submit-card-modal'
        }
        onClose={closeActionDialog}
        className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xl max-w-md w-full p-0 m-auto text-[#1A2420]"
      >
        {actionDialog && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3
                id="manager-rate-card-action-dialog-title"
                className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]"
              >
                {actionDialog.action === 'submit'
                  ? `Submit Draft Rate Card v${actionDialog.card?.version}`
                  : `Discard Draft Rate Card v${actionDialog.card?.version}`}
              </h3>
              <button
                type="button"
                onClick={closeActionDialog}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close confirmation dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B6058]">
              {actionDialog.action === 'submit'
                ? `Submitting rate card v${actionDialog.card?.version} (#${actionDialog.card?.id}, effective from ${actionDialog.card?.effective_from}) sends it to the admin queue and permanently locks it from further editing.`
                : `Discarding draft rate card v${actionDialog.card?.version} (#${actionDialog.card?.id}) records an audit log entry and permanently deletes this draft.`}
            </p>

            {(actionGeneralError || actionFieldErrors.size_bands) && (
              <div
                data-testid="manager-action-dialog-error"
                role="alert"
                className="p-3.5 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
              >
                {actionFieldErrors.size_bands || actionGeneralError}
              </div>
            )}

            <form
              onSubmit={handleActionSubmit}
              className="space-y-3"
              noValidate
            >
              <div>
                <label
                  htmlFor="manager-action-dialog-reason"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Audit Reason{' '}
                  <span aria-hidden="true" className="text-[#DC2626]">
                    *
                  </span>
                </label>
                <textarea
                  id="manager-action-dialog-reason"
                  name="reason"
                  data-testid={
                    actionDialog.action === 'discard'
                      ? 'manager-discard-reason-input'
                      : 'manager-submit-reason-input'
                  }
                  rows={2}
                  value={actionReason}
                  aria-invalid={Boolean(actionFieldErrors.reason)}
                  onChange={(e) => {
                    setActionReason(e.target.value);
                    setActionFieldErrors((fe) => ({ ...fe, reason: '' }));
                  }}
                  placeholder={
                    actionDialog.action === 'submit'
                      ? 'Enter reason for submitting this rate card...'
                      : 'Enter reason for discarding this draft...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                />
                {actionFieldErrors.reason && (
                  <p
                    data-testid={
                      actionDialog.action === 'discard'
                        ? 'manager-discard-error-reason'
                        : 'manager-submit-error-reason'
                    }
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {actionFieldErrors.reason}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeActionDialog}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid={
                    actionDialog.action === 'discard'
                      ? 'manager-confirm-discard-btn'
                      : 'manager-confirm-submit-btn'
                  }
                  disabled={actionSubmitting}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                    actionDialog.action === 'discard'
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                      : 'bg-[#059669] hover:bg-[#047857]'
                  }`}
                >
                  {actionSubmitting
                    ? 'Confirming...'
                    : actionDialog.action === 'submit'
                    ? 'Confirm Submit'
                    : 'Confirm Discard'}
                </button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </div>
  );
}
