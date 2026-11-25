import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManagerRateCardsSection from '../ManagerRateCardsSection';
import AdminRateCardsSection from '../AdminRateCardsSection';
import RateCardEstimateCalculator from '../RateCardEstimateCalculator';
import WarehouseModule from '../../admin/modules/WarehouseModule';
import { apiRequest, ApiError } from '../../../utils/api';

vi.mock('../../../utils/api', async () => {
  const actual = await vi.importActual('../../../utils/api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const mockWarehouse = {
  id: 20,
  name: 'Demo Warehouse',
  code: 'demo-warehouse',
};

const mockApprovedCardV4 = {
  id: 4,
  warehouse: 20,
  warehouse_name: 'Demo Warehouse',
  version: 4,
  status: 'approved',
  currency: 'INR',
  effective_from: '2026-11-30',
  effective_to: null,
  free_storage_days: 2,
  minimum_charge: '10.00',
  created_by: 211,
  created_by_username: 'demo_warehouse',
  submitted_by: 211,
  submitted_by_username: 'demo_warehouse',
  submitted_at: '2026-11-16T13:04:09.473455+05:30',
  decided_by: 79,
  decided_by_username: 'settlement_admin',
  decided_at: '2026-11-16T13:04:09.591963+05:30',
  decision_reason: 'LIVE PROOF, IGNORE supersede version one',
  notes: 'LIVE PROOF, IGNORE approved version two',
  size_bands: [
    {
      id: 7,
      label: 'LIVE PROOF, IGNORE Small',
      max_length_cm: '10.000',
      max_width_cm: '10.000',
      max_height_cm: '10.000',
      max_weight_kg: '2.000',
      storage_rate_per_unit_per_day: '1.0050',
      handling_rate_per_unit: '2.0050',
      display_order: 1,
    },
    {
      id: 8,
      label: 'LIVE PROOF, IGNORE Large',
      max_length_cm: '50.000',
      max_width_cm: '40.000',
      max_height_cm: '30.000',
      max_weight_kg: '10.000',
      storage_rate_per_unit_per_day: '3.0000',
      handling_rate_per_unit: '4.0000',
      display_order: 2,
    },
  ],
  packing_items: [
    {
      id: 7,
      name: 'LIVE PROOF, IGNORE Box',
      unit: 'each',
      price_per_unit: '1.0050',
    },
    {
      id: 8,
      name: 'LIVE PROOF, IGNORE Wrap',
      unit: 'each',
      price_per_unit: '0.5000',
    },
  ],
};

const mockSupersededCardV1 = {
  id: 1,
  warehouse: 20,
  warehouse_name: 'Demo Warehouse',
  version: 1,
  status: 'superseded',
  currency: 'INR',
  effective_from: '2026-11-20',
  effective_to: '2026-11-29',
  free_storage_days: 2,
  minimum_charge: '10.00',
  created_by: 211,
  created_by_username: 'demo_warehouse',
  submitted_by: 211,
  submitted_by_username: 'demo_warehouse',
  submitted_at: '2026-11-16T13:04:08.441872+05:30',
  decided_by: 79,
  decided_by_username: 'settlement_admin',
  decided_at: '2026-11-16T13:04:09.251231+05:30',
  decision_reason: 'LIVE PROOF, IGNORE approve version one',
  notes: 'LIVE PROOF, IGNORE edited draft',
  size_bands: [
    {
      id: 1,
      label: 'LIVE PROOF, IGNORE Small',
      max_length_cm: '10.000',
      max_width_cm: '10.000',
      max_height_cm: '10.000',
      max_weight_kg: '2.000',
      storage_rate_per_unit_per_day: '1.0050',
      handling_rate_per_unit: '2.0050',
      display_order: 1,
    },
  ],
  packing_items: [
    {
      id: 1,
      name: 'LIVE PROOF, IGNORE Box',
      unit: 'each',
      price_per_unit: '1.0050',
    },
  ],
};

const mockDraftCardV6 = {
  id: 6,
  warehouse: 20,
  warehouse_name: 'Demo Warehouse',
  version: 6,
  status: 'draft',
  currency: 'INR',
  effective_from: '2026-12-15',
  effective_to: null,
  free_storage_days: 3,
  minimum_charge: '12.00',
  created_by: 211,
  created_by_username: 'demo_warehouse',
  submitted_by: null,
  submitted_by_username: null,
  submitted_at: null,
  decided_by: null,
  decided_by_username: null,
  decided_at: null,
  decision_reason: '',
  notes: 'LIVE PROOF, IGNORE draft',
  size_bands: [
    {
      id: 11,
      label: 'Small',
      max_length_cm: '15.000',
      max_width_cm: '15.000',
      max_height_cm: '15.000',
      max_weight_kg: '3.000',
      storage_rate_per_unit_per_day: '1.5000',
      handling_rate_per_unit: '2.5000',
      display_order: 1,
    },
  ],
  packing_items: [
    {
      id: 11,
      name: 'Carton',
      unit: 'each',
      price_per_unit: '1.2500',
    },
  ],
};

const mockSubmittedCardV7 = {
  ...mockDraftCardV6,
  id: 7,
  version: 7,
  status: 'submitted',
  submitted_by: 211,
  submitted_by_username: 'demo_warehouse',
  submitted_at: '2026-11-19T10:00:00+05:30',
};

describe('Warehouse Rate Cards Screens (Phase 3a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Draft Editor: creates a draft with two bands and two packing items, edits it, and displays per-row server field errors under matching inputs without raw keys', async () => {
    apiRequest.mockImplementation(async (url, opts) => {
      if (url === '/api/warehouse/rate-cards/' && (!opts || !opts.method)) {
        return { count: 1, results: [mockApprovedCardV4] };
      }
      if (url === '/api/warehouse/rate-cards/current/') {
        return {
          as_of_date: '2026-11-19',
          current: null,
          next: mockApprovedCardV4,
        };
      }
      return {};
    });

    render(<ManagerRateCardsSection warehouse={mockWarehouse} />);

    expect(
      await screen.findByTestId('manager-next-card-version')
    ).toHaveTextContent('v4 (#4)');
    expect(screen.getByTestId('manager-no-current-card')).toHaveTextContent(
      'No approved rate card is in force today.'
    );

    // Open New Draft Editor
    fireEvent.click(screen.getByTestId('manager-create-draft-rate-card-btn'));
    expect(
      screen.getByTestId('manager-rate-card-draft-form')
    ).toBeInTheDocument();

    // Add a second size band and two packing items
    fireEvent.click(screen.getByTestId('draft-add-band-btn'));
    fireEvent.click(screen.getByTestId('draft-add-packing-btn'));
    fireEvent.click(screen.getByTestId('draft-add-packing-btn'));

    expect(screen.getByTestId('draft-band-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('draft-band-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('draft-packing-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('draft-packing-row-1')).toBeInTheDocument();

    // First test server 400 validation errors on fields and rows
    apiRequest.mockRejectedValueOnce(
      new ApiError('Validation error', 400, {
        effective_from: ['Enter a valid date.'],
        reason: ['A reason is required for every rate-card change.'],
        size_bands: [
          {},
          {
            label: ['This field may not be blank.'],
            max_length_cm: ['A valid number is required.'],
          },
        ],
        packing_items: [
          {
            price_per_unit: ['Ensure this value is greater than or equal to 0.'],
          },
          {},
        ],
      })
    );

    fireEvent.click(screen.getByTestId('draft-save-btn'));

    expect(
      await screen.findByTestId('draft-error-effective_from')
    ).toHaveTextContent('Enter a valid date.');
    expect(screen.getByTestId('draft-error-reason')).toHaveTextContent(
      'A reason is required for every rate-card change.'
    );
    expect(screen.getByTestId('draft-band-error-label-1')).toHaveTextContent(
      'This field may not be blank.'
    );
    expect(
      screen.getByTestId('draft-band-error-max_length_cm-1')
    ).toHaveTextContent('A valid number is required.');
    expect(
      screen.getByTestId('draft-packing-error-price_per_unit-0')
    ).toHaveTextContent('Ensure this value is greater than or equal to 0.');

    // Fill out valid draft with 2 bands and 2 packing items
    fireEvent.change(screen.getByTestId('draft-effective-from-input'), {
      target: { value: '2026-12-15' },
    });
    fireEvent.change(screen.getByTestId('draft-free-days-input'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByTestId('draft-minimum-charge-input'), {
      target: { value: '10.00' },
    });
    fireEvent.change(screen.getByTestId('draft-notes-input'), {
      target: { value: 'LIVE PROOF, IGNORE draft create' },
    });
    fireEvent.change(screen.getByTestId('draft-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE create reason' },
    });

    // Band 0 & Band 1
    fireEvent.change(screen.getByTestId('draft-band-label-0'), {
      target: { value: 'Small' },
    });
    fireEvent.change(screen.getByTestId('draft-band-length-0'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByTestId('draft-band-width-0'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByTestId('draft-band-height-0'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByTestId('draft-band-weight-0'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByTestId('draft-band-storage-rate-0'), {
      target: { value: '1.005' },
    });
    fireEvent.change(screen.getByTestId('draft-band-handling-rate-0'), {
      target: { value: '2.005' },
    });

    fireEvent.change(screen.getByTestId('draft-band-label-1'), {
      target: { value: 'Large' },
    });
    fireEvent.change(screen.getByTestId('draft-band-length-1'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByTestId('draft-band-width-1'), {
      target: { value: '40' },
    });
    fireEvent.change(screen.getByTestId('draft-band-height-1'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByTestId('draft-band-weight-1'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByTestId('draft-band-storage-rate-1'), {
      target: { value: '3.00' },
    });
    fireEvent.change(screen.getByTestId('draft-band-handling-rate-1'), {
      target: { value: '4.00' },
    });

    // Packing 0 & Packing 1
    fireEvent.change(screen.getByTestId('draft-packing-name-0'), {
      target: { value: 'LIVE PROOF, IGNORE Box' },
    });
    fireEvent.change(screen.getByTestId('draft-packing-unit-0'), {
      target: { value: 'each' },
    });
    fireEvent.change(screen.getByTestId('draft-packing-price-0'), {
      target: { value: '1.005' },
    });

    fireEvent.change(screen.getByTestId('draft-packing-name-1'), {
      target: { value: 'LIVE PROOF, IGNORE Wrap' },
    });
    fireEvent.change(screen.getByTestId('draft-packing-unit-1'), {
      target: { value: 'each' },
    });
    fireEvent.change(screen.getByTestId('draft-packing-price-1'), {
      target: { value: '0.50' },
    });

    const createdDraft = {
      ...mockDraftCardV6,
      minimum_charge: '10.00',
    };
    apiRequest.mockImplementation(async (url, opts) => {
      if (url === '/api/warehouse/rate-cards/' && opts?.method === 'POST') {
        return createdDraft;
      }
      if (url === '/api/warehouse/rate-cards/') {
        return { count: 2, results: [createdDraft, mockApprovedCardV4] };
      }
      if (url === '/api/warehouse/rate-cards/current/') {
        return {
          as_of_date: '2026-11-19',
          current: null,
          next: mockApprovedCardV4,
        };
      }
      if (url === '/api/warehouse/rate-cards/6/' && opts?.method === 'PATCH') {
        return { ...createdDraft, minimum_charge: '15.00' };
      }
      if (url === '/api/warehouse/rate-cards/6/') {
        return createdDraft;
      }
      return {};
    });

    fireEvent.click(screen.getByTestId('draft-save-btn'));

    expect(
      await screen.findByTestId('manager-rate-card-feedback-banner')
    ).toHaveTextContent('Draft rate card v6 (#6) created.');

    // Click Edit Draft from detail view and update minimum_charge to 15.00
    fireEvent.click(screen.getByTestId('detail-edit-draft-btn'));
    fireEvent.change(screen.getByTestId('draft-minimum-charge-input'), {
      target: { value: '15.00' },
    });
    fireEvent.change(screen.getByTestId('draft-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE edit minimum charge' },
    });
    fireEvent.click(screen.getByTestId('draft-save-btn'));

    expect(
      await screen.findByTestId('manager-rate-card-feedback-banner')
    ).toHaveTextContent('Draft rate card v6 (#6) updated.');
  });

  it('2. State-Dependent Actions: shows Edit/Submit/Discard only on draft cards, locks card as read-only after submit, and handles 409 conflict by refetching', async () => {
    let currentDraftState = { ...mockDraftCardV6 };

    apiRequest.mockImplementation(async (url, opts) => {
      if (url === '/api/warehouse/rate-cards/') {
        return {
          count: 3,
          results: [
            currentDraftState,
            mockApprovedCardV4,
            mockSupersededCardV1,
          ],
        };
      }
      if (url === '/api/warehouse/rate-cards/current/') {
        return {
          as_of_date: '2026-11-19',
          current: null,
          next: mockApprovedCardV4,
        };
      }
      if (url === '/api/warehouse/rate-cards/6/' && !opts?.method) {
        return currentDraftState;
      }
      if (
        url === '/api/warehouse/rate-cards/6/submit/' &&
        opts?.method === 'POST'
      ) {
        currentDraftState = {
          ...currentDraftState,
          status: 'submitted',
          submitted_by: 211,
          submitted_by_username: 'demo_warehouse',
          submitted_at: '2026-11-19T12:00:00+05:30',
        };
        return currentDraftState;
      }
      return {};
    });

    render(<ManagerRateCardsSection warehouse={mockWarehouse} />);

    // Wait for list to render
    expect(
      await screen.findByTestId('manager-rate-card-row-6')
    ).toBeInTheDocument();

    // Draft row 6 has Edit, Submit, Discard
    expect(
      screen.getByTestId('manager-edit-rate-card-btn-6')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('manager-submit-rate-card-btn-6')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('manager-discard-rate-card-btn-6')
    ).toBeInTheDocument();

    // Approved row 4 and Superseded row 1 do NOT have Edit, Submit, or Discard
    expect(
      screen.queryByTestId('manager-edit-rate-card-btn-4')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('manager-submit-rate-card-btn-4')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('manager-discard-rate-card-btn-4')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('manager-edit-rate-card-btn-1')
    ).not.toBeInTheDocument();

    // Click Submit on Draft #6 -> opens confirm dialog
    fireEvent.click(screen.getByTestId('manager-submit-rate-card-btn-6'));
    expect(
      screen.getByTestId('manager-submit-card-modal')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('manager-submit-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE submit draft' },
    });
    fireEvent.click(screen.getByTestId('manager-confirm-submit-btn'));

    expect(
      await screen.findByTestId('manager-rate-card-feedback-banner')
    ).toHaveTextContent(
      'Rate card v6 (#6) submitted for admin approval. It is now read-only.'
    );

    // Card #6 is now submitted -> Edit, Submit, Discard buttons are gone!
    expect(
      screen.queryByTestId('manager-edit-rate-card-btn-6')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('manager-submit-rate-card-btn-6')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('manager-discard-rate-card-btn-6')
    ).not.toBeInTheDocument();

    // View detail of submitted Card #6 -> shows Read-Only badge and no edit button
    fireEvent.click(screen.getByTestId('manager-view-rate-card-btn-6'));
    expect(
      await screen.findByTestId('detail-read-only-badge')
    ).toHaveTextContent('Read-Only (submitted)');
    expect(
      screen.queryByTestId('detail-edit-draft-btn')
    ).not.toBeInTheDocument();
  });

  it('3. Admin Decision Form & Two-Tab 409 Conflict: shows past-date 400 and overlapping-date 409 under the date input, approves/rejects with reason, and refetches on 409 state conflict', async () => {
    let cardState = { ...mockSubmittedCardV7 };

    apiRequest.mockImplementation(async (url, opts) => {
      if (url.startsWith('/api/admin/warehouse/rate-cards/?')) {
        if (url.includes('status=approved')) {
          return { count: 1, results: [mockApprovedCardV4] };
        }
        return { count: 1, results: [cardState] };
      }
      if (url === '/api/admin/warehouse/rate-cards/7/' && !opts?.method) {
        return cardState;
      }
      return {};
    });

    render(<AdminRateCardsSection warehouses={[mockWarehouse]} />);

    expect(
      await screen.findByTestId('admin-rate-card-row-7')
    ).toBeInTheDocument();

    // Open Review view for Card #7
    fireEvent.click(screen.getByTestId('admin-review-rate-card-btn-7'));
    expect(
      await screen.findByTestId('admin-rate-card-review-panel')
    ).toBeInTheDocument();
    // Shows comparison against current approved card v4
    expect(
      await screen.findByTestId('admin-comparison-card-version')
    ).toHaveTextContent('v4 (#4)');

    // Open Approve modal
    fireEvent.click(screen.getByTestId('admin-open-approve-btn'));
    expect(
      screen.getByTestId('admin-approve-rate-card-modal')
    ).toBeInTheDocument();

    // 1) Past date 400 error from server -> shown under effective-from date input
    apiRequest.mockRejectedValueOnce(
      new ApiError('Validation failed', 400, {
        effective_from: [
          'Approval requires an effective-from date after today.',
        ],
      })
    );
    fireEvent.change(screen.getByTestId('admin-approve-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE attempt past date' },
    });
    fireEvent.click(screen.getByTestId('admin-confirm-approve-btn'));

    expect(
      await screen.findByTestId('admin-approve-error-effective_from')
    ).toHaveTextContent(
      'Approval requires an effective-from date after today.'
    );

    // 2) Overlapping date 409 error from server -> shown under effective-from date input
    apiRequest.mockRejectedValueOnce(
      new ApiError('Conflict', 409, {
        detail:
          'The proposed effective date overlaps a later approved rate card.',
      })
    );
    fireEvent.click(screen.getByTestId('admin-confirm-approve-btn'));

    expect(
      await screen.findByTestId('admin-approve-error-effective_from')
    ).toHaveTextContent(
      'The proposed effective date overlaps a later approved rate card.'
    );

    // 3) Two-tab 409 state conflict (card was already rejected in another tab) -> closes modal, shows conflict alert, and refetches
    cardState = {
      ...cardState,
      status: 'rejected',
      decided_by: 79,
      decided_by_username: 'settlement_admin',
      decision_reason: 'LIVE PROOF, IGNORE decided in tab 1',
    };
    apiRequest.mockRejectedValueOnce(
      new ApiError('Conflict', 409, {
        detail: 'Only submitted rate cards can be approved or rejected.',
      })
    );
    fireEvent.click(screen.getByTestId('admin-confirm-approve-btn'));

    expect(
      await screen.findByTestId('admin-rate-card-conflict-alert')
    ).toHaveTextContent(
      'Only submitted rate cards can be approved or rejected.'
    );
    await waitFor(() => {
      expect(screen.getByTestId('admin-review-status-badge')).toHaveTextContent(
        'Rejected'
      );
    });
    expect(
      screen.queryByTestId('admin-open-approve-btn')
    ).not.toBeInTheDocument();
  });

  it('4. Estimate View: renders exact server breakdown strings without browser math, and displays 400 (no band fits) and 404 (no approved card) plainly', async () => {
    const serverEstimateResponse = {
      estimate: true,
      note: 'Estimate only; nothing was charged or saved.',
      rate_card_id: 1,
      version: 1,
      currency: 'INR',
      as_of_date: '2026-11-20',
      band: {
        id: 1,
        label: 'LIVE PROOF, IGNORE Small',
      },
      storage_charge: '4.02',
      handling_charge: '4.01',
      packing_charge: '1.01',
      packing: [
        {
          item_id: 1,
          name: 'LIVE PROOF, IGNORE Box',
          quantity: 1,
          amount: '1.01',
        },
      ],
      free_days_applied: 2,
      billable_storage_days: 2,
      minimum_charge_applied: '1.97',
      total: '11.01',
    };

    render(
      <RateCardEstimateCalculator
        isAdmin={true}
        warehouses={[mockWarehouse]}
        rateCards={[mockSupersededCardV1]}
        defaultWarehouseId="20"
        defaultAsOfDate="2026-11-20"
      />
    );

    expect(screen.getByTestId('estimate-only-disclaimer')).toHaveTextContent(
      'Estimate only. Nothing is charged or saved.'
    );

    fireEvent.change(screen.getByTestId('estimate-length-input'), {
      target: { value: '8' },
    });
    fireEvent.change(screen.getByTestId('estimate-width-input'), {
      target: { value: '8' },
    });
    fireEvent.change(screen.getByTestId('estimate-height-input'), {
      target: { value: '8' },
    });
    fireEvent.change(screen.getByTestId('estimate-weight-input'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('estimate-quantity-input'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByTestId('estimate-storage-days-input'), {
      target: { value: '4' },
    });

    // Quick-add packing item #1
    fireEvent.click(screen.getByTestId('estimate-quick-add-packing-1'));

    apiRequest.mockResolvedValueOnce(serverEstimateResponse);
    fireEvent.click(screen.getByTestId('estimate-submit-btn'));

    expect(
      await screen.findByTestId('estimate-result-panel')
    ).toBeInTheDocument();
    expect(screen.getByTestId('estimate-flag-badge')).toHaveTextContent(
      'estimate: true'
    );
    expect(screen.getByTestId('estimate-server-note')).toHaveTextContent(
      'Estimate only; nothing was charged or saved.'
    );
    expect(screen.getByTestId('estimate-card-version')).toHaveTextContent(
      'v1 (Card #1)'
    );
    expect(screen.getByTestId('estimate-band-used')).toHaveTextContent(
      'LIVE PROOF, IGNORE Small'
    );
    expect(screen.getByTestId('estimate-storage-charge')).toHaveTextContent(
      'INR 4.02'
    );
    expect(screen.getByTestId('estimate-handling-charge')).toHaveTextContent(
      'INR 4.01'
    );
    expect(screen.getByTestId('estimate-packing-charge')).toHaveTextContent(
      'INR 1.01'
    );
    expect(screen.getByTestId('estimate-free-days-applied')).toHaveTextContent(
      '2 days'
    );
    expect(screen.getByTestId('estimate-minimum-applied')).toHaveTextContent(
      'INR 1.97'
    );
    expect(screen.getByTestId('estimate-total')).toHaveTextContent('INR 11.01');

    // Test 400 (no band fits)
    apiRequest.mockRejectedValueOnce(
      new ApiError('Bad Request', 400, {
        detail: [
          'No approved size band fits the supplied dimensions and weight.',
        ],
      })
    );
    fireEvent.change(screen.getByTestId('estimate-length-input'), {
      target: { value: '500' },
    });
    fireEvent.click(screen.getByTestId('estimate-submit-btn'));

    expect(
      await screen.findByTestId('estimate-error-alert')
    ).toHaveTextContent(
      'No approved size band fits the supplied dimensions and weight.'
    );

    // Test 404 (no approved card covers requested date)
    apiRequest.mockRejectedValueOnce(
      new ApiError('Not Found', 404, {
        detail: 'No approved rate card covers the requested date.',
      })
    );
    fireEvent.change(screen.getByTestId('estimate-as-of-date-input'), {
      target: { value: '2025-01-01' },
    });
    fireEvent.click(screen.getByTestId('estimate-submit-btn'));

    expect(
      await screen.findByTestId('estimate-error-alert')
    ).toHaveTextContent('No approved rate card covers the requested date.');
  });

  it('5. WarehouseModule Audit Integration: links from Rate Cards tab to Audit Log filtered to object_type=RateCard and preserves rate_card_rejectd verbatim', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url.startsWith('/api/admin/warehouse/warehouses/')) {
        return { count: 1, results: [mockWarehouse] };
      }
      if (url.startsWith('/api/admin/warehouse/managers/')) {
        return { count: 0, results: [] };
      }
      if (url.startsWith('/api/admin/warehouse/rate-cards/')) {
        return { count: 1, results: [mockApprovedCardV4] };
      }
      if (url.startsWith('/api/admin/warehouse/audit/')) {
        return {
          count: 2,
          results: [
            {
              id: 225,
              actor: 79,
              actor_username: 'settlement_admin',
              occurred_at: '2026-11-16T13:04:08.848003+05:30',
              action: 'rate_card_rejectd',
              object_type: 'RateCard',
              object_id: 2,
              old_values: { status: 'submitted' },
              new_values: { status: 'rejected' },
              reason: 'LIVE PROOF, IGNORE admin rejection',
            },
            {
              id: 238,
              actor: 79,
              actor_username: 'settlement_admin',
              occurred_at: '2026-11-16T13:06:43.892746+05:30',
              action: 'rate_card_rejected',
              object_type: 'RateCard',
              object_id: 5,
              old_values: { status: 'submitted' },
              new_values: { status: 'rejected' },
              reason: 'LIVE PROOF, IGNORE overlapping approval refused and closed',
            },
          ],
        };
      }
      return { count: 0, results: [] };
    });

    render(<WarehouseModule initialTab="rate-cards" />);

    expect(
      await screen.findByTestId('admin-rate-cards-section')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('admin-view-rate-card-audit-btn'));

    expect(await screen.findByTestId('audit-panel')).toBeInTheDocument();
    expect(screen.getByTestId('audit-filter-object-type')).toHaveValue(
      'RateCard'
    );
    const row225 = await screen.findByTestId('audit-row-225');
    expect(within(row225).getByText('rate_card_rejectd')).toBeInTheDocument();
  });

  it('6. Draft Discard & Manager 409 Conflict: discards a draft via confirm dialog with reason, and refetches on 409 state conflict', async () => {
    let cardsList = [{ ...mockDraftCardV6 }, mockApprovedCardV4];

    apiRequest.mockImplementation(async (url, opts) => {
      if (url === '/api/warehouse/rate-cards/') {
        return { count: cardsList.length, results: cardsList };
      }
      if (url === '/api/warehouse/rate-cards/current/') {
        return {
          as_of_date: '2026-11-19',
          current: null,
          next: mockApprovedCardV4,
        };
      }
      if (
        url === '/api/warehouse/rate-cards/6/discard/' &&
        opts?.method === 'POST'
      ) {
        cardsList = [mockApprovedCardV4];
        return { id: 6, status: 'discarded' };
      }
      return {};
    });

    render(<ManagerRateCardsSection warehouse={mockWarehouse} />);

    expect(
      await screen.findByTestId('manager-rate-card-row-6')
    ).toBeInTheDocument();

    // Open Discard modal
    fireEvent.click(screen.getByTestId('manager-discard-rate-card-btn-6'));
    expect(
      screen.getByTestId('manager-discard-card-modal')
    ).toBeInTheDocument();

    // First test 409 conflict on discard
    apiRequest.mockRejectedValueOnce(
      new ApiError('Conflict', 409, {
        detail: 'Only draft rate cards can be discarded.',
      })
    );
    fireEvent.change(screen.getByTestId('manager-discard-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE discard' },
    });
    fireEvent.click(screen.getByTestId('manager-confirm-discard-btn'));

    expect(
      await screen.findByTestId('manager-rate-card-conflict-alert')
    ).toHaveTextContent('Only draft rate cards can be discarded.');

    // Now test successful discard
    fireEvent.click(screen.getByTestId('manager-discard-rate-card-btn-6'));
    fireEvent.change(screen.getByTestId('manager-discard-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE discard draft' },
    });
    fireEvent.click(screen.getByTestId('manager-confirm-discard-btn'));

    expect(
      await screen.findByTestId('manager-rate-card-feedback-banner')
    ).toHaveTextContent('Draft rate card v6 (#6) discarded.');
    expect(
      screen.queryByTestId('manager-rate-card-row-6')
    ).not.toBeInTheDocument();
  });

  it('7. Honest Error & Forbidden States: shows clear error messages with zero fake rows when backend is stopped or returns 403', async () => {
    // 1) Backend stopped on Manager Rate Cards
    apiRequest.mockRejectedValue(
      new ApiError('Network request failed', 0, null)
    );
    const { unmount } = render(
      <ManagerRateCardsSection warehouse={mockWarehouse} />
    );

    expect(
      await screen.findByTestId('manager-rate-cards-error')
    ).toHaveTextContent('Network request failed');
    expect(
      screen.getByTestId('manager-rate-cards-empty')
    ).toBeInTheDocument();
    unmount();

    // 2) 403 Forbidden on Admin Rate Cards
    apiRequest.mockRejectedValue(
      new ApiError('Forbidden', 403, {
        detail: 'You do not have permission to perform this action.',
      })
    );
    render(<AdminRateCardsSection warehouses={[mockWarehouse]} />);

    expect(
      await screen.findByTestId('admin-rate-cards-forbidden')
    ).toHaveTextContent('You do not have permission to perform this action.');
    expect(
      screen.queryByTestId('admin-rate-cards-table')
    ).not.toBeInTheDocument();
  });
});
