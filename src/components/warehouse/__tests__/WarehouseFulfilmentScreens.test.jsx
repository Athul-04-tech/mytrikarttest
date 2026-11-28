import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { apiRequest } from '../../../utils/api';
import AuthContext from '../../../context/AuthContext';
import ManagerFulfilmentSection from '../ManagerFulfilmentSection';
import SellerHandoversSection from '../SellerHandoversSection';
import ManagerHandoversSection from '../ManagerHandoversSection';
import ManagerReturnsSection from '../ManagerReturnsSection';
import SellerReturnsSection from '../SellerReturnsSection';
import {
  AdminShipmentsSection,
  AdminStockReconciliationSection,
  AdminHubOperationsSection,
  AdminReturnsSection,
} from '../AdminFulfilmentSection';
import WarehouseDashboardPage from '../../../pages/WarehouseDashboardPage';
import SellerWarehouseView from '../../seller-dashboard/subviews/SellerWarehouseView';
import SellerOrderDetailView from '../../seller-dashboard/subviews/SellerOrderDetailView';
import SellerOrdersView from '../../seller-dashboard/subviews/SellerOrdersView';
import OrdersSection from '../../profile/OrdersSection';
import CartItemRow from '../../cart/CartItemRow';
import ProductDetailPage from '../../../pages/ProductDetailPage';
import { ToastProvider } from '../../../context/ToastContext';
import {
  formatFulfilmentStageLabel,
  isHandoverMarkedOverdueByServer,
} from '../../../utils/warehouseUtils';
import {
  isRouteAllowedForRole,
} from '../../../utils/authRouting';

vi.mock('../../../utils/api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

vi.mock('../../../context/CartWishlistContext', () => ({
  useCart: () => ({
    cart: [],
    wishlist: [],
    addToCart: vi.fn(),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    cartCount: 0,
    wishlistCount: 0,
  }),
}));

describe('Warehouse Fulfilment Screens (Phases A & B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Manager Pick & Pack queue and empty state + 404 hides areas when switches are off
  it('renders manager pick and pack queue with order age, items, SKU, quantity, lot/location text, start picking action, and empty state', async () => {
    apiRequest.mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          vendor_order_id: 401,
          order_id: 109,
          order_number: 'MK-2026-109',
          warehouse_id: 20,
          vendor_id: 5,
          order_status: 'PROCESSING',
          created_at: '2026-11-27T08:00:00Z',
          order_age_seconds: 5400,
          shipment: null,
          items: [
            {
              order_item_id: 77,
              variant_id: 13,
              sku: 'SKU-HP-APEX-16GB-512G',
              product_name: 'Apex Headphones Pro',
              quantity: 2,
              lots: [
                {
                  reservation_id: 91,
                  lot_id: 10,
                  location: 'A1-R2-B3',
                  quantity: 2,
                  status: 'active',
                },
              ],
            },
          ],
        },
      ],
    });

    render(
      <MemoryRouter>
        <ManagerFulfilmentSection />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('queue-order-card-401')).toBeInTheDocument();
    expect(screen.getByText(/Vendor Order #401/i)).toBeInTheDocument();
    expect(screen.getByTestId('queue-order-age-401')).toHaveTextContent('1h 30m');
    expect(screen.getByText('SKU-HP-APEX-16GB-512G')).toBeInTheDocument();
    expect(screen.getByText('Apex Headphones Pro')).toBeInTheDocument();
    expect(screen.getByText(/Lot #10 • A1-R2-B3/i)).toBeInTheDocument();
    expect(screen.getByTestId('start-picking-btn-401')).toBeInTheDocument();

    // Test empty state
    apiRequest.mockResolvedValueOnce({ count: 0, results: [] });
    fireEvent.click(screen.getByTestId('refresh-pick-queue-btn'));
    expect(await screen.findByTestId('pick-queue-empty')).toBeInTheDocument();
    expect(screen.getByText(/No orders ready to pick/i)).toBeInTheDocument();
  });

  it('hides the Pick & Pack area and nav button quietly when backend returns 404 (feature switches off)', async () => {
    apiRequest.mockImplementation((url) => {
      if (url.includes('/api/warehouse/shipments/queue/')) {
        return Promise.reject({
          status: 404,
          data: { detail: 'Warehouse pick and pack is disabled.' },
        });
      }
      if (url.includes('/api/warehouse/me/')) {
        return Promise.resolve({
          warehouse: {
            id: 20,
            code: 'WH-BLR-01',
            name: 'Bengaluru Fulfillment Center',
            city: 'Bengaluru',
            state: 'KA',
            country_code: 'IN',
            is_active: true,
          },
          profile: {
            id: 211,
            username: 'demo_warehouse',
            first_name: 'Demo',
            last_name: 'Manager',
          },
        });
      }
      if (url.includes('/api/warehouse/rate-cards/')) {
        return Promise.resolve({ results: [] });
      }
      if (url.includes('/api/warehouse/storage-requests/')) {
        return Promise.resolve({ results: [] });
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/shipments']}>
        <AuthContext.Provider
          value={{
            isLoggedIn: true,
            currentUser: { id: 211, username: 'demo_warehouse', role: 'warehouse_manager' },
          }}
        >
          <WarehouseDashboardPage
            isLoggedIn={true}
            currentUser={{ id: 211, username: 'demo_warehouse', role: 'warehouse_manager' }}
            onLogout={vi.fn()}
          />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('warehouse-nav-shipments')).not.toBeInTheDocument();
    });
  });

  // 2. Shipment step display, full pick, short-pick dialog with required reason and warning, exception state, and double-click protection
  it('renders shipment step display, handles short-pick dialog with warning and required reason, shows exception status, and protects against double-click', async () => {
    const pickingShipment = {
      id: 301,
      vendor_order_id: 401,
      order_id: 109,
      order_number: 'MK-2026-109',
      warehouse_id: 20,
      vendor_id: 5,
      status: 'picking',
      label_number: 'LBL-2026-301',
      courier_name: '',
      tracking_number: '',
      package: null,
      created_at: '2026-11-27T08:00:00Z',
      lines: [
        {
          id: 501,
          order_item_id: 77,
          sku: 'SKU-HP-APEX-16GB-512G',
          product_name: 'Apex Headphones Pro',
          expected_quantity: 3,
          picked_quantity: 0,
          exception_reason: '',
          lot_reservations: [
            {
              reservation_id: 91,
              lot_id: 10,
              location: 'A1-R2-B3',
              quantity: 3,
              reservation_status: 'active',
            },
          ],
        },
      ],
      events: [],
    };

    apiRequest.mockImplementation((url) => {
      if (url.includes('/api/warehouse/shipments/queue/')) {
        return Promise.resolve({ results: [] });
      }
      if (url.includes('/api/warehouse/shipments/301/')) {
        return Promise.resolve(pickingShipment);
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter>
        <ManagerFulfilmentSection initialShipmentId={301} />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('manager-shipment-detail')).toBeInTheDocument();
    expect(screen.getByTestId('shipment-step-bar')).toBeInTheDocument();
    expect(screen.getByTestId('shipment-step-picking')).toHaveAttribute('data-active', 'true');
    // Pack/Ship forms are not visible while status === 'picking'
    expect(screen.queryByTestId('shipment-pack-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('shipment-ship-form')).not.toBeInTheDocument();

    // Change picked quantity from 3 to 1 (short pick) and click Confirm
    const qtyInput = screen.getByTestId('line-pick-input-501');
    fireEvent.change(qtyInput, { target: { value: '1' } });
    fireEvent.click(screen.getByTestId('confirm-pick-btn-501'));

    // Native <dialog> opens with warning text
    expect(screen.getByTestId('short-pick-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('short-pick-warning-text')).toHaveTextContent(
      'The order will be held for admin action; stock is not changed.'
    );

    // Submit empty reason -> server returns field error under exception_reason
    apiRequest.mockRejectedValueOnce({
      status: 400,
      data: {
        exception_reason: ['A short pick requires an exception reason.'],
      },
    });
    fireEvent.click(screen.getByTestId('short-pick-submit-btn'));
    expect(
      await screen.findByTestId('short-pick-error-exception_reason')
    ).toHaveTextContent('A short pick requires an exception reason.');

    // Enter reason and submit -> verify double-click protection while in flight
    let resolveShortPick;
    apiRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveShortPick = resolve;
      })
    );
    fireEvent.change(screen.getByTestId('short-pick-reason-input'), {
      target: { value: '2 units damaged on shelf' },
    });
    fireEvent.click(screen.getByTestId('short-pick-submit-btn'));
    expect(screen.getByTestId('short-pick-submit-btn')).toBeDisabled();

    resolveShortPick({
      ...pickingShipment,
      status: 'exception',
      lines: [
        {
          ...pickingShipment.lines[0],
          picked_quantity: 1,
          exception_reason: '2 units damaged on shelf',
        },
      ],
    });

    expect(await screen.findByTestId('shipment-exception-banner')).toHaveTextContent(
      '2 units damaged on shelf'
    );
    expect(screen.getByTestId('shipment-step-exception')).toHaveAttribute(
      'data-active',
      'true'
    );
  });

  // 3. Pack form validation errors, Label fetch with auth & print view, Ship & Deliver dialogs, and event history
  it('handles pack validation errors, packs shipment, fetches HTML label with auth into iframe print view, ships with confirmation dialog, and delivers', async () => {
    const pickedShipment = {
      id: 302,
      vendor_order_id: 402,
      order_id: 110,
      order_number: 'MK-2026-110',
      warehouse_id: 20,
      vendor_id: 5,
      status: 'picked',
      label_number: 'LBL-2026-302',
      courier_name: '',
      tracking_number: '',
      package: null,
      created_at: '2026-11-27T08:00:00Z',
      lines: [
        {
          id: 502,
          order_item_id: 78,
          sku: 'SKU-HP-APEX-16GB-512G',
          product_name: 'Apex Headphones Pro',
          expected_quantity: 2,
          picked_quantity: 2,
          exception_reason: '',
          lot_reservations: [],
        },
      ],
      events: [],
    };

    apiRequest.mockImplementation((url) => {
      if (url.includes('/api/warehouse/shipments/queue/')) {
        return Promise.resolve({ results: [] });
      }
      if (url.includes('/api/warehouse/shipments/302/')) {
        return Promise.resolve(pickedShipment);
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter>
        <ManagerFulfilmentSection initialShipmentId={302} />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('shipment-pack-form')).toBeInTheDocument();

    // Submit invalid pack form -> server returns field errors under each field
    apiRequest.mockRejectedValueOnce({
      status: 400,
      data: {
        weight_kg: ['A valid number is required.'],
        length_cm: ['Ensure this value is greater than or equal to 0.001.'],
        width_cm: ['This field is required.'],
        height_cm: ['This field is required.'],
        seal_number: ['This field may not be blank.'],
      },
    });

    fireEvent.click(screen.getByTestId('pack-submit-btn'));

    expect(await screen.findByTestId('pack-error-weight_kg')).toHaveTextContent(
      'A valid number is required.'
    );
    expect(screen.getByTestId('pack-error-length_cm')).toHaveTextContent(
      'Ensure this value is greater than or equal to 0.001.'
    );
    expect(screen.getByTestId('pack-error-seal_number')).toHaveTextContent(
      'This field may not be blank.'
    );

    // Fill valid pack values and submit -> status becomes packed
    const packedShipment = {
      ...pickedShipment,
      status: 'packed',
      packed_at: '2026-11-27T08:30:00Z',
      package: {
        weight_kg: '1.250',
        length_cm: '20.000',
        width_cm: '15.000',
        height_cm: '10.000',
        seal_number: 'SEAL-9988',
        packaging_note: 'Double boxed',
      },
    };
    apiRequest.mockResolvedValueOnce(packedShipment);

    fireEvent.change(screen.getByTestId('pack-weight-input'), { target: { value: '1.250' } });
    fireEvent.change(screen.getByTestId('pack-length-input'), { target: { value: '20.000' } });
    fireEvent.change(screen.getByTestId('pack-width-input'), { target: { value: '15.000' } });
    fireEvent.change(screen.getByTestId('pack-height-input'), { target: { value: '10.000' } });
    fireEvent.change(screen.getByTestId('pack-seal-input'), { target: { value: 'SEAL-9988' } });
    fireEvent.click(screen.getByTestId('pack-submit-btn'));

    expect(await screen.findByTestId('shipment-package-summary')).toBeInTheDocument();
    expect(screen.getByTestId('shipment-package-seal')).toHaveTextContent('SEAL-9988');
    expect(screen.getByTestId('shipment-print-label-btn')).toBeInTheDocument();
    expect(screen.getByTestId('shipment-ship-form')).toBeInTheDocument();

    // Click Print label -> fetches HTML via authenticated apiRequest and renders iframe
    const labelHtml =
      '<!doctype html><html><body><h1>MytriKart Shipping Label</h1><p>Label LBL-2026-302</p></body></html>';
    apiRequest.mockResolvedValueOnce({ message: labelHtml });
    fireEvent.click(screen.getByTestId('shipment-print-label-btn'));

    expect(await screen.findByTestId('shipment-label-iframe')).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith('/api/warehouse/shipments/302/label/');

    // Fill courier and tracking, open Ship confirmation dialog
    fireEvent.change(screen.getByTestId('ship-courier-input'), {
      target: { value: 'BlueDart Express' },
    });
    fireEvent.change(screen.getByTestId('ship-tracking-input'), {
      target: { value: 'BD9988776655' },
    });
    fireEvent.click(screen.getByTestId('open-ship-confirm-btn'));

    expect(screen.getByTestId('ship-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('ship-confirm-warning-text')).toHaveTextContent(
      'This takes the goods out of stock and marks the order shipped.'
    );

    const shippedShipment = {
      ...packedShipment,
      status: 'shipped',
      courier_name: 'BlueDart Express',
      tracking_number: 'BD9988776655',
      shipped_at: '2026-11-27T09:00:00Z',
    };
    apiRequest.mockResolvedValueOnce(shippedShipment);
    fireEvent.click(screen.getByTestId('ship-confirm-submit-btn'));

    expect(await screen.findByTestId('open-deliver-confirm-btn')).toBeInTheDocument();

    // Open Deliver confirmation dialog and confirm
    fireEvent.click(screen.getByTestId('open-deliver-confirm-btn'));
    expect(screen.getByTestId('deliver-confirm-dialog')).toBeInTheDocument();

    const deliveredShipment = {
      ...shippedShipment,
      status: 'delivered',
      delivered_at: '2026-11-27T14:00:00Z',
      events: [
        {
          id: 11,
          event: 'delivered',
          before_status: 'shipped',
          after_status: 'delivered',
          actor_username: 'demo_warehouse',
          note: 'Handed to recipient',
          occurred_at: '2026-11-27T14:00:00Z',
        },
      ],
    };
    apiRequest.mockResolvedValueOnce(deliveredShipment);
    fireEvent.click(screen.getByTestId('deliver-confirm-submit-btn'));

    expect(await screen.findByTestId('shipment-event-row-11')).toHaveTextContent(
      'Handed to recipient'
    );
  });

  // 4. Admin shipments list + filters + event log, and Stock Reconciliation read-only for staff vs correction form for superuser
  it('renders admin shipments list with filters and event log, and enforces superuser-only stock correction form on reconciliation report', async () => {
    apiRequest.mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 302,
          vendor_order_id: 402,
          order_id: 110,
          order_number: 'MK-2026-110',
          warehouse_id: 20,
          vendor_id: 5,
          status: 'shipped',
          label_number: 'LBL-2026-302',
          courier_name: 'BlueDart Express',
          tracking_number: 'BD9988776655',
          events: [
            {
              id: 10,
              event: 'shipped',
              before_status: 'packed',
              after_status: 'shipped',
              actor_username: 'demo_warehouse',
              note: 'Dispatched with BlueDart',
              occurred_at: '2026-11-27T09:00:00Z',
            },
          ],
        },
      ],
    });

    render(<AdminShipmentsSection warehouses={[{ id: 20, name: 'Bengaluru WH' }]} />);

    expect(await screen.findByTestId('admin-shipment-card-302')).toBeInTheDocument();
    expect(screen.getByTestId('admin-shipment-events-302')).toHaveTextContent(
      'Dispatched with BlueDart'
    );

    // Test AdminStockReconciliationSection as non-superuser staff admin
    const reconciliationRows = [
      {
        variant_id: 13,
        sku: 'SKU-HP-APEX-16GB-512G',
        vendor_id: 5,
        warehouse_id: 20,
        seller_stock: 2,
        open_request_holds: [
          {
            request_id: 15,
            status: 'recall_pending',
            item_id: 15,
            held_quantity: 0,
            requested_quantity: 1,
            accepted_quantity: 1,
          },
        ],
        lots: [
          {
            lot_id: 9,
            available: 0,
            reserved: 0,
            quarantined: 1,
            verified: false,
            kind: 'quarantine',
            legacy_unverified: true,
            likely_double_count: true,
          },
        ],
        unverified_lot_quantity: 1,
        stuck_paid_cancellation_reservations: [],
        overage_shortfalls: [],
      },
    ];

    apiRequest.mockResolvedValueOnce(reconciliationRows);
    const { unmount } = render(
      <AuthContext.Provider
        value={{
          currentUser: { id: 50, username: 'admin_test', is_staff: true, is_superuser: false },
        }}
      >
        <AdminStockReconciliationSection />
      </AuthContext.Provider>
    );

    expect(await screen.findByTestId('recon-row-13-20')).toBeInTheDocument();
    expect(screen.getByTestId('recon-flag-double-count-13')).toBeInTheDocument();
    expect(screen.getByTestId('recon-flag-unverified-13')).toBeInTheDocument();
    expect(screen.getByTestId('reconciliation-readonly-note')).toBeInTheDocument();
    expect(screen.queryByTestId('correct-seller-stock-form')).not.toBeInTheDocument();
    unmount();

    // Now render as Superuser -> correction form is shown and uses native <dialog> confirmation
    apiRequest.mockResolvedValueOnce(reconciliationRows);
    render(
      <AuthContext.Provider
        value={{
          currentUser: { id: 1, username: 'root_super', is_staff: true, is_superuser: true },
        }}
      >
        <AdminStockReconciliationSection />
      </AuthContext.Provider>
    );

    expect(await screen.findByTestId('correct-seller-stock-form')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('correct-variant-id-input'), {
      target: { value: '13' },
    });
    fireEvent.change(screen.getByTestId('correct-stock-quantity-input'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByTestId('correct-reason-input'), {
      target: { value: 'Reconciled physical shelf count after legacy lot review' },
    });
    fireEvent.click(screen.getByTestId('open-correct-stock-confirm-btn'));

    expect(screen.getByTestId('correct-stock-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('correct-stock-audit-warning')).toHaveTextContent(
      /audited and permanent/i
    );

    apiRequest.mockResolvedValueOnce({
      variant_id: 13,
      before_quantity: 2,
      stock_quantity: 4,
      quantity_delta: 2,
      reason: 'Reconciled physical shelf count after legacy lot review',
      movement_id: 77,
    });
    apiRequest.mockResolvedValueOnce(reconciliationRows);

    fireEvent.click(screen.getByTestId('confirm-correct-stock-submit-btn'));
    expect(await screen.findByTestId('reconciliation-feedback-banner')).toHaveTextContent(
      'Corrected seller stock for variant #13: 2 → 4'
    );
  });

  // 5. Seller confirm-return dialog, required receipt reference, success state, and 409 repeat attempt
  it('renders seller Confirm goods received back button and dialog on recalled request, displays returned stock result, and shows 409 calmly on repeat attempt', async () => {
    const recalledRequestDetail = {
      id: 17,
      vendor: 5,
      warehouse: {
        id: 20,
        name: 'Bengaluru Fulfillment Center',
        code: 'WH-BLR-01',
      },
      status: 'recalled',
      decline_reason: 'Packaging damaged on arrival',
      recall_reference: 'RCL-2026-17',
      recalled_at: '2026-11-27T09:00:00Z',
      handback_confirmed_at: null,
      refund_due: true,
      items: [
        {
          id: 17,
          variant: 50,
          sku_snapshot: 'sku-hhx-lap-9954',
          product_name_snapshot: 'ProBook Laptop',
          requested_quantity: 1,
          accepted_quantity: 1,
          held_quantity: 1,
          returned_quantity: 0,
        },
      ],
      status_logs: [],
    };

    apiRequest.mockImplementation((url) => {
      if (url.includes('/api/warehouse/available/')) {
        return Promise.resolve({ results: [] });
      }
      if (url.includes('/api/warehouse/storage-requests/17/')) {
        return Promise.resolve(recalledRequestDetail);
      }
      if (url.includes('/api/warehouse/storage-requests/')) {
        return Promise.resolve({ results: [recalledRequestDetail] });
      }
      if (url.includes('/api/warehouse/lots/')) {
        return Promise.resolve({ results: [] });
      }
      if (url.includes('/api/warehouse/handovers/')) {
        return Promise.resolve({ results: [] });
      }
      if (url.includes('/api/vendors/me/products/')) {
        return Promise.resolve({ results: [] });
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter>
        <SellerWarehouseView />
      </MemoryRouter>
    );

    const viewBtn = await screen.findByTestId('seller-view-request-btn-17');
    fireEvent.click(viewBtn);

    const confirmBtn = await screen.findByTestId('seller-confirm-return-btn');
    fireEvent.click(confirmBtn);

    expect(screen.getByTestId('seller-confirm-return-dialog')).toBeInTheDocument();

    // Test 409 repeat attempt message displayed calmly
    apiRequest.mockRejectedValueOnce({
      status: 409,
      data: {
        detail: 'Seller handback has already been confirmed for this storage request.',
      },
    });

    fireEvent.change(screen.getByTestId('seller-confirm-return-receipt-input'), {
      target: { value: 'RCPT-2026-901' },
    });
    fireEvent.click(screen.getByTestId('seller-confirm-return-submit-btn'));

    expect(
      await screen.findByTestId('seller-confirm-return-general-error')
    ).toHaveTextContent(
      'Seller handback has already been confirmed for this storage request.'
    );

    // Now test successful confirmation
    const confirmedDetail = {
      ...recalledRequestDetail,
      handback_confirmed_at: '2026-11-27T10:30:00Z',
      items: [
        {
          ...recalledRequestDetail.items[0],
          held_quantity: 0,
          returned_quantity: 1,
        },
      ],
    };
    apiRequest.mockImplementation((url, opts) => {
      if (url.includes('/confirm-return/') && opts?.method === 'POST') {
        return Promise.resolve({
          request_id: 17,
          status: 'recalled',
          handback_confirmed_at: '2026-11-27T10:30:00Z',
          receipt_reference: 'RCPT-2026-901',
          returned_items: [
            {
              item_id: 17,
              variant_id: 50,
              returned_quantity: 1,
              seller_stock_after: 16,
            },
          ],
          request: confirmedDetail,
        });
      }
      if (url.includes('/api/warehouse/storage-requests/17/')) {
        return Promise.resolve(confirmedDetail);
      }
      if (url.includes('/api/warehouse/storage-requests/')) {
        return Promise.resolve({ results: [confirmedDetail] });
      }
      return Promise.resolve({ results: [] });
    });

    fireEvent.click(screen.getByTestId('seller-confirm-return-submit-btn'));

    expect(await screen.findByTestId('seller-handback-confirmed-panel')).toHaveTextContent(
      'RCPT-2026-901'
    );
    expect(screen.getByTestId('seller-handback-returned-stock')).toHaveTextContent(
      'Returned quantity 1'
    );
  });

  // 6. Seller order detail shipment, Customer order detail shipments, old orders without shipment fields, and availability display
  it('shows shipment tracking on seller and customer orders when present, behaves cleanly on old orders without shipment fields, and shows available_quantity + Ships from our warehouse', async () => {
    // A. SellerOrderDetailView with shipment
    apiRequest.mockResolvedValueOnce({
      id: 402,
      vendor_order_status: 'shipped',
      total_amount: '2499.00',
      created_at: '2026-11-27T08:00:00Z',
      items: [],
      shipment: {
        status: 'shipped',
        courier_name: 'BlueDart Express',
        tracking_number: 'BD9988776655',
        shipped_at: '2026-11-27T09:00:00Z',
        delivered_at: null,
      },
    });

    const { unmount: unmountSeller } = render(
      <ToastProvider>
        <SellerOrderDetailView orderId={402} onBack={vi.fn()} />
      </ToastProvider>
    );

    expect(await screen.findByTestId('seller-order-shipment-tracking')).toBeInTheDocument();
    expect(screen.getByTestId('seller-order-shipment-courier')).toHaveTextContent(
      'BlueDart Express'
    );
    expect(screen.getByTestId('seller-order-shipment-tracking-number')).toHaveTextContent(
      'BD9988776655'
    );
    unmountSeller();

    // B. SellerOrderDetailView on old order without shipment (null)
    apiRequest.mockResolvedValueOnce({
      id: 400,
      vendor_order_status: 'processing',
      total_amount: '999.00',
      created_at: '2026-11-20T08:00:00Z',
      items: [],
      shipment: null,
    });

    const { unmount: unmountOldSeller } = render(
      <ToastProvider>
        <SellerOrderDetailView orderId={400} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('seller-order-shipment-tracking')).not.toBeInTheDocument();
    });
    unmountOldSeller();

    // C. Customer OrdersSection with shipments array and older order without shipments
    const { unmount: unmountCustomer } = render(
      <MemoryRouter>
        <ToastProvider>
          <OrdersSection
            orders={[
              {
                id: 'MK-110',
                realOrderId: 110,
                status: 'Shipped',
                statusType: 'shipped',
                date: '27 Nov 2026',
                total: '₹2,499.00',
                grand_total: '2499.00',
                currency: 'INR',
                items: [],
                shipments: [
                  {
                    vendor_order_id: 402,
                    status: 'shipped',
                    courier_name: 'BlueDart Express',
                    tracking_number: 'BD9988776655',
                    shipped_at: '2026-11-27T09:00:00Z',
                    delivered_at: null,
                  },
                ],
              },
              {
                id: 'MK-101',
                realOrderId: 101,
                status: 'Delivered',
                statusType: 'delivered',
                date: '10 Nov 2026',
                total: '₹599.00',
                grand_total: '599.00',
                currency: 'INR',
                items: [],
              },
            ]}
          />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('customer-order-shipments-110')).toBeInTheDocument();
    expect(screen.getByTestId('customer-shipment-courier-110-402')).toHaveTextContent(
      'BlueDart Express'
    );
    expect(screen.getByTestId('customer-shipment-tracking-110-402')).toHaveTextContent(
      'BD9988776655'
    );
    expect(screen.queryByTestId('customer-order-shipments-101')).not.toBeInTheDocument();
    unmountCustomer();

    // D. CartItemRow availability display with available_quantity and fulfilment_source === 'stored'
    const { unmount: unmountCartStored } = render(
      <CartItemRow
        item={{
          id: 88,
          name: 'Apex Headphones Pro',
          vendorName: 'AudioTech India',
          variant: 'Black',
          price: '2499.00',
          currency: 'INR',
          quantity: 1,
          availableQuantity: 7,
          fulfilmentSource: 'stored',
        }}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
        onSaveForLater={vi.fn()}
      />
    );

    expect(screen.getByTestId('cart-item-available-qty-88')).toHaveTextContent('Available: 7');
    expect(screen.getByTestId('cart-item-fulfilment-stored-88')).toHaveTextContent(
      'Ships from our warehouse'
    );
    unmountCartStored();

    // E. ProductDetailPage with available_quantity and fulfilment_source === 'stored'
    apiRequest.mockImplementation((url) => {
      if (url.includes('/api/products/published/55/')) {
        return Promise.resolve({
          id: 55,
          name: 'Apex Headphones Pro',
          category_name: 'Audio',
          description: 'Flagship headphones',
          images: [],
          variants: [
            {
              id: 13,
              sku_code: 'SKU-HP-APEX-16GB-512G',
              price: '2499.00',
              stock_quantity: 2,
              available_quantity: 5,
              fulfilment_source: 'stored',
              attributes: { Color: 'Obsidian' },
            },
          ],
        });
      }
      if (url.includes('/api/products/55/reviews/')) {
        return Promise.resolve({ results: [] });
      }
      return Promise.resolve({ ad: null });
    });

    render(
      <MemoryRouter initialEntries={['/product/55']}>
        <AuthContext.Provider value={{ isLoggedIn: false, currentUser: null }}>
          <ToastProvider>
            <Routes>
              <Route
                path="/product/:id"
                element={
                  <ProductDetailPage
                    isLoggedIn={false}
                    currentUser={null}
                    onLogout={vi.fn()}
                    deliveryLocation={{ city: 'Bengaluru', pincode: '560001' }}
                    setDeliveryLocation={vi.fn()}
                  />
                }
              />
            </Routes>
          </ToastProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('variant-available-quantity')).toHaveTextContent(
      'Available: 5'
    );
    expect(screen.getByTestId('variant-fulfilment-stored')).toHaveTextContent(
      'Ships from our warehouse'
    );
  });

  // 7. Phase C & D: Fulfilment stage wording for every known code and unknown code, customer cancel parcel dialog + refund breakdown, and refused states
  it('formats every fulfilment stage code and unknown code, handles customer cancel parcel dialog and verbatim refund breakdown, and hides button on shipped/delivered/held parcels', async () => {
    // Stage wording checks
    expect(formatFulfilmentStageLabel('awaiting_dispatch_to_hub')).toBe(
      'Waiting for the seller to send it to our warehouse'
    );
    expect(formatFulfilmentStageLabel('in_transit_to_hub')).toBe(
      'On its way to our warehouse'
    );
    expect(formatFulfilmentStageLabel('received_at_hub')).toBe(
      'Received at our warehouse'
    );
    expect(formatFulfilmentStageLabel('packed')).toBe('Packed');
    expect(formatFulfilmentStageLabel('shipped')).toBe('Shipped');
    expect(formatFulfilmentStageLabel('delivered')).toBe('Delivered');
    expect(formatFulfilmentStageLabel('cancelled')).toBe('Cancelled');
    expect(formatFulfilmentStageLabel('custom_future_stage')).toBe(
      'custom_future_stage'
    );

    render(
      <MemoryRouter>
        <ToastProvider>
          <OrdersSection
            orders={[
              {
                id: 'MK-500',
                realOrderId: 500,
                status: 'Paid',
                statusType: 'processing',
                payment_status: 'paid',
                date: '28 Nov 2026',
                total: 'INR 3500.00',
                grand_total: '3500.00',
                currency: 'INR',
                items: [],
                fulfilment_stages: [
                  { vendor_order_id: 601, stage: 'awaiting_dispatch_to_hub' },
                  { vendor_order_id: 602, stage: 'shipped' },
                  { vendor_order_id: 603, stage: 'delivered' },
                  { vendor_order_id: 604, stage: 'custom_unknown_stage' },
                ],
                shipments: [
                  {
                    vendor_order_id: 602,
                    status: 'shipped',
                    courier_name: 'Delhivery',
                    tracking_number: 'DLV-602',
                  },
                  {
                    vendor_order_id: 603,
                    status: 'delivered',
                    courier_name: 'Delhivery',
                    tracking_number: 'DLV-603',
                  },
                  {
                    vendor_order_id: 605,
                    status: 'exception',
                    courier_name: '',
                    tracking_number: '',
                  },
                ],
              },
            ]}
          />
        </ToastProvider>
      </MemoryRouter>
    );

    // Check plain words for stages
    expect(screen.getByTestId('customer-parcel-stage-601')).toHaveTextContent(
      'Waiting for the seller to send it to our warehouse'
    );
    expect(screen.getByTestId('customer-parcel-stage-602')).toHaveTextContent(
      'Shipped'
    );
    expect(screen.getByTestId('customer-parcel-stage-603')).toHaveTextContent(
      'Delivered'
    );
    expect(screen.getByTestId('customer-parcel-stage-604')).toHaveTextContent(
      'custom_unknown_stage'
    );

    // Shipped (602), Delivered (603), and Held/Short-pick (605) must NOT show Cancel this parcel button
    expect(
      screen.queryByTestId('customer-cancel-parcel-btn-602')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('customer-cancel-parcel-btn-603')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('customer-cancel-parcel-btn-605')
    ).not.toBeInTheDocument();
    // Held parcel (605) shows calm line
    expect(screen.getByTestId('customer-parcel-held-note-605')).toHaveTextContent(
      'This parcel is being looked into by our team'
    );

    // Cancel parcel 601
    fireEvent.click(screen.getByTestId('customer-cancel-parcel-btn-601'));
    expect(
      screen.getByTestId('customer-cancel-parcel-dialog')
    ).toBeInTheDocument();

    // Test 400 validation error when reason is empty
    apiRequest.mockRejectedValueOnce({
      status: 400,
      data: { detail: ['A cancellation reason is required.'] },
    });
    fireEvent.click(screen.getByTestId('customer-cancel-parcel-submit-btn'));
    expect(
      await screen.findByTestId('customer-cancel-parcel-general-error')
    ).toHaveTextContent('A cancellation reason is required.');

    // Now submit valid reason and verify verbatim refund breakdown
    apiRequest.mockResolvedValueOnce({
      vendor_order_id: 601,
      status: 'cancelled',
      idempotent_replay: false,
      refund_request: {
        id: 901,
        amount: '1245.50',
        currency: 'INR',
        status: 'pending',
        breakdown: {
          items_including_tax: '1250.00',
          item_tax: '190.68',
          coupon_discount_share: '50.00',
          packaging_fee_including_tax: '15.50',
          delivery_fee_including_tax: '30.00',
        },
      },
    });

    fireEvent.change(screen.getByTestId('customer-cancel-parcel-reason-input'), {
      target: { value: 'Ordered wrong color variant by mistake' },
    });
    fireEvent.click(screen.getByTestId('customer-cancel-parcel-submit-btn'));

    expect(
      await screen.findByTestId('customer-parcel-refund-summary-601')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('customer-parcel-refund-amount-601')
    ).toHaveTextContent('INR 1245.50');
    expect(
      screen.getByTestId('customer-parcel-refund-status-601')
    ).toHaveTextContent('pending');
    expect(
      screen.getByTestId(
        'customer-parcel-refund-line-601-items_including_tax'
      )
    ).toHaveTextContent('INR 1250.00');
    expect(
      screen.getByTestId(
        'customer-parcel-refund-line-601-coupon_discount_share'
      )
    ).toHaveTextContent('INR 50.00');
    expect(
      screen.getByTestId(
        'customer-parcel-refund-line-601-packaging_fee_including_tax'
      )
    ).toHaveTextContent('INR 15.50');
    expect(
      screen.getByTestId(
        'customer-parcel-refund-line-601-delivery_fee_including_tax'
      )
    ).toHaveTextContent('INR 30.00');
  });

  // 8. Phase D: Seller handovers list, no-hub message, slip fetch with auth, mark as sent validation and idempotent result
  it('renders seller handovers list, shows no-hub message with nothing actionable when hub is missing, fetches handover slip HTML with auth, and marks handover as sent', async () => {
    const handoversData = [
      {
        id: 701,
        handover_number: 'HND-2026-701',
        vendor_order_id: 601,
        order_number: 'MK-2026-500',
        status: 'awaiting_dispatch',
        deadline_at: '2026-11-30T08:00:00Z',
        sent_at: null,
        received_at: null,
        courier_name: '',
        tracking_number: '',
        hub: {
          id: 20,
          name: 'Bengaluru Central Hub',
          address_line1: 'Plot 42, Peenya Industrial Area',
          address_line2: 'Phase 2',
          city: 'Bengaluru',
          state: 'KA',
          postal_code: '560058',
          country: 'IN',
        },
        lines: [
          {
            id: 801,
            sku: 'SKU-JACKET-L',
            product_name: 'Artisan Jacket',
            expected_quantity: 2,
            received_quantity: null,
            condition: '',
            note: '',
          },
        ],
      },
      {
        id: 702,
        handover_number: 'HND-2026-702',
        vendor_order_id: 602,
        order_number: 'MK-2026-501',
        status: 'awaiting_dispatch',
        deadline_at: '2026-11-30T10:00:00Z',
        sent_at: null,
        received_at: null,
        courier_name: '',
        tracking_number: '',
        hub: null,
        lines: [],
      },
    ];

    apiRequest.mockResolvedValueOnce({ results: handoversData });

    render(<SellerHandoversSection />);

    expect(
      await screen.findByTestId('seller-handover-card-701')
    ).toBeInTheDocument();
    expect(screen.getByTestId('seller-handover-hub-701')).toHaveTextContent(
      'Bengaluru Central Hub'
    );
    expect(screen.getByTestId('seller-handover-no-hub-702')).toHaveTextContent(
      'No hub is assigned. Contact support to assign a hub.'
    );

    // Open no-hub handover 702 -> shows server message and no print slip or mark-sent form
    fireEvent.click(screen.getByTestId('open-seller-handover-btn-702'));
    expect(
      screen.getByTestId('seller-handover-no-hub-banner')
    ).toHaveTextContent('No hub is assigned. Contact support to assign a hub.');
    expect(
      screen.queryByTestId('print-handover-slip-btn')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('handover-mark-sent-form')
    ).not.toBeInTheDocument();

    // Go back and open handover 701 with assigned hub
    fireEvent.click(screen.getByTestId('back-to-handovers-list-btn'));
    fireEvent.click(screen.getByTestId('open-seller-handover-btn-701'));

    // Print handover slip -> fetches HTML with auth token into isolated iframe
    const slipHtml =
      '<!doctype html><html><body><h1>Handover slip</h1><p>HND-2026-701</p></body></html>';
    apiRequest.mockResolvedValueOnce({ message: slipHtml });
    fireEvent.click(screen.getByTestId('print-handover-slip-btn'));

    expect(
      await screen.findByTestId('handover-slip-iframe')
    ).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith('/api/warehouse/handovers/701/slip/');

    // Mark as sent validation error (400)
    fireEvent.click(screen.getByTestId('open-handover-send-dialog-btn'));
    expect(
      screen.getByTestId('handover-send-confirm-dialog')
    ).toBeInTheDocument();

    apiRequest.mockRejectedValueOnce({
      status: 400,
      data: { detail: 'Courier name and tracking number are required.' },
    });
    fireEvent.click(screen.getByTestId('confirm-handover-send-submit-btn'));
    expect(
      await screen.findByTestId('handover-send-general-error')
    ).toHaveTextContent('Courier name and tracking number are required.');

    // Fill courier and tracking and submit -> transitions to in_transit (idempotent)
    fireEvent.change(screen.getByTestId('handover-courier-input'), {
      target: { value: 'DTDC Express' },
    });
    fireEvent.change(screen.getByTestId('handover-tracking-input'), {
      target: { value: 'DTDC-778899' },
    });

    apiRequest.mockResolvedValueOnce({
      ...handoversData[0],
      status: 'in_transit',
      sent_at: '2026-11-28T06:00:00Z',
      courier_name: 'DTDC Express',
      tracking_number: 'DTDC-778899',
    });
    fireEvent.click(screen.getByTestId('confirm-handover-send-submit-btn'));

    expect(
      await screen.findByTestId('seller-handover-action-banner')
    ).toHaveTextContent('DTDC-778899');
    expect(screen.getByTestId('detail-handover-status')).toHaveTextContent(
      'In Transit'
    );
  });

  // 9. Phase D: Seller vendor-order confirm returned goods success & 409, privacy omission of customer fields, and no refund amounts shown to seller
  it('renders seller order without customer/address blocks when omitted (privacy on, no undefined/null text, no refund amounts) and handles vendor-order confirm-return success and 409', async () => {
    apiRequest.mockResolvedValueOnce({
      id: 601,
      order_number: 'MK-2026-500',
      status: 'cancelled',
      payment_status: 'paid',
      currency: 'INR',
      subtotal: '1000.00',
      tax_total: '180.00',
      shipping_total: '0.00',
      grand_total: '1180.00',
      created_at: '2026-11-28T04:00:00Z',
      customer: null,
      shipping_address: null,
      shipment: null,
      fulfilment_stage: 'cancelled',
      items: [
        {
          id: 91,
          product_name_snapshot: 'Artisan Jacket',
          sku_snapshot: 'SKU-JACKET-L',
          quantity: 2,
          unit_price: '500.00',
          line_total: '1000.00',
        },
      ],
    });

    const { container } = render(
      <ToastProvider>
        <SellerOrderDetailView orderId={601} onBack={vi.fn()} />
      </ToastProvider>
    );

    expect(
      await screen.findByTestId('seller-order-privacy-note')
    ).toHaveTextContent('Customer details are handled by our warehouse team.');
    expect(
      screen.getByTestId('seller-order-fulfilment-stage')
    ).toHaveTextContent('Cancelled');

    // Verify no "undefined" or "null" text anywhere in the rendered output, and no Customer/Shipping Address card titles
    expect(container.textContent).not.toMatch(/undefined/i);
    expect(container.textContent).not.toMatch(/\bnull\b/i);
    expect(screen.queryByText('Shipping Address')).not.toBeInTheDocument();

    // Confirm returned goods dialog on cancelled parcel
    fireEvent.click(screen.getByTestId('seller-order-confirm-return-btn'));
    expect(
      screen.getByTestId('seller-order-confirm-return-dialog')
    ).toBeInTheDocument();

    // Test 409 repeat attempt
    apiRequest.mockRejectedValueOnce({
      status: 409,
      data: { detail: 'This return receipt was already applied.' },
    });
    fireEvent.change(screen.getByTestId('seller-order-return-receipt-input'), {
      target: { value: 'HUB-RET-601' },
    });
    fireEvent.click(screen.getByTestId('seller-order-return-submit-btn'));

    expect(
      await screen.findByTestId('seller-order-return-general-error')
    ).toHaveTextContent('This return receipt was already applied.');

    // Test success
    apiRequest.mockResolvedValueOnce({
      vendor_order_id: 601,
      returned_quantities: [
        {
          order_item_id: 91,
          returned_quantity: 2,
          held_quantity: 2,
        },
      ],
    });
    fireEvent.click(screen.getByTestId('seller-order-return-submit-btn'));

    expect(
      await screen.findByTestId('seller-order-return-confirmed-panel')
    ).toHaveTextContent('Returned quantity 2');
  });

  // 10. Phase D: Hub manager inbox and receive with accept (creates shipment) and reject (cancels order & refunds customer)
  it('renders hub manager expected handovers inbox, finds by handover number, and submits accept and reject decisions showing server results', async () => {
    const inboxRow = {
      id: 701,
      handover_number: 'HND-2026-701',
      vendor_order_id: 601,
      order_number: 'MK-2026-500',
      status: 'in_transit',
      deadline_at: '2026-11-30T08:00:00Z',
      sent_at: '2026-11-28T06:00:00Z',
      courier_name: 'DTDC Express',
      tracking_number: 'DTDC-778899',
      hub: { id: 20, name: 'Bengaluru Central Hub' },
      lines: [
        {
          id: 801,
          sku: 'SKU-JACKET-L',
          product_name: 'Artisan Jacket',
          expected_quantity: 2,
          received_quantity: null,
          condition: '',
          note: '',
        },
      ],
    };

    apiRequest.mockResolvedValueOnce({ results: [inboxRow] });
    const onOpenShipment = vi.fn();

    render(<ManagerHandoversSection onOpenShipment={onOpenShipment} />);

    expect(await screen.findByTestId('hub-handover-card-701')).toBeInTheDocument();

    // Find by handover number
    fireEvent.change(screen.getByTestId('hub-handover-search-input'), {
      target: { value: 'HND-2026-701' },
    });
    fireEvent.click(screen.getByTestId('hub-handover-find-btn'));

    expect(
      await screen.findByTestId('hub-handover-receive-view')
    ).toBeInTheDocument();

    // Test Reject flow with required reason in native <dialog>
    fireEvent.change(screen.getByTestId('hub-receive-qty-input-801'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('hub-receive-condition-select-801'), {
      target: { value: 'damaged' },
    });
    fireEvent.click(screen.getByTestId('hub-open-reject-dialog-btn'));

    expect(
      screen.getByTestId('hub-reject-handover-dialog')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('hub-reject-handover-warning')
    ).toHaveTextContent(
      'Rejecting this handover cancels the seller parcel and refunds the customer.'
    );

    // Reject validation error when reason is missing
    apiRequest.mockRejectedValueOnce({
      status: 400,
      data: { detail: { reason: ['Reject requires a discrepancy and a reason.'] } },
    });
    fireEvent.click(screen.getByTestId('hub-confirm-reject-submit-btn'));
    expect(
      await screen.findByTestId('hub-reject-error-reason')
    ).toHaveTextContent('Reject requires a discrepancy and a reason.');

    // Now test Accept flow -> returns shipment_id and transitions to shipment screen
    fireEvent.click(screen.getByLabelText('Close reject handover dialog'));
    fireEvent.change(screen.getByTestId('hub-receive-qty-input-801'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByTestId('hub-receive-condition-select-801'), {
      target: { value: 'good' },
    });

    apiRequest.mockResolvedValueOnce({
      handover: { ...inboxRow, status: 'received' },
      shipment_id: 950,
    });
    apiRequest.mockResolvedValueOnce({ results: [] });

    fireEvent.click(screen.getByTestId('hub-accept-handover-btn'));

    await waitFor(() => {
      expect(onOpenShipment).toHaveBeenCalledWith(950);
    });
  });

  // 11. Phase C & D: Admin short-pick resolution with writeoffs body & errors, plus Admin hub assignment, needs-hub, and overdue handovers lists
  it('submits admin short-pick resolution with writeoffs array and surfaces validation errors, and renders admin hub assignment, needs-hub, and overdue handovers', async () => {
    const exceptionShipment = {
      id: 350,
      vendor_order_id: 605,
      order_id: 500,
      order_number: 'MK-2026-500',
      warehouse_id: 20,
      status: 'exception',
      label_number: 'LBL-2026-350',
      courier_name: '',
      tracking_number: '',
      lines: [
        {
          id: 550,
          order_item_id: 95,
          sku: 'SKU-HP-APEX-16GB-512G',
          product_name: 'Apex Headphones Pro',
          expected_quantity: 3,
          picked_quantity: 1,
          exception_reason: '2 units missing from bin',
          lot_reservations: [
            {
              reservation_id: 91,
              lot_id: 10,
              location: 'A1-R2-B3',
              quantity: 3,
              reservation_status: 'reserved',
            },
          ],
        },
      ],
      events: [],
    };

    apiRequest.mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [exceptionShipment],
    });

    const { unmount } = render(
      <AdminShipmentsSection warehouses={[{ id: 20, name: 'Bengaluru WH' }]} />
    );

    const resolveBtn = await screen.findByTestId(
      'open-resolve-short-pick-btn-350'
    );
    fireEvent.click(resolveBtn);

    expect(
      screen.getByTestId('resolve-short-pick-form-350')
    ).toBeInTheDocument();

    // Enter wrong write-off quantity -> server returns 400 error
    fireEvent.change(screen.getByTestId('writeoff-qty-input-550-10'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('resolve-short-pick-reason-input'), {
      target: { value: 'Bin count shortfall write-off' },
    });
    fireEvent.click(screen.getByTestId('open-resolve-short-pick-dialog-btn'));

    expect(
      screen.getByTestId('resolve-short-pick-confirm-dialog')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('resolve-short-pick-dialog-warning')
    ).toHaveTextContent(
      /missing units are written off from the selected lots and flagged for follow-up/i
    );

    apiRequest.mockRejectedValueOnce({
      status: 400,
      data: {
        detail: ['Line 550 is missing 2 units; allocate exactly that quantity.'],
      },
    });
    fireEvent.click(
      screen.getByTestId('confirm-resolve-short-pick-submit-btn')
    );

    expect(
      await screen.findByTestId('resolve-short-pick-dialog-error')
    ).toHaveTextContent(
      'Line 550 is missing 2 units; allocate exactly that quantity.'
    );

    // Fix quantity to 2 and confirm -> sends exact writeoffs body
    fireEvent.click(screen.getByLabelText('Close short-pick resolution dialog'));
    fireEvent.change(screen.getByTestId('writeoff-qty-input-550-10'), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByTestId('open-resolve-short-pick-dialog-btn'));

    apiRequest.mockResolvedValueOnce({
      shipment_id: 350,
      status: 'cancelled',
      vendor_order_id: 605,
      refund_request_id: 905,
      refund_amount: '2499.00',
      currency: 'INR',
      idempotent_replay: false,
    });
    apiRequest.mockResolvedValueOnce({ count: 1, results: [] });

    fireEvent.click(
      screen.getByTestId('confirm-resolve-short-pick-submit-btn')
    );

    expect(
      await screen.findByTestId('admin-shipments-action-banner')
    ).toHaveTextContent('Resolved short-pick on Shipment #350');
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/admin/warehouse/shipments/350/resolve-short-pick/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reason: 'Bin count shortfall write-off',
          writeoffs: [
            {
              shipment_line_id: 550,
              lot_id: 10,
              quantity: 2,
            },
          ],
        }),
      })
    );
    unmount();

    // Test AdminHubOperationsSection (hub assignments, needs-hub, overdue handovers)
    apiRequest.mockImplementation((url, opts) => {
      if (
        url.includes('/api/admin/warehouse/vendor-hub-assignments/') &&
        opts?.method === 'POST'
      ) {
        return Promise.resolve({
          id: 12,
          vendor_id: 5,
          warehouse_id: 20,
          effective_from: '2026-11-28T07:00:00Z',
          reason: 'Admin override: Assign Bengaluru hub',
        });
      }
      if (url.includes('/api/admin/warehouse/vendor-hub-assignments/')) {
        return Promise.resolve({
          results: [
            {
              id: 11,
              vendor_id: 5,
              warehouse_id: 20,
              effective_from: '2026-11-20T07:00:00Z',
              effective_to: null,
              set_by_id: 50,
              reason: 'Admin override: Initial assignment',
            },
          ],
        });
      }
      if (url.includes('/api/admin/warehouse/handovers/needs-hub/')) {
        return Promise.resolve({
          results: [
            {
              handover_id: 702,
              vendor_order_id: 602,
              vendor_id: 8,
              order_number: 'MK-2026-501',
              reason:
                'Seller must have one unambiguous address and a matching active hub, or admin assignment.',
            },
          ],
        });
      }
      if (url.includes('/api/admin/warehouse/handovers/overdue/')) {
        return Promise.resolve({
          results: [
            {
              id: 703,
              handover_number: 'HND-2026-703',
              vendor_order_id: 603,
              vendor_id: 5,
              order_number: 'MK-2026-502',
              warehouse_id: 20,
              deadline_at: '2026-11-25T08:00:00Z',
              sent_at: '2026-11-24T12:00:00Z',
              courier_name: 'BlueDart',
              tracking_number: 'BD-OVERDUE-1',
              status: 'in_transit',
            },
          ],
        });
      }
      return Promise.resolve({ results: [] });
    });

    render(
      <AdminHubOperationsSection
        warehouses={[{ id: 20, name: 'Bengaluru Central Hub', is_active: true }]}
      />
    );

    expect(
      await screen.findByTestId('admin-hub-assignment-row-11')
    ).toBeInTheDocument();
    expect(screen.getByTestId('admin-needs-hub-row-702')).toHaveTextContent(
      'MK-2026-501'
    );
    expect(
      screen.getByTestId('admin-overdue-handover-row-703')
    ).toHaveTextContent('HND-2026-703');

    // Assign hub form submission
    fireEvent.change(screen.getByTestId('assign-hub-vendor-id-input'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByTestId('assign-hub-warehouse-input'), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByTestId('assign-hub-reason-input'), {
      target: { value: 'Assign Bengaluru hub' },
    });
    fireEvent.click(screen.getByTestId('open-assign-hub-dialog-btn'));
    expect(screen.getByTestId('assign-hub-confirm-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-assign-hub-submit-btn'));
    expect(
      await screen.findByTestId('admin-hub-feedback-banner')
    ).toHaveTextContent('Assigned Hub #20 to Seller #5');
  });

  // 12. Role isolation and server-driven overdue flag (no browser deadline calculation)
  it('enforces role isolation across customer, seller, warehouse_manager, and admin routes and marks overdue strictly from server fields', () => {
    // Overdue flag must only return true when server explicitly flags it
    expect(
      isHandoverMarkedOverdueByServer({
        id: 1,
        status: 'awaiting_dispatch',
        deadline_at: '2020-01-01T00:00:00Z',
      })
    ).toBe(false);
    expect(
      isHandoverMarkedOverdueByServer({
        id: 2,
        status: 'overdue',
        deadline_at: '2099-01-01T00:00:00Z',
      })
    ).toBe(true);
    expect(
      isHandoverMarkedOverdueByServer({
        id: 3,
        status: 'in_transit',
        is_overdue: true,
      })
    ).toBe(true);

    // Role isolation checks against authRouting.js single source of truth
    expect(isRouteAllowedForRole('/warehouse/handovers', 'warehouse_manager')).toBe(
      true
    );
    expect(isRouteAllowedForRole('/warehouse/handovers', 'customer')).toBe(false);
    expect(isRouteAllowedForRole('/warehouse/handovers', 'vendor')).toBe(false);

    expect(isRouteAllowedForRole('/seller/warehouse', 'vendor')).toBe(true);
    expect(isRouteAllowedForRole('/seller/warehouse', 'customer')).toBe(false);
    expect(
      isRouteAllowedForRole('/seller/warehouse', 'warehouse_manager')
    ).toBe(false);

    expect(
      isRouteAllowedForRole('/admin/warehouse-hub-assignments', 'admin')
    ).toBe(true);
    expect(
      isRouteAllowedForRole('/admin/warehouse-hub-assignments', 'vendor')
    ).toBe(false);
    expect(
      isRouteAllowedForRole('/admin/warehouse-hub-assignments', 'customer')
    ).toBe(false);
    expect(
      isRouteAllowedForRole(
        '/admin/warehouse-hub-assignments',
        'warehouse_manager'
      )
    ).toBe(false);
  });
});

describe('Warehouse Returns Screens (Phase E)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Manager returns inbox and empty state
  it('renders hub manager returns inbox with RMA number, parcel ID, status, requested action, expected lines, and empty state', async () => {
    apiRequest.mockResolvedValueOnce({
      results: [
        {
          rma_id: 901,
          rma_number: 'RMA-901',
          vendor_order_id: 501,
          status: 'approved',
          requested_action: 'return',
          warehouse_id: 20,
          lines: [
            {
              return_request_item_id: 801,
              order_item_id: 701,
              sku: 'SKU-HP-APEX-16GB-512G',
              expected_quantity: 2,
            },
          ],
        },
      ],
    });

    render(<ManagerReturnsSection />);

    expect(
      await screen.findByTestId('manager-return-card-901')
    ).toBeInTheDocument();
    expect(screen.getByTestId('manager-return-rma-number-901')).toHaveTextContent(
      'RMA-901'
    );
    expect(screen.getByTestId('manager-return-status-901')).toHaveTextContent(
      'approved'
    );
    expect(
      screen.getByText('SKU-HP-APEX-16GB-512G')
    ).toBeInTheDocument();

    // Refresh into empty state
    apiRequest.mockResolvedValueOnce({ results: [] });
    fireEvent.click(screen.getByTestId('refresh-manager-returns-btn'));
    expect(
      await screen.findByTestId('manager-returns-empty')
    ).toBeInTheDocument();
  });

  // 2. Manager receive & inspect with all four results, destinations, confirmation dialog text, validation errors, and 409
  it('submits manager return receive with resellable, damaged, wrong_item, and missing, shows confirmation notice, server destinations, validation errors, and calm 409', async () => {
    const rmaFixture = {
      rma_id: 902,
      rma_number: 'RMA-902',
      vendor_order_id: 502,
      status: 'approved',
      requested_action: 'return',
      warehouse_id: 20,
      lines: [
        {
          return_request_item_id: 811,
          order_item_id: 711,
          sku: 'SKU-STORED-GOOD',
          expected_quantity: 2,
        },
        {
          return_request_item_id: 812,
          order_item_id: 712,
          sku: 'SKU-STORED-DMG',
          expected_quantity: 1,
        },
        {
          return_request_item_id: 813,
          order_item_id: 713,
          sku: 'SKU-SELLER-GOOD',
          expected_quantity: 1,
        },
        {
          return_request_item_id: 814,
          order_item_id: 714,
          sku: 'SKU-MISSING-ITEM',
          expected_quantity: 1,
        },
      ],
    };

    apiRequest.mockResolvedValueOnce({ results: [rmaFixture] });

    render(<ManagerReturnsSection />);

    fireEvent.click(
      await screen.findByTestId('open-manager-return-receive-btn-902')
    );

    // Set 4 inspection results across the 4 lines
    fireEvent.change(screen.getByTestId('manager-return-qty-input-811'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByTestId('manager-return-result-select-811'), {
      target: { value: 'resellable' },
    });
    fireEvent.change(screen.getByTestId('manager-return-note-input-811'), {
      target: { value: 'Seal intact' },
    });

    fireEvent.change(screen.getByTestId('manager-return-qty-input-812'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('manager-return-result-select-812'), {
      target: { value: 'damaged' },
    });

    fireEvent.change(screen.getByTestId('manager-return-qty-input-813'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('manager-return-result-select-813'), {
      target: { value: 'wrong_item' },
    });

    fireEvent.change(screen.getByTestId('manager-return-qty-input-814'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByTestId('manager-return-result-select-814'), {
      target: { value: 'missing' },
    });

    // Open native <dialog> confirmation and verify exact required sentence
    fireEvent.click(
      screen.getByTestId('open-manager-return-confirm-dialog-btn')
    );
    expect(
      screen.getByTestId('manager-return-confirm-dialog')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('manager-return-confirm-notice')
    ).toHaveTextContent(
      'This records the goods. It does not refund the customer; an admin handles the refund.'
    );

    // 1) Test server 400 validation error
    apiRequest.mockRejectedValueOnce({
      status: 400,
      data: {
        detail: {
          lines: ['A missing line must have received_quantity zero.'],
        },
      },
    });
    fireEvent.click(
      screen.getByTestId('confirm-manager-return-receive-submit-btn')
    );
    expect(
      await screen.findByTestId('manager-return-error-lines')
    ).toHaveTextContent('A missing line must have received_quantity zero.');

    // 2) Test successful submission returning all 4 server destinations
    fireEvent.click(
      screen.getByTestId('open-manager-return-confirm-dialog-btn')
    );
    apiRequest
      .mockResolvedValueOnce({
        id: 1001,
        rma_id: 902,
        vendor_order_id: 502,
        receipt_number: 'RET-902-ABCDEF1234',
        warehouse_id: 20,
        received_at: '2026-11-28T09:10:00Z',
        allocation_note: 'Stored return restored to lot #10.',
        idempotent_replay: false,
        lines: [
          {
            receipt_line_id: 911,
            return_request_item_id: 811,
            order_item_id: 711,
            sku: 'SKU-STORED-GOOD',
            product_name: 'Stored Good Item',
            expected_quantity: 2,
            received_quantity: 2,
            inspection_result: 'resellable',
            destination: 'lot',
            note: 'Seal intact',
            lot_id: 10,
          },
          {
            receipt_line_id: 912,
            return_request_item_id: 812,
            order_item_id: 712,
            sku: 'SKU-STORED-DMG',
            product_name: 'Stored Damaged Item',
            expected_quantity: 1,
            received_quantity: 1,
            inspection_result: 'damaged',
            destination: 'quarantine_lot',
            note: '',
            lot_id: 44,
          },
          {
            receipt_line_id: 913,
            return_request_item_id: 813,
            order_item_id: 713,
            sku: 'SKU-SELLER-GOOD',
            product_name: 'Seller Owned Item',
            expected_quantity: 1,
            received_quantity: 1,
            inspection_result: 'resellable',
            destination: 'seller_handback',
            note: '',
            lot_id: null,
          },
          {
            receipt_line_id: 914,
            return_request_item_id: 814,
            order_item_id: 714,
            sku: 'SKU-MISSING-ITEM',
            product_name: 'Missing Item',
            expected_quantity: 1,
            received_quantity: 0,
            inspection_result: 'missing',
            destination: 'none',
            note: '',
            lot_id: null,
          },
        ],
      })
      .mockResolvedValueOnce({ results: [] });

    fireEvent.click(
      screen.getByTestId('confirm-manager-return-receive-submit-btn')
    );

    expect(
      await screen.findByTestId('manager-return-receipt-result')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('manager-return-receipt-number')
    ).toHaveTextContent('RET-902-ABCDEF1234');
    expect(
      screen.getByTestId('manager-return-line-destination-911')
    ).toHaveTextContent('Shelf (Verified available lot)');
    expect(
      screen.getByTestId('manager-return-line-lot-911')
    ).toHaveTextContent('Lot #10');
    expect(
      screen.getByTestId('manager-return-line-destination-912')
    ).toHaveTextContent('Quarantine (Never sold)');
    expect(
      screen.getByTestId('manager-return-line-destination-913')
    ).toHaveTextContent('Handed back to seller');
    expect(
      screen.getByTestId('manager-return-line-destination-914')
    ).toHaveTextContent('No stock change');
  });

  // 3. Manager 409 conflict alert when return is already received
  it('shows a calm 409 message when the manager tries to receive an already-received return', async () => {
    apiRequest.mockResolvedValueOnce({
      results: [
        {
          rma_id: 903,
          rma_number: 'RMA-903',
          vendor_order_id: 503,
          status: 'approved',
          requested_action: 'return',
          warehouse_id: 20,
          lines: [
            {
              return_request_item_id: 821,
              order_item_id: 721,
              sku: 'SKU-903',
              expected_quantity: 1,
            },
          ],
        },
      ],
    });

    render(<ManagerReturnsSection />);

    fireEvent.click(
      await screen.findByTestId('open-manager-return-receive-btn-903')
    );
    fireEvent.click(
      screen.getByTestId('open-manager-return-confirm-dialog-btn')
    );

    apiRequest
      .mockRejectedValueOnce({
        status: 409,
        data: { detail: 'This RMA already has a different receipt and inspection.' },
      })
      .mockResolvedValueOnce({ results: [] });

    fireEvent.click(
      screen.getByTestId('confirm-manager-return-receive-submit-btn')
    );

    expect(
      await screen.findByTestId('manager-return-conflict-alert')
    ).toHaveTextContent(
      'This RMA already has a different receipt and inspection.'
    );
  });

  // 4. Seller return receipts list without customer data, and seller handback confirmation + 409 repeat
  it('renders seller return receipts without customer data and submits seller handback confirmation with reference and quantities, handling 409 calmly', async () => {
    apiRequest.mockResolvedValueOnce({
      results: [
        {
          id: 1101,
          rma_id: 905,
          vendor_order_id: 505,
          receipt_number: 'RET-905-SELLER01',
          warehouse_id: 20,
          received_at: '2026-11-28T09:15:00Z',
          allocation_note: '',
          lines: [
            {
              receipt_line_id: 951,
              return_request_item_id: 851,
              order_item_id: 751,
              sku: 'SKU-SELLER-RET-1',
              product_name: 'Seller Fulfilled Jacket',
              expected_quantity: 2,
              received_quantity: 2,
              inspection_result: 'resellable',
              destination: 'seller_handback',
              seller_confirmed_quantity: 0,
            },
          ],
        },
      ],
    });

    render(<SellerReturnsSection />);

    const card = await screen.findByTestId('seller-return-receipt-card-1101');
    expect(card).toBeInTheDocument();
    expect(
      screen.getByTestId('seller-return-receipt-number-1101')
    ).toHaveTextContent('RET-905-SELLER01');
    expect(
      screen.getByTestId('seller-return-line-destination-951')
    ).toHaveTextContent('Handed back to seller');
    // Confirm no customer personal data is shown
    expect(card).not.toHaveTextContent('customer_email');
    expect(card).not.toHaveTextContent('shipping_address');

    // Open confirm handback dialog
    fireEvent.click(
      screen.getByTestId('open-seller-return-handback-btn-1101')
    );
    expect(
      screen.getByTestId('seller-return-handback-dialog')
    ).toBeInTheDocument();

    // Test 409 conflict on repeat with different quantities
    fireEvent.change(
      screen.getByTestId('seller-return-handback-reference-input'),
      { target: { value: 'SELLER-RET-REF-01' } }
    );
    apiRequest.mockRejectedValueOnce({
      status: 409,
      data: {
        detail: 'This handback reference was already used with different quantities.',
      },
    });
    fireEvent.click(screen.getByTestId('seller-return-handback-submit-btn'));
    expect(
      await screen.findByTestId('seller-return-handback-general-error')
    ).toHaveTextContent(
      'This handback reference was already used with different quantities.'
    );

    // Test successful handback confirmation
    apiRequest
      .mockResolvedValueOnce({
        id: 1201,
        receipt_id: 1101,
        reference: 'SELLER-RET-REF-01',
        idempotent_replay: false,
        lines: [{ receipt_line_id: 951, quantity: 2 }],
      })
      .mockResolvedValueOnce({
        results: [
          {
            id: 1101,
            rma_id: 905,
            vendor_order_id: 505,
            receipt_number: 'RET-905-SELLER01',
            warehouse_id: 20,
            received_at: '2026-11-28T09:15:00Z',
            allocation_note: '',
            lines: [
              {
                receipt_line_id: 951,
                return_request_item_id: 851,
                order_item_id: 751,
                sku: 'SKU-SELLER-RET-1',
                product_name: 'Seller Fulfilled Jacket',
                expected_quantity: 2,
                received_quantity: 2,
                inspection_result: 'resellable',
                destination: 'seller_handback',
                seller_confirmed_quantity: 2,
              },
            ],
          },
        ],
      });

    fireEvent.click(screen.getByTestId('seller-return-handback-submit-btn'));

    expect(
      await screen.findByTestId('seller-returns-action-banner')
    ).toHaveTextContent(
      'Confirmed returned goods received back for Receipt RET-905-SELLER01 (Reference: SELLER-RET-REF-01).'
    );
    expect(
      screen.getByTestId('seller-return-line-confirmed-951')
    ).toHaveTextContent('2');
  });

  // 5. Admin returns list, help note, and admin receive flow
  it('renders admin returns list with required help note and records an admin return receipt', async () => {
    apiRequest.mockResolvedValueOnce({
      results: [
        {
          rma_id: 910,
          rma_number: 'RMA-910',
          vendor_order_id: 510,
          status: 'approved',
          requested_action: 'return',
          warehouse_id: 20,
          lines: [
            {
              return_request_item_id: 860,
              order_item_id: 760,
              sku: 'SKU-ADMIN-RET-1',
              expected_quantity: 1,
            },
          ],
        },
      ],
    });

    render(
      <AdminReturnsSection
        warehouses={[{ id: 20, name: 'Bengaluru Central Hub' }]}
      />
    );

    expect(
      await screen.findByTestId('admin-returns-help-note')
    ).toHaveTextContent(
      'After the hub receives the goods, set the RMA to inspection in the admin site, then use the refund action. Receiving goods here does not refund.'
    );
    expect(screen.getByTestId('admin-return-card-910')).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('open-admin-return-receive-btn-910')
    );
    fireEvent.click(
      screen.getByTestId('open-admin-return-confirm-dialog-btn')
    );

    expect(
      screen.getByTestId('admin-return-confirm-notice')
    ).toHaveTextContent(
      'This records the goods. It does not refund the customer; an admin handles the refund.'
    );

    apiRequest
      .mockResolvedValueOnce({
        id: 1301,
        rma_id: 910,
        vendor_order_id: 510,
        receipt_number: 'RET-910-ADMIN01',
        warehouse_id: 20,
        received_at: '2026-11-28T09:20:00Z',
        allocation_note: '',
        idempotent_replay: false,
        lines: [
          {
            receipt_line_id: 960,
            return_request_item_id: 860,
            order_item_id: 760,
            sku: 'SKU-ADMIN-RET-1',
            product_name: 'Admin Inspected Item',
            expected_quantity: 1,
            received_quantity: 1,
            inspection_result: 'damaged',
            destination: 'quarantine_lot',
            note: '',
            lot_id: 55,
          },
        ],
      })
      .mockResolvedValueOnce({ results: [] });

    fireEvent.click(
      screen.getByTestId('confirm-admin-return-receive-submit-btn')
    );

    expect(
      await screen.findByTestId('admin-return-receipt-card-1301')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('admin-return-receipt-number-1301')
    ).toHaveTextContent('RET-910-ADMIN01');
    expect(
      screen.getByTestId('admin-return-line-destination-960')
    ).toHaveTextContent('Quarantine (Never sold)');
  });

  // 6. Stock reconciliation additions (return_quarantine_lots and unconfirmed_seller_handbacks) shown read-only; correction form still superuser-only
  it('displays return_quarantine_lots and unconfirmed_seller_handbacks in the stock reconciliation report while keeping the correction form superuser-only', async () => {
    apiRequest.mockResolvedValueOnce({
      results: [
        {
          variant_id: 13,
          sku: 'SKU-HP-APEX-16GB-512G',
          vendor_id: 5,
          warehouse_id: 20,
          seller_stock: 4,
          open_request_holds: [],
          lots: [],
          unverified_lot_quantity: 0,
          return_quarantine_lots: [
            {
              receipt_id: 1001,
              receipt_number: 'RET-902-ABCDEF1234',
              rma_id: 902,
              receipt_line_id: 912,
              lot_id: 44,
              quantity: 1,
              result: 'damaged',
            },
          ],
          unconfirmed_seller_handbacks: [
            {
              receipt_id: 1101,
              receipt_number: 'RET-905-SELLER01',
              rma_id: 905,
              receipt_line_id: 951,
              quantity_due: 2,
            },
          ],
        },
      ],
    });

    render(
      <AuthContext.Provider
        value={{
          currentUser: { id: 9, role: 'admin', is_superuser: false },
          isLoggedIn: true,
        }}
      >
        <AdminStockReconciliationSection />
      </AuthContext.Provider>
    );

    expect(
      await screen.findByTestId('recon-return-quarantine-912')
    ).toHaveTextContent(
      'Return Quarantine (damaged): RET-902-ABCDEF1234 (RMA #902 • Lot #44) • Qty 1'
    );
    expect(
      screen.getByTestId('recon-unconfirmed-handback-951')
    ).toHaveTextContent(
      'Unconfirmed Seller Handback: RET-905-SELLER01 (RMA #905 • Line #951) • Qty Due 2'
    );
    expect(
      screen.getByTestId('recon-flag-return-quarantine-13')
    ).toHaveTextContent('Return Quarantine (1)');
    expect(
      screen.getByTestId('recon-flag-unconfirmed-handback-13')
    ).toHaveTextContent('Unconfirmed Seller Handback (1)');

    // Correction form remains hidden for non-superuser
    expect(
      screen.queryByTestId('superuser-stock-correction-panel')
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('reconciliation-readonly-note')
    ).toBeInTheDocument();
  });

  // 7. 404 hides the returns area quietly when feature switches are off
  it('quietly hides manager, seller, and admin returns sections when the server returns 404 (feature switches off)', async () => {
    apiRequest.mockRejectedValue({
      status: 404,
      data: { detail: 'HTTP 404 Error' },
    });

    const onManagerDisabled = vi.fn();
    const { container: mgrContainer } = render(
      <ManagerReturnsSection onFeatureDisabled={onManagerDisabled} />
    );
    await waitFor(() => {
      expect(onManagerDisabled).toHaveBeenCalled();
    });
    expect(mgrContainer).toBeEmptyDOMElement();

    const onSellerDisabled = vi.fn();
    const { container: sellerContainer } = render(
      <SellerReturnsSection onFeatureDisabled={onSellerDisabled} />
    );
    await waitFor(() => {
      expect(onSellerDisabled).toHaveBeenCalled();
    });
    expect(sellerContainer).toBeEmptyDOMElement();

    const { container: adminContainer } = render(<AdminReturnsSection />);
    await waitFor(() => {
      expect(
        screen.queryByTestId('admin-returns-section')
      ).not.toBeInTheDocument();
    });
    expect(adminContainer).toBeEmptyDOMElement();
  });
});
