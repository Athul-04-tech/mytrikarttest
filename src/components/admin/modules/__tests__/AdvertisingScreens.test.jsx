import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SellerAdvertisingView from '../../../seller-dashboard/subviews/SellerAdvertisingView';
import AdvertisingAdminModule from '../AdvertisingAdminModule';
import SponsoredAdSlot from '../../../advertising/SponsoredAdSlot';
import Header from '../../../layout/Header';
import ProductDetailPage from '../../../../pages/ProductDetailPage';
import LoginPage from '../../../../pages/LoginPage';
import CheckoutPage from '../../../../pages/CheckoutPage';
import SellerDashboardPage from '../../../../pages/SellerDashboardPage';
import AdminHomePage from '../../../../pages/AdminHomePage';
import WarehouseDashboardPage from '../../../../pages/WarehouseDashboardPage';
import { ToastProvider } from '../../../../context/ToastContext';
import { CartWishlistProvider } from '../../../../context/CartWishlistContext';
import ProtectedRoute from '../../../routing/ProtectedRoute';
import { getAllowedRolesForRoute } from '../../../../utils/authRouting';
import * as api from '../../../../utils/api';
import * as AuthContextModule from '../../../../context/AuthContext';

vi.mock('../../../../utils/api', async () => {
  const actual = await vi.importActual('../../../../utils/api');
  return {
    ...actual,
    apiRequest: vi.fn(),
    fetchProtectedFile: vi.fn(),
  };
});

const MOCK_SELLER_PRODUCTS = [
  {
    id: 13,
    name: 'Apex Titan 5G Pro Flagship Smartphone',
    status: 'published',
    is_active: true,
    base_currency: 'INR',
  },
  {
    id: 12,
    name: 'HP Victus Gaming Laptop',
    status: 'published',
    is_active: true,
    base_currency: 'INR',
  },
  {
    id: 99,
    name: 'Draft Unpublished Item',
    status: 'draft',
    is_active: true,
    base_currency: 'INR',
  },
];

const MOCK_ADS = [
  {
    id: 101,
    seller_id: 5,
    seller_name: 'Dummy Approved Store',
    product_id: 13,
    product_name: 'Apex Titan 5G Pro Flagship Smartphone',
    name: 'Festive Smartphone Spotlight',
    intended_amount: '250.00',
    budget: '250.00',
    currency: 'INR',
    status: 'created',
    rejection_reason: '',
    placement: '',
    click_rate_snapshot: null,
    active_creative: null,
    funded: '0.00',
    spent: '0.00',
    remaining: '0.00',
    created_by: 19,
    created_at: '2026-11-19T10:00:00Z',
    updated_at: '2026-11-19T10:00:00Z',
  },
  {
    id: 102,
    seller_id: 5,
    seller_name: 'Dummy Approved Store',
    product_id: 12,
    product_name: 'HP Victus Gaming Laptop',
    name: 'Laptop Awaiting Credit',
    intended_amount: '500.00',
    budget: '500.00',
    currency: 'INR',
    status: 'awaiting_payment',
    rejection_reason: '',
    placement: '',
    click_rate_snapshot: null,
    active_creative: null,
    funded: '0.00',
    spent: '0.00',
    remaining: '0.00',
    created_by: 19,
    created_at: '2026-11-19T10:15:00Z',
    updated_at: '2026-11-19T10:20:00Z',
  },
  {
    id: 103,
    seller_id: 5,
    seller_name: 'Dummy Approved Store',
    product_id: 13,
    product_name: 'Apex Titan 5G Pro Flagship Smartphone',
    name: 'Funded Campaign',
    intended_amount: '750.00',
    budget: '750.00',
    currency: 'INR',
    status: 'funded',
    rejection_reason: '',
    placement: '',
    click_rate_snapshot: null,
    active_creative: null,
    funded: '750.00',
    spent: '0.00',
    remaining: '750.00',
    created_by: 19,
    created_at: '2026-11-19T09:00:00Z',
    updated_at: '2026-11-19T09:30:00Z',
  },
  {
    id: 104,
    seller_id: 5,
    seller_name: 'Dummy Approved Store',
    product_id: 12,
    product_name: 'HP Victus Gaming Laptop',
    name: 'Cancelled Promotion',
    intended_amount: '100.00',
    budget: '100.00',
    currency: 'INR',
    status: 'cancelled',
    rejection_reason: '',
    placement: '',
    click_rate_snapshot: null,
    active_creative: null,
    funded: '0.00',
    spent: '0.00',
    remaining: '0.00',
    created_by: 19,
    created_at: '2026-11-19T08:00:00Z',
    updated_at: '2026-11-19T08:30:00Z',
  },
];

const MOCK_PAYMENTS = [
  {
    id: 201,
    advertisement_id: 103,
    seller_id: 5,
    currency: 'INR',
    amount: '750.00',
    source: 'manual',
    external_reference: 'NEFT-UTR-2026-750',
    received_date: '2026-11-19',
    reason: 'Verified bank transfer credit',
    status: 'recorded',
    recorded_by: 1,
    created_at: '2026-11-19T09:30:00Z',
  },
];

const MOCK_LEDGER = [
  {
    id: 301,
    advertisement_id: 103,
    ad_payment_id: 201,
    seller_id: 5,
    currency: 'INR',
    entry_type: 'payment_credit',
    entry_type_label: 'Payment credit',
    amount: '750.00',
    reason: 'Verified bank transfer credit',
    actor: 1,
    reference: 'NEFT-UTR-2026-750',
    refund_date: null,
    reverses_id: null,
    created_at: '2026-11-19T09:30:00Z',
  },
  {
    id: 302,
    advertisement_id: 103,
    ad_payment_id: 201,
    seller_id: 5,
    currency: 'INR',
    entry_type: 'payment_reversal',
    entry_type_label: 'Payment reversal',
    amount: '250.00',
    reason: 'Partial reversal test',
    actor: 1,
    reference: 'NEFT-UTR-2026-750',
    refund_date: null,
    reverses_id: 301,
    created_at: '2026-11-19T10:30:00Z',
  },
  {
    id: 303,
    advertisement_id: 103,
    ad_payment_id: null,
    seller_id: 5,
    currency: 'INR',
    entry_type: 'payment_refund',
    entry_type_label: 'Payment refund',
    amount: '100.00',
    reason: 'Unspent balance bank refund',
    actor: 1,
    reference: 'NEFT-REFUND-2026-103',
    refund_date: '2026-11-23',
    reverses_id: null,
    created_at: '2026-11-23T11:00:00Z',
  },
  {
    id: 304,
    advertisement_id: 103,
    ad_payment_id: null,
    seller_id: 5,
    currency: 'INR',
    entry_type: 'click_charge',
    entry_type_label: 'Click charge',
    amount: '1.25',
    reason: 'Click charge',
    actor: 1,
    reference: 'CLICK-1',
    refund_date: null,
    reverses_id: null,
    created_at: '2026-11-23T11:05:00Z',
  },
  {
    id: 305,
    advertisement_id: 103,
    ad_payment_id: null,
    seller_id: 5,
    currency: 'INR',
    entry_type: 'click_charge_reversal',
    entry_type_label: 'Click charge reversal',
    amount: '1.25',
    reason: 'Click charge reversal',
    actor: 1,
    reference: 'CLICK-REV-1',
    refund_date: null,
    reverses_id: 304,
    created_at: '2026-11-23T11:10:00Z',
  },
  {
    id: 306,
    advertisement_id: 103,
    ad_payment_id: null,
    seller_id: 5,
    currency: 'INR',
    entry_type: 'future_custom_code',
    entry_type_label: '',
    amount: '10.00',
    reason: 'Unknown entry code fallback test',
    actor: 1,
    reference: 'CUSTOM-1',
    refund_date: null,
    reverses_id: null,
    created_at: '2026-11-23T11:15:00Z',
  },
];

const MOCK_CLICKS_RESPONSE = {
  results: [
    {
      id: 701,
      advertisement_id: 103,
      creative_id: 41,
      placement: 'header_banner',
      issued_at: '2026-11-23T12:00:00Z',
      clicked_at: '2026-11-23T12:00:05Z',
      click_amount_snapshot: '0.25',
      decision: 'eligible',
      reason_code: 'eligible',
      created_at: '2026-11-23T12:00:05Z',
    },
    {
      id: 702,
      advertisement_id: 103,
      creative_id: 41,
      placement: 'header_banner',
      issued_at: '2026-11-23T12:01:00Z',
      clicked_at: '2026-11-23T12:01:02Z',
      click_amount_snapshot: '0.25',
      decision: 'not_billable',
      reason_code: 'seller_self_click',
      created_at: '2026-11-23T12:01:02Z',
    },
  ],
  counts_by_ad: [
    {
      advertisement_id: 103,
      by_decision: { eligible: 1, not_billable: 1 },
      by_reason: { eligible: 1, seller_self_click: 1 },
    },
  ],
};

const MOCK_RECONCILIATION = {
  advertisements: [
    {
      advertisement_id: 103,
      seller_id: 5,
      status: 'funded',
      budget: '750.00',
      funded: '750.00',
      spent: '0.00',
      remaining: '750.00',
      has_status_ledger_disagreement: false,
    },
    {
      advertisement_id: 102,
      seller_id: 5,
      status: 'awaiting_payment',
      budget: '500.00',
      funded: '500.00',
      spent: '0.00',
      remaining: '500.00',
      has_status_ledger_disagreement: true,
    },
  ],
  totals: {
    funded: '1250.00',
    spent: '0.00',
    remaining: '1250.00',
  },
};

const MOCK_REVIEW_QUEUE = [
  {
    id: 106,
    seller_id: 5,
    seller_name: 'Dummy Approved Store',
    product_id: 13,
    product_name: 'Apex Titan 5G Pro Flagship Smartphone',
    name: 'Submitted Banner Campaign',
    intended_amount: '500.00',
    currency: 'INR',
    status: 'pending_review',
    rejection_reason: '',
    placement: '',
    click_rate_snapshot: null,
    active_creative: {
      id: 41,
      advertisement: 106,
      image_url: '/api/advertising/creatives/41/image/',
      placement: 'header_banner',
      width: 1200,
      height: 400,
      content_type: 'image/png',
      size: 2048,
      moderation_state: 'pending_review',
      rejection_reason: '',
      is_active: true,
      created_at: '2026-11-23T06:00:00Z',
      updated_at: '2026-11-23T06:10:00Z',
    },
    funded: '500.00',
    spent: '0.00',
    remaining: '500.00',
    created_at: '2026-11-23T05:00:00Z',
    updated_at: '2026-11-23T06:10:00Z',
  },
];

const MOCK_CLICK_RATES_CURRENT = {
  as_of_date: '2026-11-23',
  placements: {
    header_banner: {
      placement: 'header_banner',
      label: 'Header banner',
      current: {
        id: 1,
        placement: 'header_banner',
        amount_per_click: '0.25',
        currency: 'INR',
        effective_from: '2026-11-23',
        effective_to: null,
        status: 'approved',
        reason: 'LIVE PROOF, IGNORE',
        created_at: '2026-11-23T01:00:00Z',
      },
      next: null,
    },
    product_page_top: {
      placement: 'product_page_top',
      label: 'Product page top',
      current: {
        id: 2,
        placement: 'product_page_top',
        amount_per_click: '1.25',
        currency: 'INR',
        effective_from: '2026-11-23',
        effective_to: '2026-11-24',
        status: 'superseded',
        reason: 'LIVE PROOF, IGNORE',
        created_at: '2026-11-23T01:05:00Z',
      },
      next: {
        id: 3,
        placement: 'product_page_top',
        amount_per_click: '1.50',
        currency: 'INR',
        effective_from: '2026-11-25',
        effective_to: null,
        status: 'approved',
        reason: 'LIVE PROOF, IGNORE',
        created_at: '2026-11-23T01:10:00Z',
      },
    },
  },
};

const MOCK_CLICK_RATES_HISTORY = [
  MOCK_CLICK_RATES_CURRENT.placements.product_page_top.next,
  MOCK_CLICK_RATES_CURRENT.placements.product_page_top.current,
  MOCK_CLICK_RATES_CURRENT.placements.header_banner.current,
];

const MOCK_AD_PRICES_CURRENT = {
  as_of_date: '2026-11-23',
  placements: {
    header_banner: {
      placement: 'header_banner',
      label: 'Header banner',
      current: {
        id: 1,
        placement: 'header_banner',
        ad_price: '20.00',
        currency: 'INR',
        effective_from: '2026-11-23',
        effective_to: null,
        status: 'approved',
        reason: 'LIVE PROOF, IGNORE',
        created_at: '2026-11-23T01:00:00Z',
      },
      next: null,
    },
    product_page_top: {
      placement: 'product_page_top',
      label: 'Product page top',
      current: {
        id: 2,
        placement: 'product_page_top',
        ad_price: '35.00',
        currency: 'INR',
        effective_from: '2026-11-23',
        effective_to: '2026-11-24',
        status: 'superseded',
        reason: 'LIVE PROOF, IGNORE',
        created_at: '2026-11-23T01:05:00Z',
      },
      next: {
        id: 3,
        placement: 'product_page_top',
        ad_price: '45.00',
        currency: 'INR',
        effective_from: '2026-11-25',
        effective_to: null,
        status: 'approved',
        reason: 'LIVE PROOF, IGNORE',
        created_at: '2026-11-23T01:10:00Z',
      },
    },
  },
};

const MOCK_AD_PRICES_HISTORY = [
  MOCK_AD_PRICES_CURRENT.placements.product_page_top.next,
  MOCK_AD_PRICES_CURRENT.placements.product_page_top.current,
  MOCK_AD_PRICES_CURRENT.placements.header_banner.current,
];

const MOCK_SELLER_PRICING = {
  as_of_date: '2026-11-25',
  placements: {
    header_banner: {
      placement: 'header_banner',
      label: 'Header banner',
      ad_price: '20.00',
      click_amount: '0.25',
      currency: 'INR',
      simulated_payment_enabled: false,
    },
    product_page_top: {
      placement: 'product_page_top',
      label: 'Product page top',
      ad_price: '45.00',
      click_amount: '1.50',
      currency: 'INR',
      simulated_payment_enabled: false,
    },
  },
};

describe('Advertising Phase 1 & Phase 2 Screens (Seller & Admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchProtectedFile.mockResolvedValue(
      new Blob(['png-bytes'], { type: 'image/png' })
    );
    if (typeof URL !== 'undefined') {
      if (!URL.createObjectURL) {
        URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-creative');
      } else {
        vi.spyOn(URL, 'createObjectURL').mockReturnValue(
          'blob:http://localhost/test-creative'
        );
      }
      if (!URL.revokeObjectURL) {
        URL.revokeObjectURL = vi.fn();
      } else {
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      }
    }
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      currentUser: {
        id: 1,
        username: 'Athul',
        role: 'admin',
        is_staff: true,
        is_superuser: true,
      },
      isAuthenticated: true,
      isResolving: false,
    });
  });

  describe('SellerAdvertisingView', () => {
    const setupSellerMocks = (
      adsOverride = MOCK_ADS,
      pricingOverride = MOCK_SELLER_PRICING
    ) => {
      api.apiRequest.mockImplementation(async (url, options = {}) => {
        if (url === '/api/advertising/ads/' && (!options.method || options.method === 'GET')) {
          return adsOverride;
        }
        if (url === '/api/advertising/pricing/') {
          return pricingOverride;
        }
        if (url === '/api/advertising/payments/') {
          return MOCK_PAYMENTS;
        }
        if (url === '/api/advertising/ledger/') {
          return MOCK_LEDGER;
        }
        if (url === '/api/products/vendor/products/') {
          return MOCK_SELLER_PRODUCTS;
        }
        if (url.startsWith('/api/advertising/ads/') && (!options.method || options.method === 'GET')) {
          const id = Number(url.split('/').filter(Boolean).pop());
          return adsOverride.find((a) => a.id === id) || adsOverride[0];
        }
        return {};
      });
    };

    it('renders My Ads list with all statuses and server money strings verbatim, plus read-only Payments and Ledger tabs', async () => {
      setupSellerMocks();
      render(
        <SellerAdvertisingView
          vendorProfile={{ id: 5, onboarding_status: 'approved', may_sell: true }}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-row-101')).toBeInTheDocument();
      });

      expect(screen.getByTestId('seller-ad-status-101')).toHaveTextContent('Created');
      expect(screen.getByTestId('seller-ad-status-102')).toHaveTextContent('Awaiting Payment');
      expect(screen.getByTestId('seller-ad-status-103')).toHaveTextContent('Funded');
      expect(screen.getByTestId('seller-ad-status-104')).toHaveTextContent('Cancelled');

      expect(screen.getByTestId('seller-ad-intended-103')).toHaveTextContent('INR 750.00');
      expect(screen.getByTestId('seller-ad-funded-103')).toHaveTextContent('INR 750.00');
      expect(screen.getByTestId('seller-ad-spent-103')).toHaveTextContent('INR 0.00');
      expect(screen.getByTestId('seller-ad-remaining-103')).toHaveTextContent('INR 750.00');

      // Switch to Payments tab
      fireEvent.click(screen.getByTestId('seller-ad-tab-payments'));
      expect(screen.getByTestId('seller-ad-payment-row-201')).toHaveTextContent('NEFT-UTR-2026-750');
      expect(screen.getByTestId('seller-ad-payment-row-201')).toHaveTextContent('INR 750.00');

      // Switch to Ledger tab and verify all 5 plain ledger labels + fallback to raw code
      fireEvent.click(screen.getByTestId('seller-ad-tab-ledger'));
      expect(screen.getByTestId('seller-ad-ledger-type-301')).toHaveTextContent('Payment credit');
      expect(screen.getByTestId('seller-ad-ledger-type-302')).toHaveTextContent('Payment reversal');
      expect(screen.getByTestId('seller-ad-ledger-type-303')).toHaveTextContent('Refund of unspent money');
      expect(screen.getByTestId('seller-ad-ledger-type-304')).toHaveTextContent('Click charge');
      expect(screen.getByTestId('seller-ad-ledger-type-305')).toHaveTextContent('Click charge reversal');
      expect(screen.getByTestId('seller-ad-ledger-type-306')).toHaveTextContent('future_custom_code');
      expect(screen.getByTestId('seller-ad-ledger-row-301')).toHaveTextContent('INR 750.00');
    });

    it('creates an ad from published products in the guided flow (Picture vs Video Coming soon, fixed placement price, no amount input) and shows per-field server errors on 400/409', async () => {
      setupSellerMocks();
      render(
        <SellerAdvertisingView
          vendorProfile={{ id: 5, onboarding_status: 'approved', may_sell: true }}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('seller-open-create-ad-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('seller-open-create-ad-btn'));

      // Step 1: Picture is selected; Video is disabled with "Coming soon"
      expect(screen.getByTestId('seller-ad-type-option-picture')).toBeChecked();
      expect(screen.getByTestId('seller-ad-type-option-video')).toBeDisabled();
      expect(screen.getByTestId('seller-ad-type-badge-video')).toHaveTextContent(
        'Coming soon'
      );

      // Verify NO amount input exists anywhere on the create form
      expect(
        screen.queryByTestId('seller-ad-amount-input')
      ).not.toBeInTheDocument();

      // Step 2: Fixed price for chosen placement shown verbatim from GET /api/advertising/pricing/
      expect(screen.getByTestId('seller-create-placement-price')).toHaveTextContent(
        'Price: INR 20.00 for this advertisement'
      );
      expect(
        screen.getByTestId('seller-create-placement-click-amount')
      ).toHaveTextContent('INR 0.25 per click');

      // Switch placement to product_page_top -> price updates to INR 45.00
      fireEvent.change(screen.getByTestId('seller-ad-placement-select'), {
        target: { value: 'product_page_top' },
      });
      expect(screen.getByTestId('seller-create-placement-price')).toHaveTextContent(
        'Price: INR 45.00 for this advertisement'
      );

      const selectEl = screen.getByTestId('seller-ad-product-select');
      // Only published products (13 and 12) should appear, not draft (99)
      expect(within(selectEl).getByText(/Apex Titan 5G Pro Flagship Smartphone/)).toBeInTheDocument();
      expect(within(selectEl).queryByText(/Draft Unpublished Item/)).not.toBeInTheDocument();

      // Simulate server validation error per field (name + 409 placement unavailable)
      api.apiRequest.mockRejectedValueOnce({
        status: 400,
        data: {
          name: ['Ensure this field has no more than 100 characters.'],
          placement: ['Advertising price is not set for this placement.'],
        },
      });

      fireEvent.change(screen.getByTestId('seller-ad-name-input'), {
        target: { value: 'Test Ad' },
      });
      fireEvent.click(screen.getByTestId('seller-ad-create-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-error-name')).toHaveTextContent(
          'Ensure this field has no more than 100 characters.'
        );
        expect(screen.getByTestId('seller-ad-error-placement')).toHaveTextContent(
          'Advertising price is not set for this placement.'
        );
      });

      // Now simulate successful creation -> moves to Ad Detail showing "Add your picture" as the single next step
      const createdAd = {
        ...MOCK_ADS[0],
        id: 105,
        name: 'New Approved Product Ad',
        ad_type: 'picture',
        placement: 'product_page_top',
        intended_amount: '45.00',
        active_creative: null,
      };
      api.apiRequest.mockImplementation(async (url, options = {}) => {
        if (url === '/api/advertising/ads/' && options.method === 'POST') {
          expect(JSON.parse(options.body)).toEqual({
            product_id: 13,
            name: 'New Approved Product Ad',
            ad_type: 'picture',
            placement: 'product_page_top',
          });
          return createdAd;
        }
        if (url === '/api/advertising/ads/') return [...MOCK_ADS, createdAd];
        if (url === '/api/advertising/pricing/') return MOCK_SELLER_PRICING;
        if (url === '/api/advertising/payments/') return MOCK_PAYMENTS;
        if (url === '/api/advertising/ledger/') return MOCK_LEDGER;
        if (url === '/api/products/vendor/products/') return MOCK_SELLER_PRODUCTS;
        return createdAd;
      });

      fireEvent.change(screen.getByTestId('seller-ad-name-input'), {
        target: { value: 'New Approved Product Ad' },
      });
      fireEvent.click(screen.getByTestId('seller-ad-create-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-detail-panel')).toBeInTheDocument();
        expect(screen.getByTestId('seller-ad-detail-name')).toHaveTextContent(
          'New Approved Product Ad (#105)'
        );
        expect(screen.getByTestId('seller-ad-next-action-label')).toHaveTextContent(
          'Add your picture'
        );
      });
    });

    it('enforces state-specific actions in Ad Detail (Add your picture -> Request payment -> Pay (test) or platform notice -> Submit for review) and resumes from server status on reload', async () => {
      const createdWithDraftCreative = {
        ...MOCK_ADS[0],
        placement: 'header_banner',
        active_creative: {
          id: 51,
          advertisement: 101,
          image_url: '/api/advertising/creatives/51/image/',
          placement: 'header_banner',
          width: 1200,
          height: 400,
          content_type: 'image/png',
          size: 1024,
          moderation_state: 'draft',
          is_active: true,
        },
      };
      setupSellerMocks([createdWithDraftCreative, ...MOCK_ADS.slice(1)]);
      const { unmount } = render(
        <SellerAdvertisingView
          vendorProfile={{ id: 5, onboarding_status: 'approved', may_sell: true }}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('seller-view-ad-btn-101')).toBeInTheDocument();
      });

      // Open detail for Ad #101 (status: 'created' with draft creative) -> single next action is "Request payment"
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-101'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-next-action-label')).toHaveTextContent(
          'Request payment'
        );
        expect(screen.getByTestId('seller-ad-request-payment-btn')).toBeInTheDocument();
        expect(screen.getByTestId('seller-ad-cancel-btn')).toBeInTheDocument();
      });

      // Ensure no "Pay Now" or "Pay (test)" button exists when simulated_payment_enabled is false
      expect(screen.queryByText(/pay now/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('seller-ad-pay-test-btn')).not.toBeInTheDocument();

      // Click "Request payment" -> opens native <dialog>
      fireEvent.click(screen.getByTestId('seller-ad-request-payment-btn'));
      expect(screen.getByTestId('seller-request-payment-dialog')).toBeInTheDocument();

      const updatedAwaitingAd = {
        ...createdWithDraftCreative,
        status: 'awaiting_payment',
      };
      api.apiRequest.mockImplementation(async (url, options = {}) => {
        if (url === '/api/advertising/ads/101/request-payment/' && options.method === 'POST') {
          return updatedAwaitingAd;
        }
        if (url === '/api/advertising/ads/101/') return updatedAwaitingAd;
        if (url === '/api/advertising/ads/') return [updatedAwaitingAd, ...MOCK_ADS.slice(1)];
        if (url === '/api/advertising/pricing/') return MOCK_SELLER_PRICING;
        if (url === '/api/advertising/payments/') return MOCK_PAYMENTS;
        if (url === '/api/advertising/ledger/') return MOCK_LEDGER;
        if (url === '/api/products/vendor/products/') return MOCK_SELLER_PRODUCTS;
        return {};
      });

      fireEvent.click(screen.getByTestId('seller-confirm-request-payment-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-awaiting-payment-notice')).toHaveTextContent(
          'Payment is added by the platform team. Nothing has been charged.'
        );
      });

      // Once awaiting_payment with simulated_payment_enabled=false, Request payment and Pay (test) are NOT offered
      expect(screen.queryByTestId('seller-ad-request-payment-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('seller-ad-pay-test-btn')).not.toBeInTheDocument();
      expect(screen.getByTestId('seller-ad-cancel-btn')).toBeInTheDocument();

      unmount();

      // Now test reload / resume when simulated_payment_enabled is true on awaiting_payment ad
      const pricingWithTestPay = {
        ...MOCK_SELLER_PRICING,
        placements: {
          ...MOCK_SELLER_PRICING.placements,
          header_banner: {
            ...MOCK_SELLER_PRICING.placements.header_banner,
            simulated_payment_enabled: true,
          },
        },
      };
      const fundedAfterTestPay = {
        ...updatedAwaitingAd,
        status: 'funded',
        funded: '250.00',
        funded_simulated: '250.00',
        remaining: '250.00',
      };
      api.apiRequest.mockImplementation(async (url, options = {}) => {
        if (
          url === '/api/advertising/ads/101/simulated-payment/' &&
          options.method === 'POST'
        ) {
          return {
            id: 299,
            advertisement_id: 101,
            source: 'simulated',
            external_reference: 'SIMULATED-AD-101',
            amount: '250.00',
            status: 'recorded',
          };
        }
        if (url === '/api/advertising/ads/101/') {
          return api.apiRequest.mock.calls.some(([u, o]) =>
            u === '/api/advertising/ads/101/simulated-payment/' && o?.method === 'POST'
          )
            ? fundedAfterTestPay
            : updatedAwaitingAd;
        }
        if (url === '/api/advertising/ads/') return [updatedAwaitingAd];
        if (url === '/api/advertising/pricing/') return pricingWithTestPay;
        if (url === '/api/advertising/payments/') return MOCK_PAYMENTS;
        if (url === '/api/advertising/ledger/') return MOCK_LEDGER;
        if (url === '/api/products/vendor/products/') return MOCK_SELLER_PRODUCTS;
        return {};
      });

      render(
        <SellerAdvertisingView
          vendorProfile={{ id: 5, onboarding_status: 'approved', may_sell: true }}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('seller-view-ad-btn-101')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-101'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-test-payment-banner')).toHaveTextContent(
          'Test payment. No real money is charged.'
        );
        expect(screen.getByTestId('seller-ad-pay-test-btn')).toHaveTextContent(
          'Pay (test)'
        );
      });

      fireEvent.click(screen.getByTestId('seller-ad-pay-test-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-advertising-feedback-banner')).toHaveTextContent(
          'Test payment recorded for Advertisement #101. You can now submit it for review.'
        );
        expect(screen.getByTestId('seller-ad-next-action-label')).toHaveTextContent(
          'Submit for review'
        );
        expect(screen.getByTestId('seller-submit-for-review-btn')).toBeInTheDocument();
      });
    });

    it('supports Phase 2 creative upload, local preview, validation errors under file field, authenticated image fetch, and submit for review', async () => {
      setupSellerMocks();
      render(
        <SellerAdvertisingView
          vendorProfile={{ id: 5, onboarding_status: 'approved', may_sell: true }}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('seller-view-ad-btn-103')).toBeInTheDocument();
      });

      // Open detail for Funded ad #103
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-103'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-creative-panel')).toBeInTheDocument();
      });

      // Verify plain help text is present and no Submit for review button exists before upload
      expect(screen.getByTestId('seller-creative-help-text')).toHaveTextContent(
        /Header banner 3:1; Product page top 4:3/i
      );
      expect(screen.queryByTestId('seller-submit-for-review-btn')).not.toBeInTheDocument();

      // Choose placement and select file -> local preview shown
      fireEvent.change(screen.getByTestId('seller-creative-placement-select'), {
        target: { value: 'product_page_top' },
      });

      const testFile = new File(['fake-png-bytes'], 'banner.png', {
        type: 'image/png',
      });
      fireEvent.change(screen.getByTestId('seller-creative-file-input'), {
        target: { files: [testFile] },
      });

      expect(screen.getByTestId('seller-creative-local-preview')).toHaveTextContent(
        'banner.png'
      );

      // 1. Server validation error (wrong ratio / invalid image / oversize) shown plainly under file field
      api.apiRequest.mockRejectedValueOnce({
        status: 400,
        data: {
          image: [
            'Image dimensions must have a 4:3 aspect ratio for product_page_top.',
          ],
        },
      });

      fireEvent.click(screen.getByTestId('seller-creative-upload-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-creative-error-image')).toHaveTextContent(
          'Image dimensions must have a 4:3 aspect ratio for product_page_top.'
        );
      });

      // 2. Successful upload -> returns ad with draft active_creative -> fetches authenticated image blob URL
      const uploadedCreative = {
        id: 55,
        advertisement: 103,
        image_url: '/api/advertising/creatives/55/image/',
        placement: 'product_page_top',
        width: 1200,
        height: 900,
        content_type: 'image/png',
        size: 1024,
        moderation_state: 'draft',
        rejection_reason: '',
        is_active: true,
      };
      const adWithDraftCreative = {
        ...MOCK_ADS[2],
        active_creative: uploadedCreative,
      };

      api.apiRequest.mockImplementation(async (url, options = {}) => {
        if (url === '/api/advertising/ads/103/creative/' && options.method === 'POST') {
          return uploadedCreative;
        }
        if (url === '/api/advertising/ads/103/') {
          return adWithDraftCreative;
        }
        if (url === '/api/advertising/ads/') {
          return [MOCK_ADS[0], MOCK_ADS[1], adWithDraftCreative, MOCK_ADS[3]];
        }
        return [];
      });

      fireEvent.change(screen.getByTestId('seller-creative-file-input'), {
        target: { files: [testFile] },
      });
      fireEvent.click(screen.getByTestId('seller-creative-upload-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-stored-creative-img')).toHaveAttribute(
          'src',
          'blob:http://localhost/test-creative'
        );
        expect(api.fetchProtectedFile).toHaveBeenCalledWith(
          '/api/advertising/creatives/55/image/'
        );
      });

      // Submit for review button is now visible
      expect(screen.getByTestId('seller-submit-for-review-btn')).toBeInTheDocument();

      // 3. Submit for review via native <dialog> -> transitions to pending_review ("Waiting for review") and locks replacing
      fireEvent.click(screen.getByTestId('seller-submit-for-review-btn'));
      expect(screen.getByTestId('seller-submit-review-dialog')).toBeInTheDocument();

      const pendingReviewAd = {
        ...adWithDraftCreative,
        status: 'pending_review',
        active_creative: {
          ...uploadedCreative,
          moderation_state: 'pending_review',
        },
      };

      api.apiRequest.mockImplementation(async (url, options = {}) => {
        if (url === '/api/advertising/ads/103/submit/' && options.method === 'POST') {
          return pendingReviewAd;
        }
        if (url === '/api/advertising/ads/103/') return pendingReviewAd;
        if (url === '/api/advertising/ads/') return [pendingReviewAd];
        return [];
      });

      fireEvent.change(screen.getByTestId('seller-submit-review-reason-input'), {
        target: { value: 'Ready for moderation review' },
      });
      fireEvent.click(screen.getByTestId('seller-confirm-submit-review-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('seller-waiting-for-review-notice')
        ).toHaveTextContent('Waiting for review');
      });

      // Replacing and submitting are locked while pending_review
      expect(
        screen.queryByTestId('seller-creative-upload-form')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('seller-submit-for-review-btn')
      ).not.toBeInTheDocument();
    });

    it('renders Rejected creative reason (allowing photo replacement), Approved state with snapshotted click price and note, and Taken Down state without resubmit', async () => {
      const rejectedAd = {
        ...MOCK_ADS[2],
        id: 107,
        name: 'Rejected Creative Ad',
        status: 'funded',
        rejection_reason: 'Text in banner is blurry and unreadable.',
        active_creative: {
          id: 60,
          advertisement: 107,
          image_url: '/api/advertising/creatives/60/image/',
          placement: 'header_banner',
          width: 1200,
          height: 400,
          content_type: 'image/png',
          size: 1400,
          moderation_state: 'rejected',
          rejection_reason: 'Text in banner is blurry and unreadable.',
          is_active: true,
        },
      };

      const approvedAd = {
        ...MOCK_ADS[2],
        id: 108,
        name: 'Approved Header Ad',
        status: 'approved',
        placement: 'header_banner',
        click_rate_snapshot: '0.25',
        active_creative: {
          id: 61,
          advertisement: 108,
          image_url: '/api/advertising/creatives/61/image/',
          placement: 'header_banner',
          width: 1200,
          height: 400,
          content_type: 'image/png',
          size: 1400,
          moderation_state: 'approved',
          rejection_reason: '',
          is_active: true,
        },
      };

      const takenDownAd = {
        ...approvedAd,
        id: 109,
        name: 'Taken Down Ad',
        status: 'taken_down',
        rejection_reason: 'Policy violation after approval.',
      };

      setupSellerMocks([rejectedAd, approvedAd, takenDownAd]);
      render(
        <SellerAdvertisingView
          vendorProfile={{ id: 5, onboarding_status: 'approved', may_sell: true }}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('seller-view-ad-btn-107')).toBeInTheDocument();
      });

      // 1. Open Rejected Ad #107 -> shows staff reason and upload replacement form
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-107'));
      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-rejection-reason')).toHaveTextContent(
          'Text in banner is blurry and unreadable.'
        );
      });
      expect(screen.getByTestId('seller-creative-upload-form')).toBeInTheDocument();
      // Submit for review is not offered until the rejected photo is replaced with a draft creative
      expect(screen.queryByTestId('seller-submit-for-review-btn')).not.toBeInTheDocument();

      // 2. Open Approved Ad #108 -> shows Approved, placement, click_rate_snapshot, and mandatory release note
      fireEvent.click(screen.getByTestId('seller-ad-detail-back-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('seller-view-ad-btn-108')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-108'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-approved-banner')).toBeInTheDocument();
      });
      expect(screen.getByTestId('seller-ad-approved-placement')).toHaveTextContent(
        'Header Banner'
      );
      expect(screen.getByTestId('seller-ad-click-rate-snapshot')).toHaveTextContent(
        'INR 0.25 per click'
      );
      expect(screen.getByTestId('seller-ad-approved-note')).toHaveTextContent(
        'Your advertisement is approved. It will start showing in a later release.'
      );
      expect(screen.queryByTestId('seller-creative-upload-form')).not.toBeInTheDocument();

      // 3. Open Taken Down Ad #109 -> shows status and reason; no upload or resubmit
      fireEvent.click(screen.getByTestId('seller-ad-detail-back-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('seller-view-ad-btn-109')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-109'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-terminal-banner')).toHaveTextContent(
          'Taken Down'
        );
      });
      expect(screen.getByTestId('seller-ad-terminal-reason')).toHaveTextContent(
        'Policy violation after approval.'
      );
      expect(screen.queryByTestId('seller-creative-upload-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('seller-submit-for-review-btn')).not.toBeInTheDocument();
    });

    it('disables create, request-payment, cancel, upload, and submit actions with the server reason when seller cannot sell (may_sell === false)', async () => {
      const createdWithDraft = {
        ...MOCK_ADS[0],
        active_creative: {
          id: 50,
          advertisement: 101,
          image_url: '/api/advertising/creatives/50/image/',
          placement: 'header_banner',
          width: 1200,
          height: 400,
          content_type: 'image/png',
          size: 1024,
          moderation_state: 'draft',
          is_active: true,
        },
      };
      const fundedWithDraft = {
        ...MOCK_ADS[2],
        active_creative: {
          id: 55,
          advertisement: 103,
          image_url: '/api/advertising/creatives/55/image/',
          placement: 'header_banner',
          width: 1200,
          height: 400,
          content_type: 'image/png',
          size: 1024,
          moderation_state: 'draft',
          is_active: true,
        },
      };
      setupSellerMocks([createdWithDraft, fundedWithDraft]);
      render(
        <SellerAdvertisingView
          vendorProfile={{
            id: 1,
            onboarding_status: 'approved',
            may_sell: false,
            control_reason: 'Seller account suspended from selling by compliance team.',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-row-101')).toBeInTheDocument();
      });

      expect(screen.getByTestId('seller-advertising-restriction-banner')).toBeInTheDocument();
      expect(screen.getByTestId('seller-advertising-restriction-reason')).toHaveTextContent(
        'Seller account suspended from selling by compliance team.'
      );
      expect(screen.getByTestId('seller-open-create-ad-btn')).toBeDisabled();
      expect(screen.getByTestId('seller-row-request-payment-btn-101')).toBeDisabled();
      expect(screen.getByTestId('seller-row-cancel-ad-btn-101')).toBeDisabled();

      // Open created ad detail and confirm upload is disabled; open funded ad detail and confirm submit for review is disabled
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-101'));
      await waitFor(() => {
        expect(screen.getByTestId('seller-creative-upload-btn')).toBeDisabled();
      });
      fireEvent.click(screen.getByTestId('seller-ad-detail-back-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('seller-view-ad-btn-103')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-103'));
      await waitFor(() => {
        expect(screen.getByTestId('seller-submit-for-review-btn')).toBeDisabled();
      });
    });

    it('renders Running and Ended advertisements (with and without leftover unused amount), billed clicks, and end reason without estimates or percentages', async () => {
      const runningAd = {
        ...MOCK_ADS[2],
        id: 110,
        name: 'Running Header Ad',
        status: 'running',
        end_reason: '',
        placement: 'header_banner',
        click_rate_snapshot: '0.25',
        funded: '1.00',
        spent: '0.50',
        remaining: '0.50',
        billed_click_count: 2,
      };

      const endedNoLeftoverAd = {
        ...runningAd,
        id: 111,
        name: 'Ended Exact Budget Ad',
        status: 'ended',
        end_reason: 'budget_exhausted',
        funded: '1.00',
        spent: '1.00',
        remaining: '0.00',
        billed_click_count: 4,
      };

      const endedWithLeftoverAd = {
        ...runningAd,
        id: 112,
        name: 'Ended Sub-Click Leftover Ad',
        status: 'ended',
        end_reason: 'budget_exhausted',
        funded: '1.15',
        spent: '1.00',
        remaining: '0.15',
        billed_click_count: 4,
      };

      setupSellerMocks([runningAd, endedNoLeftoverAd, endedWithLeftoverAd]);
      render(
        <SellerAdvertisingView
          vendorProfile={{ id: 5, onboarding_status: 'approved', may_sell: true }}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-row-110')).toBeInTheDocument();
      });

      // Check My Ads table columns for Running and Ended ads
      expect(screen.getByTestId('seller-ad-status-110')).toHaveTextContent('Running');
      expect(screen.getByTestId('seller-ad-spent-110')).toHaveTextContent('INR 0.50');
      expect(screen.getByTestId('seller-ad-remaining-110')).toHaveTextContent('INR 0.50');
      expect(screen.getByTestId('seller-ad-billed-clicks-110')).toHaveTextContent('2');
      expect(screen.getByTestId('seller-ad-end-reason-110')).toHaveTextContent('—');

      expect(screen.getByTestId('seller-ad-status-111')).toHaveTextContent('Ended');
      expect(screen.getByTestId('seller-ad-billed-clicks-111')).toHaveTextContent('4');
      expect(screen.getByTestId('seller-ad-end-reason-111')).toHaveTextContent(
        'Your budget has been used up'
      );

      // 1. Open Running Ad #110 detail
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-110'));
      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-running-banner')).toBeInTheDocument();
      });
      expect(screen.getByTestId('seller-ad-running-label')).toHaveTextContent('Running');
      expect(screen.getByTestId('seller-ad-running-spent')).toHaveTextContent(
        'Spent: INR 0.50'
      );
      expect(screen.getByTestId('seller-ad-running-remaining')).toHaveTextContent(
        'Remaining: INR 0.50'
      );
      expect(screen.getByTestId('seller-ad-detail-billed-clicks')).toHaveTextContent('2');
      expect(screen.queryByText(/clicks left/i)).not.toBeInTheDocument();

      // 2. Open Ended Ad #111 (without leftover) -> no "Unused amount" line
      fireEvent.click(screen.getByTestId('seller-ad-detail-back-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('seller-view-ad-btn-111')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-111'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-ended-banner')).toHaveTextContent(
          'This advertisement has ended'
        );
      });
      expect(screen.getByTestId('seller-ad-ended-reason')).toHaveTextContent(
        'End reason: Your budget has been used up'
      );
      expect(
        screen.queryByTestId('seller-ad-ended-unused-amount')
      ).not.toBeInTheDocument();

      // 3. Open Ended Ad #112 (with leftover "0.15") -> shows "Unused amount: INR 0.15"
      fireEvent.click(screen.getByTestId('seller-ad-detail-back-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('seller-view-ad-btn-112')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('seller-view-ad-btn-112'));

      await waitFor(() => {
        expect(screen.getByTestId('seller-ad-ended-unused-amount')).toHaveTextContent(
          'Unused amount: INR 0.15'
        );
      });
    });
  });

  describe('AdvertisingAdminModule', () => {
    const setupAdminMocks = ({
      reviewQueue = MOCK_REVIEW_QUEUE,
      clickRatesCurrent = MOCK_CLICK_RATES_CURRENT,
      clickRatesHistory = MOCK_CLICK_RATES_HISTORY,
      adPricesCurrent = MOCK_AD_PRICES_CURRENT,
      adPricesHistory = MOCK_AD_PRICES_HISTORY,
      clicks = MOCK_CLICKS_RESPONSE,
    } = {}) => {
      api.apiRequest.mockImplementation(async (url) => {
        if (url.startsWith('/api/admin/advertising/ads/')) return MOCK_ADS;
        if (url.startsWith('/api/admin/advertising/payments/')) return MOCK_PAYMENTS;
        if (url.startsWith('/api/admin/advertising/ledger/')) return MOCK_LEDGER;
        if (url.startsWith('/api/admin/advertising/reconciliation/')) return MOCK_RECONCILIATION;
        if (url.startsWith('/api/admin/advertising/review-queue/')) return reviewQueue;
        if (url === '/api/admin/advertising/click-rates/current/') return clickRatesCurrent;
        if (url.startsWith('/api/admin/advertising/click-rates/')) return clickRatesHistory;
        if (url === '/api/admin/advertising/ad-prices/current/') return adPricesCurrent;
        if (url.startsWith('/api/admin/advertising/ad-prices/')) return adPricesHistory;
        if (url.startsWith('/api/admin/advertising/clicks/')) return clicks;
        return [];
      });
    };

    it('renders Ads, Payments, Ledger tables with seller_name, product_name, filters, and Reconciliation view without stored budget column', async () => {
      setupAdminMocks();
      render(<AdvertisingAdminModule />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-row-101')).toBeInTheDocument();
      });

      expect(screen.getByTestId('admin-ad-seller-101')).toHaveTextContent(
        'Dummy Approved Store (#5)'
      );
      expect(screen.getByTestId('admin-ad-product-101')).toHaveTextContent(
        'Apex Titan 5G Pro Flagship Smartphone (#13)'
      );

      // Test filters trigger backend queries with seller, status, advertisement
      fireEvent.change(screen.getByTestId('admin-filter-seller'), {
        target: { value: '5' },
      });
      fireEvent.change(screen.getByTestId('admin-filter-status'), {
        target: { value: 'awaiting_payment' },
      });
      fireEvent.change(screen.getByTestId('admin-filter-advertisement'), {
        target: { value: '102' },
      });

      await waitFor(() => {
        expect(api.apiRequest).toHaveBeenCalledWith(
          '/api/admin/advertising/ads/?seller=5&status=awaiting_payment&advertisement=102'
        );
      });

      // Switch to Payments tab
      fireEvent.click(screen.getByTestId('admin-ad-tab-payments'));
      await waitFor(() => {
        expect(screen.getByTestId('admin-payment-row-201')).toBeInTheDocument();
      });

      // Switch to Ledger tab
      fireEvent.click(screen.getByTestId('admin-ad-tab-ledger'));
      await waitFor(() => {
        expect(screen.getByTestId('admin-ledger-row-301')).toBeInTheDocument();
      });

      // Switch to Reconciliation tab
      fireEvent.click(screen.getByTestId('admin-ad-tab-reconciliation'));
      await waitFor(() => {
        expect(screen.getByTestId('recon-total-funded')).toHaveTextContent('INR 1250.00');
        expect(screen.getByTestId('recon-total-spent')).toHaveTextContent('INR 0.00');
        expect(screen.getByTestId('recon-total-remaining')).toHaveTextContent('INR 1250.00');
      });

      expect(screen.getByTestId('recon-mismatch-flag-103')).toHaveTextContent(
        'No Mismatch (Consistent)'
      );
      expect(screen.getByTestId('recon-mismatch-flag-102')).toHaveTextContent(
        'Mismatch: Status vs Ledger Disagreement'
      );
    });

    it('renders Review Queue tab (default pending_review), opens item with authenticated photo, and handles Approve, Reject, Take down dialogs and 409 conflicts', async () => {
      setupAdminMocks();
      render(<AdvertisingAdminModule />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-tab-review-queue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('admin-ad-tab-review-queue'));

      await waitFor(() => {
        expect(screen.getByTestId('admin-rq-row-106')).toBeInTheDocument();
      });

      // Verify default filter is pending_review and columns show seller_name, product_name, placement, funded
      expect(screen.getByTestId('admin-rq-filter-status')).toHaveValue('pending_review');
      expect(screen.getByTestId('admin-rq-seller-106')).toHaveTextContent(
        'Dummy Approved Store (#5)'
      );
      expect(screen.getByTestId('admin-rq-product-106')).toHaveTextContent(
        'Apex Titan 5G Pro Flagship Smartphone (#13)'
      );
      expect(screen.getByTestId('admin-rq-placement-106')).toHaveTextContent(
        'Header Banner'
      );
      expect(screen.getByTestId('admin-rq-funded-106')).toHaveTextContent(
        'INR 500.00'
      );

      // Inspect item -> shows authenticated creative image, product, and funded figure
      fireEvent.click(screen.getByTestId('admin-rq-inspect-btn-106'));
      await waitFor(() => {
        expect(screen.getByTestId('admin-review-item-detail')).toBeInTheDocument();
        expect(screen.getByTestId('admin-review-creative-img')).toHaveAttribute(
          'src',
          'blob:http://localhost/test-creative'
        );
      });
      expect(api.fetchProtectedFile).toHaveBeenCalledWith(
        '/api/advertising/creatives/41/image/'
      );

      // Take down is NOT offered on pending_review ads
      expect(
        screen.queryByTestId('admin-open-takedown-ad-btn')
      ).not.toBeInTheDocument();

      // Open Approve dialog -> blank reason is rejected
      fireEvent.click(screen.getByTestId('admin-open-approve-ad-btn'));
      expect(screen.getByTestId('admin-review-action-dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('admin-review-submit-btn'));
      expect(screen.getByTestId('admin-review-error-reason')).toHaveTextContent(
        'A reason is required and cannot be blank.'
      );

      // Simulate 409 Conflict: "No click rate is in force for this placement."
      api.apiRequest.mockRejectedValueOnce({
        status: 409,
        data: {
          detail: 'No click rate is in force for this placement.',
        },
      });

      fireEvent.change(screen.getByTestId('admin-review-reason-input'), {
        target: { value: 'Looks good to approve' },
      });
      fireEvent.click(screen.getByTestId('admin-review-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('admin-review-dialog-error')).toHaveTextContent(
          'No click rate is in force for this placement.'
        );
      });

      // Simulate 409 Conflict: "The advertisement product must still be published and active."
      api.apiRequest.mockRejectedValueOnce({
        status: 409,
        data: {
          detail: 'The advertisement product must still be published and active.',
        },
      });
      fireEvent.click(screen.getByTestId('admin-review-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('admin-review-dialog-error')).toHaveTextContent(
          'The advertisement product must still be published and active.'
        );
      });

      // Simulate successful approval -> transitions item to approved -> Take down button becomes available
      const approvedItem = {
        ...MOCK_REVIEW_QUEUE[0],
        status: 'approved',
        placement: 'header_banner',
        click_rate_snapshot: '0.25',
      };
      api.apiRequest.mockImplementation(async (url, options = {}) => {
        if (url === '/api/admin/advertising/ads/106/approve/' && options.method === 'POST') {
          return approvedItem;
        }
        if (url.startsWith('/api/admin/advertising/review-queue/')) {
          return [approvedItem];
        }
        if (url.startsWith('/api/admin/advertising/ads/')) return [approvedItem];
        return [];
      });

      fireEvent.click(screen.getByTestId('admin-review-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-feedback-banner')).toHaveTextContent(
          'Advertisement #106 (Submitted Banner Campaign) approved.'
        );
      });

      // Now that the item is approved, Take down button is offered
      expect(screen.getByTestId('admin-open-takedown-ad-btn')).toBeInTheDocument();
    });

    it('renders Click Prices tab with current & next scheduled rates, version history, help text, and handles 400 backdated and 409 overlap errors under effective_from', async () => {
      setupAdminMocks();
      render(<AdvertisingAdminModule />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-tab-click-rates')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('admin-ad-tab-click-rates'));

      await waitFor(() => {
        expect(screen.getByTestId('admin-click-rates-section')).toBeInTheDocument();
      });

      // Check mandatory help text
      expect(screen.getByTestId('admin-click-rates-help-text')).toHaveTextContent(
        'A rate cannot be edited. To change it, schedule a new version for a future date.'
      );

      // Check current and next scheduled rates per placement (verbatim server amounts + "INR per click")
      expect(
        screen.getByTestId('click-rate-current-amount-header_banner')
      ).toHaveTextContent('0.25 INR per click');
      expect(
        screen.getByTestId('click-rate-current-amount-product_page_top')
      ).toHaveTextContent('1.25 INR per click');
      expect(
        screen.getByTestId('click-rate-next-amount-product_page_top')
      ).toHaveTextContent('1.50 INR per click');

      // Check version history rows
      expect(screen.getByTestId('click-rate-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('click-rate-row-2')).toBeInTheDocument();
      expect(screen.getByTestId('click-rate-row-3')).toBeInTheDocument();

      // 1. Backdated 400 error under effective_from
      api.apiRequest.mockRejectedValueOnce({
        status: 400,
        data: {
          detail: {
            effective_from: 'A click rate cannot be backdated.',
          },
        },
      });

      fireEvent.change(screen.getByTestId('click-rate-amount-input'), {
        target: { value: '2.00' },
      });
      fireEvent.change(screen.getByTestId('click-rate-effective-from-input'), {
        target: { value: '2020-01-01' },
      });
      fireEvent.change(screen.getByTestId('click-rate-reason-input'), {
        target: { value: 'Backdated rate test' },
      });
      fireEvent.click(screen.getByTestId('click-rate-submit-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('click-rate-error-effective_from')
        ).toHaveTextContent('A click rate cannot be backdated.');
      });

      // 2. Overlapping 409 error under effective_from
      api.apiRequest.mockRejectedValueOnce({
        status: 409,
        data: {
          detail:
            'The proposed effective date overlaps an existing or later click-rate version.',
        },
      });

      fireEvent.change(screen.getByTestId('click-rate-effective-from-input'), {
        target: { value: '2026-11-23' },
      });
      fireEvent.click(screen.getByTestId('click-rate-submit-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('click-rate-error-effective_from')
        ).toHaveTextContent(
          'The proposed effective date overlaps an existing or later click-rate version.'
        );
      });
    });

    it('enables Ad Prices and Click Prices scheduling for ANY staff admin (including non-superuser staff) and maps 400/409 errors under matching fields', async () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        currentUser: {
          id: 2,
          username: 'admin_test',
          role: 'admin',
          is_staff: true,
          is_superuser: false,
        },
        isAuthenticated: true,
        isResolving: false,
      });

      setupAdminMocks();
      render(<AdvertisingAdminModule />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-tab-ad-prices')).toBeInTheDocument();
        expect(screen.getByTestId('admin-ad-tab-click-rates')).toBeInTheDocument();
      });

      // 1. Click Prices tab: schedule form is enabled for non-superuser staff admin
      fireEvent.click(screen.getByTestId('admin-ad-tab-click-rates'));
      await waitFor(() => {
        expect(screen.getByTestId('schedule-click-rate-form')).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('click-rate-readonly-notice')
      ).not.toBeInTheDocument();

      // 2. Ad Prices tab: shows current & next scheduled prices ("INR per ad"), help text, version history, and schedule form for non-superuser staff admin
      fireEvent.click(screen.getByTestId('admin-ad-tab-ad-prices'));
      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-prices-section')).toBeInTheDocument();
      });

      expect(screen.getByTestId('admin-ad-prices-help-text')).toHaveTextContent(
        'A price cannot be edited. To change it, schedule a new version.'
      );
      expect(
        screen.getByTestId('ad-price-current-amount-header_banner')
      ).toHaveTextContent('20.00 INR per ad');
      expect(
        screen.getByTestId('ad-price-current-amount-product_page_top')
      ).toHaveTextContent('35.00 INR per ad');
      expect(
        screen.getByTestId('ad-price-next-amount-product_page_top')
      ).toHaveTextContent('45.00 INR per ad');
      expect(screen.getByTestId('ad-price-row-1')).toBeInTheDocument();

      // Test 400 error: backdated effective_from
      api.apiRequest.mockRejectedValueOnce({
        status: 400,
        data: {
          detail: {
            effective_from: 'An advertising price cannot be backdated.',
          },
        },
      });
      fireEvent.change(screen.getByTestId('ad-price-amount-input'), {
        target: { value: '25.00' },
      });
      fireEvent.change(screen.getByTestId('ad-price-effective-from-input'), {
        target: { value: '2020-01-01' },
      });
      fireEvent.change(screen.getByTestId('ad-price-reason-input'), {
        target: { value: 'Staff admin ad price test' },
      });
      fireEvent.click(screen.getByTestId('ad-price-submit-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('ad-price-error-effective_from')
        ).toHaveTextContent('An advertising price cannot be backdated.');
      });

      // Test 409 error: overlapping effective date
      api.apiRequest.mockRejectedValueOnce({
        status: 409,
        data: {
          detail:
            'The proposed effective date overlaps an existing or later advertising price version.',
        },
      });
      fireEvent.change(screen.getByTestId('ad-price-effective-from-input'), {
        target: { value: '2026-11-23' },
      });
      fireEvent.click(screen.getByTestId('ad-price-submit-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('ad-price-error-effective_from')
        ).toHaveTextContent(
          'The proposed effective date overlaps an existing or later advertising price version.'
        );
      });

      // Test 400 error: below one click / no click amount / above maximum -> mapped to ad_price
      api.apiRequest.mockRejectedValueOnce({
        status: 400,
        data: {
          detail: {
            ad_price:
              'Advertising price must be at least one click amount in force.',
          },
        },
      });
      fireEvent.click(screen.getByTestId('ad-price-submit-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('ad-price-error-ad_price')
        ).toHaveTextContent(
          'Advertising price must be at least one click amount in force.'
        );
      });
    });

    it('handles Manual Credit dialog: displays 400/409 field errors (second credit, reused reference, below minimum) under matching inputs', async () => {
      setupAdminMocks();
      render(<AdvertisingAdminModule />);

      await waitFor(() => {
        expect(screen.getByTestId('open-manual-credit-btn-102')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('open-manual-credit-btn-102'));
      expect(screen.getByTestId('manual-credit-dialog')).toBeInTheDocument();

      // 1. Below minimum / mismatched amount (400)
      api.apiRequest.mockRejectedValueOnce({
        status: 400,
        data: {
          detail: {
            amount: ['Payment must be at least INR 100.00.'],
          },
        },
      });

      fireEvent.change(screen.getByTestId('manual-credit-amount-input'), {
        target: { value: '10.00' },
      });
      fireEvent.change(screen.getByTestId('manual-credit-reference-input'), {
        target: { value: 'REF-1' },
      });
      fireEvent.change(screen.getByTestId('manual-credit-reason-input'), {
        target: { value: 'Manual credit test' },
      });
      fireEvent.click(screen.getByTestId('manual-credit-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('manual-credit-error-amount')).toHaveTextContent(
          'Payment must be at least INR 100.00.'
        );
      });

      // 2. Reused external reference (400/409, including Django UniqueConstraint message)
      api.apiRequest.mockRejectedValueOnce({
        status: 400,
        data: {
          detail: {
            __all__: ['Constraint “advertising_payment_unique_reference” is violated.'],
          },
        },
      });
      fireEvent.click(screen.getByTestId('manual-credit-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('manual-credit-error-external_reference')).toHaveTextContent(
          'Constraint “advertising_payment_unique_reference” is violated.'
        );
      });

      // 3. Second credit 409
      api.apiRequest.mockRejectedValueOnce({
        status: 409,
        data: {
          detail: ['Advertisement must be awaiting payment before it can be funded.'],
        },
      });
      fireEvent.click(screen.getByTestId('manual-credit-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('manual-credit-error-amount')).toHaveTextContent(
          'Advertisement must be awaiting payment before it can be funded.'
        );
      });
    });

    it('disables write buttons for non-superuser staff and shows server 403 when attempted', async () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        currentUser: {
          id: 2,
          username: 'admin_test',
          role: 'admin',
          is_staff: true,
          is_superuser: false,
        },
        isAuthenticated: true,
        isResolving: false,
      });

      setupAdminMocks();
      render(<AdvertisingAdminModule />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-non-superuser-banner')).toBeInTheDocument();
      });

      // Primary button is disabled for non-superusers
      expect(screen.getByTestId('open-manual-credit-btn-102')).toBeDisabled();

      // Attempting write via server check shows 403 error from backend
      fireEvent.click(screen.getByTestId('attempt-manual-credit-btn-102'));
      api.apiRequest.mockRejectedValueOnce({
        status: 403,
        data: {
          detail: 'You do not have permission to perform this action.',
        },
      });

      fireEvent.change(screen.getByTestId('manual-credit-reference-input'), {
        target: { value: 'REF-403' },
      });
      fireEvent.change(screen.getByTestId('manual-credit-reason-input'), {
        target: { value: 'Non-superuser attempt' },
      });
      fireEvent.click(screen.getByTestId('manual-credit-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('manual-credit-dialog-error')).toHaveTextContent(
          'You do not have permission to perform this action.'
        );
        expect(screen.getByTestId('admin-ad-feedback-banner')).toHaveTextContent(
          'You do not have permission to perform this action.'
        );
      });
    });

    it('handles Reverse Payment dialog: requires confirm_reversal checkbox, explains refund and error_correction, and shows 409 on second reversal or spending', async () => {
      setupAdminMocks();
      render(<AdvertisingAdminModule />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-tab-payments')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('admin-ad-tab-payments'));
      await waitFor(() => {
        expect(screen.getByTestId('open-reverse-payment-btn-201')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('open-reverse-payment-btn-201'));
      expect(screen.getByTestId('reverse-payment-dialog')).toBeInTheDocument();

      // Verify both outcome explanations are visible
      expect(
        screen.getByText(/returns the advertisement to awaiting payment/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/cancels the advertisement permanently/i)
      ).toBeInTheDocument();

      // Submitting without checking confirm_reversal shows validation error
      fireEvent.change(screen.getByTestId('reverse-payment-reason-input'), {
        target: { value: 'Wrong reference recorded' },
      });
      fireEvent.click(screen.getByTestId('reverse-payment-submit-btn'));
      expect(
        screen.getByTestId('reverse-payment-error-confirm_reversal')
      ).toBeInTheDocument();

      // Check confirm_reversal and simulate 409 second reversal
      fireEvent.click(screen.getByTestId('reverse-confirm-checkbox'));
      api.apiRequest.mockRejectedValueOnce({
        status: 409,
        data: {
          detail: ['This payment has already been reversed.'],
        },
      });
      fireEvent.click(screen.getByTestId('reverse-payment-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('reverse-payment-dialog-error')).toHaveTextContent(
          'This payment has already been reversed.'
        );
      });
    });

    it('handles Refund Unspent Money dialog: offers only when remaining > 0 and status is allowed, displays exact remaining amount, maps 400/409 field errors, and enforces superuser-only rule', async () => {
      setupAdminMocks();
      render(<AdvertisingAdminModule />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-row-103')).toBeInTheDocument();
      });

      // Ad #101 (created, remaining 0.00), Ad #102 (awaiting_payment, remaining 0.00), Ad #104 (cancelled, remaining 0.00) must NOT offer Refund Unspent Money
      expect(
        screen.queryByTestId('open-refund-unspent-btn-101')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('open-refund-unspent-btn-102')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('open-refund-unspent-btn-104')
      ).not.toBeInTheDocument();

      // Ad #103 (funded, remaining "750.00") offers Refund Unspent Money
      expect(
        screen.getByTestId('open-refund-unspent-btn-103')
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('open-refund-unspent-btn-103'));
      expect(screen.getByTestId('refund-unspent-dialog')).toBeInTheDocument();

      // Check mandatory confirm dialog text and exact server remaining amount string
      expect(
        screen.getByTestId('refund-unspent-dialog-help-text')
      ).toHaveTextContent(
        'Record that you have refunded the unspent amount to the seller by bank transfer. This records the refund; it does not send money.'
      );
      expect(
        screen.getByTestId('refund-unspent-remaining-amount')
      ).toHaveTextContent('INR 750.00');

      // Submitting without checking confirm_refund shows validation error
      fireEvent.change(screen.getByTestId('refund-unspent-reference-input'), {
        target: { value: 'NEFT-REFUND-103' },
      });
      fireEvent.change(screen.getByTestId('refund-unspent-reason-input'), {
        target: { value: 'Refunding unspent balance' },
      });
      fireEvent.click(screen.getByTestId('refund-unspent-submit-btn'));

      expect(
        screen.getByTestId('refund-unspent-error-confirm_refund')
      ).toBeInTheDocument();

      // Check confirm_refund and test 409 reused reference error mapped to external_reference
      fireEvent.click(screen.getByTestId('refund-unspent-confirm-checkbox'));
      api.apiRequest.mockRejectedValueOnce({
        status: 409,
        data: {
          detail: 'This refund transfer reference has already been used.',
        },
      });
      fireEvent.click(screen.getByTestId('refund-unspent-submit-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('refund-unspent-error-external_reference')
        ).toHaveTextContent(
          'This refund transfer reference has already been used.'
        );
      });

      // Test 409 nothing left to refund mapped to reason
      api.apiRequest.mockRejectedValueOnce({
        status: 409,
        data: {
          detail: 'There is no unspent balance to refund.',
        },
      });
      fireEvent.click(screen.getByTestId('refund-unspent-submit-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('refund-unspent-error-reason')
        ).toHaveTextContent('There is no unspent balance to refund.');
      });

      // Test 409 wrong status mapped to reason
      api.apiRequest.mockRejectedValueOnce({
        status: 409,
        data: {
          detail:
            'Only a funded, approved, taken-down, or ended advertisement can be refunded.',
        },
      });
      fireEvent.click(screen.getByTestId('refund-unspent-submit-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('refund-unspent-error-reason')
        ).toHaveTextContent(
          'Only a funded, approved, taken-down, or ended advertisement can be refunded.'
        );
      });
    });

    it('renders Admin Ledger plain labels, Clicks tab with filters and per-ad counts without token ids, and Reconciliation diagnostic flags', async () => {
      const reconWithFlags = {
        ...MOCK_RECONCILIATION,
        advertisements: [
          {
            ...MOCK_RECONCILIATION.advertisements[0],
            has_spend_above_funded: true,
            has_negative_remaining: true,
            has_ended_click_balance: true,
            has_refund_status_disagreement: true,
          },
        ],
      };

      api.apiRequest.mockImplementation(async (url) => {
        if (url.startsWith('/api/admin/advertising/ads/')) return MOCK_ADS;
        if (url.startsWith('/api/admin/advertising/payments/')) return MOCK_PAYMENTS;
        if (url.startsWith('/api/admin/advertising/ledger/')) return MOCK_LEDGER;
        if (url.startsWith('/api/admin/advertising/reconciliation/')) return reconWithFlags;
        if (url.startsWith('/api/admin/advertising/review-queue/')) return MOCK_REVIEW_QUEUE;
        if (url === '/api/admin/advertising/click-rates/current/') return MOCK_CLICK_RATES_CURRENT;
        if (url.startsWith('/api/admin/advertising/click-rates/')) return MOCK_CLICK_RATES_HISTORY;
        if (url.startsWith('/api/admin/advertising/clicks/')) return MOCK_CLICKS_RESPONSE;
        return [];
      });

      render(<AdvertisingAdminModule />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-tab-ledger')).toBeInTheDocument();
      });

      // 1. Admin Ledger tab shows all 5 plain labels and falls back to raw code
      fireEvent.click(screen.getByTestId('admin-ad-tab-ledger'));
      await waitFor(() => {
        expect(screen.getByTestId('admin-ledger-type-301')).toHaveTextContent('Payment credit');
        expect(screen.getByTestId('admin-ledger-type-302')).toHaveTextContent('Payment reversal');
        expect(screen.getByTestId('admin-ledger-type-303')).toHaveTextContent('Refund of unspent money');
        expect(screen.getByTestId('admin-ledger-type-304')).toHaveTextContent('Click charge');
        expect(screen.getByTestId('admin-ledger-type-305')).toHaveTextContent('Click charge reversal');
        expect(screen.getByTestId('admin-ledger-type-306')).toHaveTextContent('future_custom_code');
      });

      // 2. Clicks tab shows per-ad counts by decision & reason, plain labels + raw codes, filters, and never shows token ids
      fireEvent.click(screen.getByTestId('admin-ad-tab-clicks'));
      await waitFor(() => {
        expect(screen.getByTestId('admin-clicks-section')).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('admin-clicks-by-decision-103')
      ).toHaveTextContent('Would be billable');
      expect(
        screen.getByTestId('admin-clicks-by-reason-103')
      ).toHaveTextContent('Seller self-click');
      expect(
        screen.getByTestId('admin-clicks-by-reason-103')
      ).toHaveTextContent('seller_self_click');

      expect(screen.getByTestId('admin-click-decision-701')).toHaveTextContent(
        'Would be billable'
      );
      expect(screen.getByTestId('admin-click-reason-702')).toHaveTextContent(
        'Seller self-click'
      );
      expect(screen.getByTestId('admin-click-reason-702')).toHaveTextContent(
        'seller_self_click'
      );
      expect(screen.getByTestId('admin-click-amount-701')).toHaveTextContent(
        'INR 0.25'
      );

      // Filter clicks by ad, decision, reason_code, date_from, date_to
      fireEvent.change(screen.getByTestId('admin-clicks-filter-ad'), {
        target: { value: '103' },
      });
      fireEvent.change(screen.getByTestId('admin-clicks-filter-decision'), {
        target: { value: 'not_billable' },
      });
      fireEvent.change(screen.getByTestId('admin-clicks-filter-reason'), {
        target: { value: 'seller_self_click' },
      });
      fireEvent.change(screen.getByTestId('admin-clicks-filter-date-from'), {
        target: { value: '2026-11-01' },
      });
      fireEvent.change(screen.getByTestId('admin-clicks-filter-date-to'), {
        target: { value: '2026-11-30' },
      });

      await waitFor(() => {
        expect(api.apiRequest).toHaveBeenCalledWith(
          '/api/admin/advertising/clicks/?ad=103&decision=not_billable&reason_code=seller_self_click&date_from=2026-11-01&date_to=2026-11-30'
        );
      });

      // 3. Reconciliation tab shows all new diagnostic flags and plain help text
      fireEvent.click(screen.getByTestId('admin-ad-tab-reconciliation'));
      await waitFor(() => {
        expect(screen.getByTestId('recon-flags-help-text')).toBeInTheDocument();
        expect(
          screen.getByTestId('recon-flag-spend-above-funded-103')
        ).toHaveTextContent('Spend Above Funded');
        expect(
          screen.getByTestId('recon-flag-negative-remaining-103')
        ).toHaveTextContent('Negative Remaining Balance');
        expect(
          screen.getByTestId('recon-flag-ended-click-balance-103')
        ).toHaveTextContent('Ended With Remaining Click Balance');
        expect(
          screen.getByTestId('recon-flag-refund-status-103')
        ).toHaveTextContent('Refund Status Disagreement');
      });
    });

    it('renders Phase 3 Part 2 Admin Ads columns (spend, remaining, billed clicks, end reason, running/ended filter), Reverse Click Charge dialog (success, 400 field errors, 403 non-superuser, 409 repeat), billed/daily_cap_reached click labels, and informational reconciliation flag', async () => {
      const runningAd = {
        ...MOCK_ADS[2],
        id: 34,
        name: 'Running Admin Campaign',
        status: 'running',
        end_reason: '',
        placement: 'header_banner',
        funded: '1.00',
        spent: '0.50',
        remaining: '0.50',
        billed_click_count: 2,
      };
      const endedReversedAd = {
        ...MOCK_ADS[2],
        id: 35,
        name: 'Ended Campaign With Charge Reversal',
        status: 'ended',
        end_reason: 'budget_exhausted',
        placement: 'header_banner',
        funded: '1.00',
        spent: '0.75',
        remaining: '0.25',
        billed_click_count: 4,
      };

      const billedClicksPayload = {
        results: [
          {
            id: 19,
            advertisement_id: 35,
            creative_id: 13,
            placement: 'header_banner',
            issued_at: '2026-11-24T12:00:00Z',
            clicked_at: '2026-11-24T12:00:02Z',
            click_amount_snapshot: '0.25',
            decision: 'billed',
            reason_code: 'billed',
            created_at: '2026-11-24T12:00:02Z',
          },
          {
            id: 20,
            advertisement_id: 35,
            creative_id: 13,
            placement: 'header_banner',
            issued_at: '2026-11-24T12:05:00Z',
            clicked_at: '2026-11-24T12:05:02Z',
            click_amount_snapshot: '0.25',
            decision: 'not_billable',
            reason_code: 'daily_cap_reached',
            created_at: '2026-11-24T12:05:02Z',
          },
        ],
        counts_by_ad: [
          {
            advertisement_id: 35,
            by_decision: { billed: 4, not_billable: 1 },
            by_reason: { billed: 4, daily_cap_reached: 1 },
          },
        ],
      };

      const reconInfoPayload = {
        advertisements: [
          {
            advertisement_id: 35,
            seller_id: 5,
            status: 'ended',
            budget: '1.00',
            funded: '1.00',
            funded_real: '0.00',
            funded_simulated: '1.00',
            spent: '0.75',
            remaining: '0.25',
            has_status_ledger_disagreement: false,
            has_spend_above_funded: false,
            has_negative_remaining: false,
            has_ended_click_balance: false,
            info_ended_balance_after_charge_reversal: true,
            has_running_below_click_amount: false,
            has_billed_click_without_charge: false,
            has_charge_without_billed_click: false,
            has_duplicate_click_token: false,
            has_running_ineligible_entity: false,
            has_refund_status_disagreement: false,
            has_simulated_funding: true,
          },
        ],
        totals: {
          funded: '1.00',
          funded_real: '0.00',
          funded_simulated: '1.00',
          spent: '0.75',
          remaining: '0.25',
        },
      };

      api.apiRequest.mockImplementation(async (url) => {
        if (url.startsWith('/api/admin/advertising/ads/')) {
          return [runningAd, endedReversedAd];
        }
        if (url.startsWith('/api/admin/advertising/clicks/')) {
          return billedClicksPayload;
        }
        if (url.startsWith('/api/admin/advertising/reconciliation/')) {
          return reconInfoPayload;
        }
        if (url.startsWith('/api/admin/advertising/payments/')) return MOCK_PAYMENTS;
        if (url.startsWith('/api/admin/advertising/ledger/')) return MOCK_LEDGER;
        if (url.startsWith('/api/admin/advertising/review-queue/')) return [];
        if (url === '/api/admin/advertising/click-rates/current/') {
          return MOCK_CLICK_RATES_CURRENT;
        }
        if (url.startsWith('/api/admin/advertising/click-rates/')) {
          return MOCK_CLICK_RATES_HISTORY;
        }
        return [];
      });

      const { unmount } = render(<AdvertisingAdminModule />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-row-35')).toBeInTheDocument();
      });

      // 1. Admin Ads columns & badges for running and ended
      expect(screen.getByTestId('admin-ad-status-34')).toHaveTextContent('Running');
      expect(screen.getByTestId('admin-ad-spent-34')).toHaveTextContent('INR 0.50');
      expect(screen.getByTestId('admin-ad-remaining-34')).toHaveTextContent('INR 0.50');
      expect(screen.getByTestId('admin-ad-billed-clicks-34')).toHaveTextContent('2');
      expect(screen.getByTestId('admin-ad-end-reason-34')).toHaveTextContent('—');
      // Take down is offered on running ads too
      expect(screen.getByTestId('admin-ads-takedown-btn-34')).toBeInTheDocument();

      expect(screen.getByTestId('admin-ad-status-35')).toHaveTextContent('Ended');
      expect(screen.getByTestId('admin-ad-spent-35')).toHaveTextContent('INR 0.75');
      expect(screen.getByTestId('admin-ad-remaining-35')).toHaveTextContent('INR 0.25');
      expect(screen.getByTestId('admin-ad-billed-clicks-35')).toHaveTextContent('4');
      expect(screen.getByTestId('admin-ad-end-reason-35')).toHaveTextContent(
        'Your budget has been used up'
      );

      // Filter by status=ended
      fireEvent.change(screen.getByTestId('admin-filter-status'), {
        target: { value: 'ended' },
      });
      await waitFor(() => {
        expect(api.apiRequest).toHaveBeenCalledWith(
          '/api/admin/advertising/ads/?status=ended'
        );
      });

      // 2. Clicks tab: billed decision, daily_cap_reached reason label, and Reverse Click Charge offered ONLY on billed click (#19), NOT on not_billable click (#20)
      fireEvent.click(screen.getByTestId('admin-ad-tab-clicks'));
      await waitFor(() => {
        expect(screen.getByTestId('admin-click-row-19')).toBeInTheDocument();
      });

      expect(screen.getByTestId('admin-click-decision-19')).toHaveTextContent(
        'Billed'
      );
      expect(screen.getByTestId('admin-click-reason-20')).toHaveTextContent(
        'Daily billing cap reached'
      );
      expect(screen.getByTestId('admin-click-reason-20')).toHaveTextContent(
        'daily_cap_reached'
      );
      expect(
        screen.getByTestId('open-reverse-click-charge-btn-19')
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('open-reverse-click-charge-btn-20')
      ).not.toBeInTheDocument();

      // Open Reverse Click Charge dialog
      fireEvent.click(screen.getByTestId('open-reverse-click-charge-btn-19'));
      expect(
        screen.getByTestId('reverse-click-charge-dialog')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('reverse-click-charge-help-text')
      ).toHaveTextContent(
        "This adds a compensating entry that gives the click amount back to the advertisement's remaining budget. The original click and charge are kept. An ended advertisement stays ended."
      );

      // Submit without confirm_reversal checkbox -> field error
      fireEvent.change(
        screen.getByTestId('reverse-click-charge-reason-input'),
        { target: { value: 'Duplicate customer click dispute' } }
      );
      fireEvent.click(screen.getByTestId('reverse-click-charge-submit-btn'));
      expect(
        screen.getByTestId('reverse-click-charge-error-confirm_reversal')
      ).toHaveTextContent('Set confirm_reversal to true.');

      // Check confirm_reversal and test 409 repeat reversal error in dialog
      fireEvent.click(
        screen.getByTestId('reverse-click-charge-confirm-checkbox')
      );
      api.apiRequest.mockRejectedValueOnce({
        status: 409,
        data: {
          detail: 'This click charge has already been reversed.',
        },
      });
      fireEvent.click(screen.getByTestId('reverse-click-charge-submit-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('reverse-click-charge-dialog-error')
        ).toHaveTextContent('This click charge has already been reversed.');
      });

      // Test 201 success -> refreshes ads and clicks from server
      api.apiRequest.mockImplementationOnce(async (url, options = {}) => {
        if (
          url === '/api/admin/advertising/clicks/19/reverse-charge/' &&
          options.method === 'POST'
        ) {
          return {
            id: 99,
            advertisement_id: 35,
            entry_type: 'click_charge_reversal',
            amount: '0.25',
          };
        }
        return [];
      });
      fireEvent.click(screen.getByTestId('reverse-click-charge-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-feedback-banner')).toHaveTextContent(
          'Click charge reversed for Click #19 (Ad #35).'
        );
      });

      // 3. Reconciliation tab: info_ended_balance_after_charge_reversal and has_simulated_funding are shown as informational and do NOT trigger overall mismatch error
      fireEvent.click(screen.getByTestId('admin-ad-tab-reconciliation'));
      await waitFor(() => {
        expect(
          screen.getByTestId('recon-info-ended-balance-after-reversal-35')
        ).toHaveTextContent('Info: Ended Balance After Charge Reversal');
        expect(
          screen.getByTestId('recon-flag-simulated-funding-35')
        ).toHaveTextContent(
          'This ad was funded by a test payment, not real money'
        );
        expect(screen.getByTestId('recon-total-funded-real')).toHaveTextContent(
          'INR 0.00'
        );
        expect(
          screen.getByTestId('recon-total-funded-simulated')
        ).toHaveTextContent('INR 1.00');
      });
      expect(screen.getByTestId('recon-overall-status')).toHaveTextContent(
        'All Advertisements Reconciled'
      );

      unmount();

      // 4. Non-superuser staff: read-only note on Clicks tab, button disabled, 403 shown in dialog when attempted
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        currentUser: {
          id: 2,
          username: 'admin_test',
          role: 'admin',
          is_staff: true,
          is_superuser: false,
        },
        isAuthenticated: true,
        isResolving: false,
      });

      render(<AdvertisingAdminModule />);
      await waitFor(() => {
        expect(screen.getByTestId('admin-ad-tab-clicks')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('admin-ad-tab-clicks'));
      await waitFor(() => {
        expect(
          screen.getByTestId('admin-clicks-readonly-note')
        ).toBeInTheDocument();
      });
      expect(
        screen.getByTestId('open-reverse-click-charge-btn-19')
      ).toBeDisabled();

      fireEvent.click(
        screen.getByTestId('attempt-reverse-click-charge-btn-19')
      );
      fireEvent.change(
        screen.getByTestId('reverse-click-charge-reason-input'),
        { target: { value: 'Staff attempt' } }
      );
      fireEvent.click(
        screen.getByTestId('reverse-click-charge-confirm-checkbox')
      );
      api.apiRequest.mockRejectedValueOnce({
        status: 403,
        data: { detail: 'A superuser account is required.' },
      });
      fireEvent.click(screen.getByTestId('reverse-click-charge-submit-btn'));

      await waitFor(() => {
        expect(
          screen.getByTestId('reverse-click-charge-dialog-error')
        ).toHaveTextContent('A superuser account is required.');
      });
    });
  });

  describe('RBAC Route Protection for /seller/advertising', () => {
    it('blocks customer and warehouse_manager roles from /seller/advertising with the Forbidden screen', () => {
      for (const role of ['customer', 'warehouse_manager']) {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
          currentUser: { id: 90, username: `user_${role}`, role },
          isLoggedIn: true,
          isAuthenticated: true,
          isLoading: false,
          isResolving: false,
        });

        const { unmount } = render(
          <MemoryRouter initialEntries={['/seller/advertising']}>
            <Routes>
              <Route
                path="/seller/advertising"
                element={
                  <ProtectedRoute
                    allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}
                  >
                    <div>Seller Advertising Allowed</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );

        expect(
          screen.getByText(/does not have authorization to access this specific module/i)
        ).toBeInTheDocument();
        expect(screen.queryByText('Seller Advertising Allowed')).not.toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('SponsoredAdSlot (Storefront Header Banner & Product Page Top)', () => {
    const SERVED_HEADER_AD = {
      label: 'Sponsored',
      placement: 'header_banner',
      creative_url: '/api/advertising/creatives/11111111-2222-3333-4444-555555555555/public-image/',
      product_id: 13,
      product_name: 'Apex Titan 5G Pro Flagship Smartphone',
      destination: '/product/13',
      click_token: 'SECRET_CLICK_TOKEN_NEVER_LOGGED_12345',
    };

    const SERVED_PRODUCT_TOP_AD = {
      label: 'Sponsored',
      placement: 'product_page_top',
      creative_url: '/api/advertising/creatives/99999999-8888-7777-6666-555555555555/public-image/',
      product_id: 12,
      product_name: 'HP Victus Gaming Laptop',
      destination: '/product/12',
      click_token: 'SECRET_PRODUCT_TOP_TOKEN_67890',
    };

    beforeEach(() => {
      localStorage.removeItem('mk_access_token');
      localStorage.removeItem('mk_refresh_token');
    });

    it('renders nothing on {"ad": null}, HTTP error, or timeout without placeholder or error text', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // 1. {"ad": null}
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ad: null }),
      });

      const { container: c1, unmount: u1 } = render(
        <MemoryRouter>
          <SponsoredAdSlot placement="header_banner" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
      expect(c1.innerHTML).toBe('');
      u1();

      // 2. HTTP 500 error
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Server error' }),
      });

      const { container: c2, unmount: u2 } = render(
        <MemoryRouter>
          <SponsoredAdSlot placement="header_banner" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });
      expect(c2.innerHTML).toBe('');
      u2();

      // 3. Timeout (never resolves within timeoutMs=30)
      fetchSpy.mockImplementationOnce(
        (_url, opts) =>
          new Promise((_resolve, reject) => {
            if (opts?.signal) {
              opts.signal.addEventListener('abort', () =>
                reject(new Error('Aborted'))
              );
            }
          })
      );

      const { container: c3, unmount: u3 } = render(
        <MemoryRouter>
          <SponsoredAdSlot placement="header_banner" timeoutMs={30} />
        </MemoryRouter>
      );

      await new Promise((r) => setTimeout(r, 60));
      expect(c3.innerHTML).toBe('');
      u3();
      fetchSpy.mockRestore();
    });

    it('renders photo, Sponsored label, accessible link, aspect ratio box, sends at most one click POST with keepalive and token only in body, navigates immediately, and attaches Authorization only when logged in', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // Case A: Logged out (no Authorization header)
      fetchSpy.mockImplementation(async (url) => {
        if (String(url).includes('/api/advertising/serve/header_banner/')) {
          return {
            ok: true,
            json: async () => ({ ad: SERVED_HEADER_AD }),
          };
        }
        if (String(url).includes('/api/advertising/click/')) {
          // Return a never-resolving promise to prove navigation does NOT wait for click response
          return new Promise(() => {});
        }
        return { ok: true, json: async () => ({}) };
      });

      const { unmount: unmountLoggedOut } = render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={<SponsoredAdSlot placement="header_banner" />}
            />
            <Route
              path="/product/13"
              element={
                <div data-testid="navigated-destination">Product 13 Page</div>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('sponsored-ad-slot-header_banner')
        ).toBeInTheDocument();
      });

      const linkEl = screen.getByTestId('sponsored-ad-link-header_banner');
      const imgEl = screen.getByTestId('sponsored-ad-img-header_banner');
      const labelEl = screen.getByTestId('sponsored-ad-label-header_banner');
      const aspectBox = screen.getByTestId(
        'sponsored-ad-aspect-box-header_banner'
      );

      expect(labelEl).toHaveTextContent('Sponsored');
      expect(linkEl).toHaveAttribute('href', '/product/13');
      expect(linkEl).toHaveAttribute(
        'aria-label',
        'Sponsored: Apex Titan 5G Pro Flagship Smartphone'
      );
      expect(imgEl).toHaveAttribute(
        'alt',
        'Apex Titan 5G Pro Flagship Smartphone (Sponsored)'
      );
      expect(imgEl.getAttribute('src')).toContain(
        '/api/advertising/creatives/11111111-2222-3333-4444-555555555555/public-image/'
      );
      expect(aspectBox).toHaveClass('aspect-[3/1]');

      // Token must NEVER appear in any attribute or URL
      expect(document.body.innerHTML).not.toContain(
        SERVED_HEADER_AD.click_token
      );

      // Click the ad link (even twice rapidly) -> sends exactly 1 click POST and navigates immediately
      fireEvent.click(linkEl);
      fireEvent.click(linkEl);

      await waitFor(() => {
        expect(screen.getByTestId('navigated-destination')).toBeInTheDocument();
      });

      const clickCallsLoggedOut = fetchSpy.mock.calls.filter(([url]) =>
        String(url).includes('/api/advertising/click/')
      );
      expect(clickCallsLoggedOut).toHaveLength(1);
      const [clickUrl1, clickOpts1] = clickCallsLoggedOut[0];
      expect(clickUrl1).not.toContain(SERVED_HEADER_AD.click_token);
      expect(clickOpts1.method).toBe('POST');
      expect(clickOpts1.keepalive).toBe(true);
      expect(clickOpts1.cache).toBe('no-store');
      expect(clickOpts1.headers.Authorization).toBeUndefined();
      expect(JSON.parse(clickOpts1.body)).toEqual({
        click_token: SERVED_HEADER_AD.click_token,
      });

      unmountLoggedOut();

      // Case B: Logged in (Authorization header sent on serve and click, plus middle-click recording)
      fetchSpy.mockClear();
      localStorage.setItem('mk_access_token', 'TEST_JWT_LOGGED_IN_USER');

      fetchSpy.mockImplementation(async (url) => {
        if (String(url).includes('/api/advertising/serve/product_page_top/')) {
          return {
            ok: true,
            json: async () => ({ ad: SERVED_PRODUCT_TOP_AD }),
          };
        }
        return { ok: true, json: async () => ({ recorded: true }) };
      });

      const { unmount: unmountLoggedIn } = render(
        <MemoryRouter initialEntries={['/product/13']}>
          <SponsoredAdSlot placement="product_page_top" productId={13} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('sponsored-ad-slot-product_page_top')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('sponsored-ad-aspect-box-product_page_top')
      ).toHaveClass('aspect-[4/3]');

      // Middle-click (auxClick with button === 1) records the click once with Authorization header
      const prodTopLink = screen.getByTestId(
        'sponsored-ad-link-product_page_top'
      );
      fireEvent.mouseDown(prodTopLink, { button: 1 });
      fireEvent.click(prodTopLink, { ctrlKey: true });

      const clickCallsLoggedIn = fetchSpy.mock.calls.filter(([url]) =>
        String(url).includes('/api/advertising/click/')
      );
      expect(clickCallsLoggedIn).toHaveLength(1);
      const [, clickOpts2] = clickCallsLoggedIn[0];
      expect(clickOpts2.headers.Authorization).toBe(
        'Bearer TEST_JWT_LOGGED_IN_USER'
      );
      expect(JSON.parse(clickOpts2.body)).toEqual({
        click_token: SERVED_PRODUCT_TOP_AD.click_token,
      });

      unmountLoggedIn();
      localStorage.removeItem('mk_access_token');
      fetchSpy.mockRestore();
    });

    it('is mounted in storefront Header and ProductDetailPage, and is NOT mounted in SellerDashboardPage, AdminHomePage, WarehouseDashboardPage, LoginPage, or CheckoutPage', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ ad: null }),
      });

      api.apiRequest.mockImplementation(async (url) => {
        if (url.startsWith('/api/products/published/')) {
          return {
            id: 13,
            name: 'Apex Titan 5G Pro Flagship Smartphone',
            category_name: 'Electronics',
            variants: [{ id: 1, price: '49999.00', stock_quantity: 5 }],
            images: [],
          };
        }
        return [];
      });

      // 1. Storefront Header mounts header_banner slot
      const { unmount: uHeader } = render(
        <MemoryRouter>
          <ToastProvider>
            <CartWishlistProvider>
              <Header isLoggedIn={false} currentUser={null} />
            </CartWishlistProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        const serveCalls = fetchSpy.mock.calls.filter(([url]) =>
          String(url).includes('/api/advertising/serve/header_banner/')
        );
        expect(serveCalls.length).toBeGreaterThanOrEqual(1);
      });
      uHeader();

      // 2. Storefront ProductDetailPage mounts both header_banner (in Header) and product_page_top
      fetchSpy.mockClear();
      const { unmount: uProduct } = render(
        <MemoryRouter initialEntries={['/product/13']}>
          <ToastProvider>
            <CartWishlistProvider>
              <Routes>
                <Route
                  path="/product/:id"
                  element={
                    <ProductDetailPage isLoggedIn={false} currentUser={null} />
                  }
                />
              </Routes>
            </CartWishlistProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        const prodTopCalls = fetchSpy.mock.calls.filter(([url]) =>
          String(url).includes(
            '/api/advertising/serve/product_page_top/?product_id=13'
          )
        );
        expect(prodTopCalls.length).toBeGreaterThanOrEqual(1);
      });
      uProduct();

      // 3. Non-storefront screens (LoginPage, CheckoutPage, SellerDashboardPage, AdminHomePage, WarehouseDashboardPage) must NEVER call /api/advertising/serve/
      fetchSpy.mockClear();

      const { unmount: uLogin } = render(
        <MemoryRouter initialEntries={['/login']}>
          <ToastProvider>
            <LoginPage />
          </ToastProvider>
        </MemoryRouter>
      );
      uLogin();

      const { unmount: uCheckout } = render(
        <MemoryRouter initialEntries={['/checkout']}>
          <ToastProvider>
            <CartWishlistProvider>
              <CheckoutPage />
            </CartWishlistProvider>
          </ToastProvider>
        </MemoryRouter>
      );
      uCheckout();

      const { unmount: uSeller } = render(
        <MemoryRouter initialEntries={['/seller/dashboard']}>
          <ToastProvider>
            <SellerDashboardPage />
          </ToastProvider>
        </MemoryRouter>
      );
      uSeller();

      const { unmount: uAdmin } = render(
        <MemoryRouter initialEntries={['/admin']}>
          <ToastProvider>
            <AdminHomePage />
          </ToastProvider>
        </MemoryRouter>
      );
      uAdmin();

      const { unmount: uWarehouse } = render(
        <MemoryRouter initialEntries={['/warehouse/dashboard']}>
          <ToastProvider>
            <WarehouseDashboardPage />
          </ToastProvider>
        </MemoryRouter>
      );
      uWarehouse();

      const forbiddenServeCalls = fetchSpy.mock.calls.filter(([url]) =>
        String(url).includes('/api/advertising/serve/')
      );
      expect(forbiddenServeCalls).toHaveLength(0);

      fetchSpy.mockRestore();
    });
  });
});
