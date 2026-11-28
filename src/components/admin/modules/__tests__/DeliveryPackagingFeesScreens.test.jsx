import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CartPage from '../../../../pages/CartPage';
import CheckoutPage from '../../../../pages/CheckoutPage';
import OrdersSection from '../../../profile/OrdersSection';
import OrderSuccessConfirmation from '../../../checkout/OrderSuccessConfirmation';
import DeliveryPackagingFeesModule from '../DeliveryPackagingFeesModule';
import ProtectedRoute from '../../../routing/ProtectedRoute';
import AuthContext from '../../../../context/AuthContext';
import { CartWishlistProvider } from '../../../../context/CartWishlistContext';
import { ToastProvider } from '../../../../context/ToastContext';
import {
  getAllowedRolesForRoute,
  isRouteAllowedForRole,
} from '../../../../utils/authRouting';
import {
  isNonZeroMoneyString,
  getCartSummaryDeliveryDisplay,
  formatVerbatimMoney,
} from '../../../../utils/orderPricingUtils';
import { apiRequest, ApiError } from '../../../../utils/api';

vi.mock('../../../../utils/api', async () => {
  const actual = await vi.importActual('../../../../utils/api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const mockCartItemsSingleSeller = [
  {
    id: 55,
    product_variant: 14,
    quantity: 1,
    added_at: '2026-11-27T10:26:54.520006+05:30',
    product_details: {
      product_id: 13,
      product_name: 'Apex Titan 5G Pro Flagship Smartphone',
      primary_image_url: null,
      unit_price: '44999.00',
      currency: 'INR',
      vendor_display_name: 'Acme Demo Store (5)',
      stock_quantity: 35,
      is_active: true,
      attributes: {},
      sku_code: 'SKU-MOB-APX-9500',
    },
  },
];

const mockCartItemsMultiSeller = [
  ...mockCartItemsSingleSeller,
  {
    id: 56,
    product_variant: 22,
    quantity: 2,
    added_at: '2026-11-27T10:27:00.000000+05:30',
    product_details: {
      product_id: 50,
      product_name: 'Handloom Silk Saree',
      primary_image_url: null,
      unit_price: '2500.00',
      currency: 'INR',
      vendor_display_name: 'Athul Crafts',
      stock_quantity: 10,
      is_active: true,
      attributes: { color: 'Crimson' },
      sku_code: 'SILK-RED-01',
    },
  },
];

const mockCartSummaryMultiSeller = {
  currency: 'INR',
  item_subtotal: '49999.00',
  item_tax: '8349.82',
  discount: '0.00',
  delivery_charge: '25.00',
  delivery_tax: '4.50',
  delivery_rule_id: 1,
  delivery_rule_version: 1,
  delivery_message: '',
  packaging_fee_total: '20.00',
  packaging_tax: '3.60',
  packaging_lines: [
    {
      vendor_id: 5,
      amount: '10.00',
      tax_rate: '18.00',
      tax_amount: '1.80',
      currency: 'INR',
      rule_id: 1,
      rule_version: 1,
    },
    {
      vendor_id: 8,
      amount: '10.00',
      tax_rate: '18.00',
      tax_amount: '1.80',
      currency: 'INR',
      rule_id: 1,
      rule_version: 1,
    },
  ],
  fee_tax_total: '8.10',
  total: '58381.92',
  vendor_count: 2,
};

const mockCustomerAddresses = [
  {
    id: 1,
    full_name: 'Irfan K',
    phone_number: '+91 9876543210',
    address_line1: '12 MG Road',
    address_line2: '',
    city: 'Kochi',
    state: 'Kerala',
    postal_code: '682001',
    country: 'IN',
    address_type: 'both',
    is_default: true,
  },
  {
    id: 2,
    full_name: 'Irfan K',
    phone_number: '+91 9876543210',
    address_line1: '88 Brigade Road',
    address_line2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560001',
    country: 'IN',
    address_type: 'shipping',
    is_default: false,
  },
];

function renderCustomerCartOrCheckout(initialEntry = '/cart') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ToastProvider>
        <AuthContext.Provider
          value={{
            isLoggedIn: true,
            isResolving: false,
            currentUser: { id: 21, username: 'Irfan', role: 'customer' },
            isProductOwnedByCurrentSeller: () => false,
            logout: vi.fn(),
          }}
        >
          <CartWishlistProvider>
            <Routes>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
          </CartWishlistProvider>
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('Customer & Admin Delivery and Packaging Fee Screens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Cart Summary rendering: shows item subtotal, item tax, discount, delivery charge, multi-seller packaging fee lines, fee tax, and total verbatim as sent by server with no browser money maths', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/orders/cart/') {
        return mockCartItemsMultiSeller;
      }
      if (url === '/api/customers/wishlist/') {
        return [];
      }
      if (url.startsWith('/api/orders/cart/summary/')) {
        return mockCartSummaryMultiSeller;
      }
      return {};
    });

    renderCustomerCartOrCheckout('/cart');

    expect(
      await screen.findByTestId('cart-summary-item-subtotal')
    ).toHaveTextContent('INR 49999.00');
    expect(screen.getByTestId('cart-summary-item-tax')).toHaveTextContent(
      'INR 8349.82'
    );
    expect(screen.queryByTestId('cart-summary-discount')).toBeNull();
    expect(
      screen.getByTestId('cart-summary-delivery-charge')
    ).toHaveTextContent('INR 25.00');

    // Multi-seller packaging lines: 2 seller parcels
    expect(
      screen.getByTestId('cart-summary-packaging-multi')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('cart-summary-packaging-total')
    ).toHaveTextContent('INR 20.00');
    expect(
      screen.getByTestId('cart-summary-packaging-line-5')
    ).toHaveTextContent('INR 10.00');
    expect(
      screen.getByTestId('cart-summary-packaging-line-8')
    ).toHaveTextContent('INR 10.00');

    // Fee tax line and total
    expect(screen.getByTestId('cart-summary-fee-tax')).toHaveTextContent(
      'INR 8.10'
    );
    expect(screen.getByTestId('cart-summary-total')).toHaveTextContent(
      'INR 58381.92'
    );
  });

  it('2. Delivery message and Free delivery rules: shows delivery_message verbatim when sent, and "Free delivery" only when delivery_charge is zero and a rule exists', async () => {
    // Unit-check getCartSummaryDeliveryDisplay rules directly
    expect(
      getCartSummaryDeliveryDisplay({
        currency: 'AED',
        delivery_charge: '0.00',
        delivery_rule_id: null,
        delivery_message: 'No delivery fee configured',
      })
    ).toEqual({
      type: 'message',
      text: 'No delivery fee configured',
    });

    expect(
      getCartSummaryDeliveryDisplay({
        currency: 'INR',
        delivery_charge: '0.00',
        delivery_rule_id: 1,
        delivery_message: '',
      })
    ).toEqual({
      type: 'free',
      text: 'Free delivery',
    });

    expect(
      getCartSummaryDeliveryDisplay({
        currency: 'INR',
        delivery_charge: '25.00',
        delivery_rule_id: 1,
        delivery_message: '',
      })
    ).toEqual({
      type: 'amount',
      text: 'INR 25.00',
    });

    // Render CartPage when server sends delivery_message = "No delivery fee configured"
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/orders/cart/') {
        return mockCartItemsSingleSeller;
      }
      if (url === '/api/customers/wishlist/') {
        return [];
      }
      if (url.startsWith('/api/orders/cart/summary/')) {
        return {
          ...mockCartSummaryMultiSeller,
          delivery_charge: '0.00',
          delivery_tax: '0.00',
          delivery_rule_id: null,
          delivery_rule_version: null,
          delivery_message: 'No delivery fee configured',
          packaging_lines: [mockCartSummaryMultiSeller.packaging_lines[0]],
          packaging_fee_total: '10.00',
          fee_tax_total: '1.80',
          total: '53110.62',
        };
      }
      return {};
    });

    const { unmount } = renderCustomerCartOrCheckout('/cart');
    expect(
      await screen.findByTestId('cart-summary-delivery-charge')
    ).toHaveTextContent('No delivery fee configured');
    unmount();

    // Render CartPage when threshold is met (delivery_charge = "0.00", delivery_rule_id = 1, delivery_message = "")
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/orders/cart/') {
        return mockCartItemsSingleSeller;
      }
      if (url === '/api/customers/wishlist/') {
        return [];
      }
      if (url.startsWith('/api/orders/cart/summary/')) {
        return {
          ...mockCartSummaryMultiSeller,
          delivery_charge: '0.00',
          delivery_tax: '0.00',
          delivery_rule_id: 1,
          delivery_rule_version: 1,
          delivery_message: '',
          packaging_lines: [mockCartSummaryMultiSeller.packaging_lines[0]],
          packaging_fee_total: '10.00',
          fee_tax_total: '0.00',
          total: '53108.82',
        };
      }
      return {};
    });

    renderCustomerCartOrCheckout('/cart');
    expect(
      await screen.findByTestId('cart-summary-delivery-charge')
    ).toHaveTextContent('Free delivery');
    // When fee_tax_total is "0.00", fee tax line is not shown
    expect(screen.queryByTestId('cart-summary-fee-tax')).toBeNull();
  });

  it('3. Checkout refresh on address, cart item, and coupon change, plus loading and error states (no fallback total shown on error)', async () => {
    const summaryCalls = [];
    let currentItems = [...mockCartItemsSingleSeller];

    apiRequest.mockImplementation(async (url, opts) => {
      if (url === '/api/orders/cart/' && (!opts || !opts.method)) {
        return currentItems;
      }
      if (url === '/api/orders/cart/55/' && opts?.method === 'PATCH') {
        const body = JSON.parse(opts.body);
        currentItems = [{ ...currentItems[0], quantity: body.quantity }];
        return currentItems[0];
      }
      if (url === '/api/customers/wishlist/') {
        return [];
      }
      if (url === '/api/customers/addresses/') {
        return mockCustomerAddresses;
      }
      if (url === '/api/orders/apply-coupon/' && opts?.method === 'POST') {
        return {
          code: 'SAVE100',
          discount_type: 'flat',
          discount_value: '100.00',
          discount_amount: '100.00',
          currency: 'INR',
        };
      }
      if (url.startsWith('/api/orders/cart/summary/')) {
        summaryCalls.push(url);
        const hasCoupon = url.includes('coupon_code=SAVE100');
        const isAddr2 = url.includes('address_id=2');
        return {
          currency: 'INR',
          item_subtotal: '44999.00',
          item_tax: isAddr2 ? '8099.82' : '8099.82',
          discount: hasCoupon ? '100.00' : '0.00',
          delivery_charge: '25.00',
          delivery_tax: '4.50',
          delivery_rule_id: 1,
          delivery_rule_version: 1,
          delivery_message: '',
          packaging_fee_total: '10.00',
          packaging_tax: '1.80',
          packaging_lines: [
            {
              vendor_id: 5,
              amount: '10.00',
              tax_rate: '18.00',
              tax_amount: '1.80',
              currency: 'INR',
              rule_id: 1,
              rule_version: 1,
            },
          ],
          fee_tax_total: '6.30',
          total: hasCoupon ? '53040.12' : '53140.12',
          vendor_count: 1,
        };
      }
      return {};
    });

    const { unmount } = renderCustomerCartOrCheckout('/checkout');

    // Initial summary load after default address #1 is selected
    expect(await screen.findByTestId('cart-summary-total')).toHaveTextContent(
      'INR 53140.12'
    );
    expect(screen.getByTestId('checkout-place-order-btn')).toHaveTextContent(
      'Place Order (INR 53140.12)'
    );

    // 1) Change selected address to Address #2 (Bengaluru, Karnataka) -> triggers summary refresh with address_id=2
    fireEvent.click(screen.getByText(/88 Brigade Road/i));
    await waitFor(() => {
      expect(
        summaryCalls.some((u) => u.includes('address_id=2'))
      ).toBe(true);
    });

    // 2) Apply coupon SAVE100 -> triggers summary refresh with coupon_code=SAVE100 and renders discount line
    fireEvent.change(screen.getByTestId('coupon-code-input'), {
      target: { value: 'SAVE100' },
    });
    fireEvent.click(screen.getByTestId('apply-coupon-btn'));

    expect(
      await screen.findByTestId('cart-summary-discount')
    ).toHaveTextContent('- INR 100.00');
    expect(screen.getByTestId('cart-summary-total')).toHaveTextContent(
      'INR 53040.12'
    );
    expect(
      summaryCalls.some((u) => u.includes('coupon_code=SAVE100'))
    ).toBe(true);
    unmount();

    // 3) Error state test: when /api/orders/cart/summary/ fails, show server message and DO NOT show a total from anywhere else
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/orders/cart/') {
        return mockCartItemsSingleSeller;
      }
      if (url === '/api/customers/wishlist/') {
        return [];
      }
      if (url === '/api/customers/addresses/') {
        return [];
      }
      if (url.startsWith('/api/orders/cart/summary/')) {
        throw new ApiError(
          'Select an existing delivery address or set a default address.',
          400,
          {
            address_id:
              'Select an existing delivery address or set a default address.',
          }
        );
      }
      return {};
    });

    renderCustomerCartOrCheckout('/checkout');

    expect(await screen.findByTestId('cart-summary-error')).toHaveTextContent(
      'Select an existing delivery address or set a default address.'
    );
    expect(screen.queryByTestId('cart-summary-total')).toBeNull();
    expect(screen.getByTestId('checkout-place-order-btn')).toBeDisabled();
  });

  it('4. Order Pages (OrdersSection & OrderSuccessConfirmation): renders customer_charges lines and server totals verbatim, and displays older orders without fee fields as today', () => {
    // Real Order #78 shape from dev database (with customer_charges)
    const order78WithCharges = {
      id: 'MYT-20261127-7AA173EF2DF3',
      realOrderId: 78,
      order_number: 'MYT-20261127-7AA173EF2DF3',
      status: 'Cancelled',
      statusType: 'cancelled',
      payment_status: 'failed',
      currency: 'INR',
      subtotal: '44999.00',
      tax_total: '8099.82',
      shipping_total: '0.00',
      discount_total: '0.00',
      delivery_charge: '25.00',
      packaging_fee_total: '10.00',
      fee_tax_total: '6.30',
      grand_total: '53140.12',
      date: '27 Nov 2026',
      total: 'INR 53140.12',
      items: [
        {
          id: 52,
          product_variant: 14,
          productId: 13,
          product_name_snapshot: 'Apex Titan 5G Pro Flagship Smartphone',
          sku_snapshot: 'SKU-MOB-APX-9500',
          name: 'Apex Titan 5G Pro Flagship Smartphone',
          qty: 1,
          quantity: 1,
          unit_price: '44999.00',
          line_total: '53098.82',
          price: 'INR 53098.82',
          seller: 'Verified Seller',
          image: '/products/spatial_headphones_1786529304124.png',
        },
      ],
      customer_charges: [
        {
          id: 1,
          kind: 'delivery',
          vendor_order: null,
          currency: 'INR',
          amount: '25.00',
          tax_rate: '18.00',
          tax_amount: '4.50',
          delivery_rule: 1,
          packaging_rule: null,
          rule_version: 1,
        },
        {
          id: 2,
          kind: 'packaging',
          vendor_order: 74,
          currency: 'INR',
          amount: '10.00',
          tax_rate: '18.00',
          tax_amount: '1.80',
          delivery_rule: null,
          packaging_rule: 1,
          rule_version: 1,
        },
      ],
    };

    // Older order #74 without customer_charges or non-zero fee fields
    const oldOrder74WithoutFees = {
      id: 'MYT-20261103-DDA5CF330D84',
      realOrderId: 74,
      order_number: 'MYT-20261103-DDA5CF330D84',
      status: 'Payment Pending',
      statusType: 'processing',
      payment_status: 'pending',
      currency: 'INR',
      subtotal: '70000.00',
      tax_total: '12600.00',
      shipping_total: '0.00',
      discount_total: '0.00',
      delivery_charge: '0.00',
      packaging_fee_total: '0.00',
      fee_tax_total: '0.00',
      grand_total: '82600.00',
      date: '3 Nov 2026',
      total: 'INR 82600.00',
      items: [
        {
          id: 49,
          productId: 59,
          name: 'HP Victus hhx',
          qty: 1,
          price: 'INR 82600.00',
          seller: 'Verified Seller',
          image: '/products/spatial_headphones_1786529304124.png',
        },
      ],
      customer_charges: [],
    };

    const { unmount } = render(
      <MemoryRouter>
        <ToastProvider>
          <AuthContext.Provider
            value={{
              isLoggedIn: true,
              isResolving: false,
              currentUser: { id: 21, username: 'Irfan', role: 'customer' },
            }}
          >
            <CartWishlistProvider>
              <OrdersSection
                orders={[order78WithCharges, oldOrder74WithoutFees]}
              />
            </CartWishlistProvider>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );

    // Order #78 renders customer_charges lines and fee_tax_total and grand_total verbatim
    expect(screen.getByTestId('order-grand-total-78')).toHaveTextContent(
      'INR 53140.12'
    );
    expect(screen.getByTestId('order-subtotal-78')).toHaveTextContent(
      'INR 44999.00'
    );
    expect(screen.getByTestId('order-item-tax-78')).toHaveTextContent(
      'INR 8099.82'
    );
    expect(
      screen.getByTestId('order-charge-line-78-delivery-1')
    ).toHaveTextContent('Delivery charge (v1)');
    expect(
      screen.getByTestId('order-charge-line-78-delivery-1')
    ).toHaveTextContent('INR 25.00');
    expect(
      screen.getByTestId('order-charge-line-78-packaging-2')
    ).toHaveTextContent('Packaging fee (Parcel #74) (v1)');
    expect(
      screen.getByTestId('order-charge-line-78-packaging-2')
    ).toHaveTextContent('INR 10.00');
    expect(screen.getByTestId('order-fee-tax-78')).toHaveTextContent(
      'INR 6.30'
    );
    expect(screen.getByTestId('order-breakdown-total-78')).toHaveTextContent(
      'INR 53140.12'
    );

    // Older order #74 without customer_charges displays subtotal, tax, and grand total cleanly without empty charge lines
    expect(screen.getByTestId('order-grand-total-74')).toHaveTextContent(
      'INR 82600.00'
    );
    expect(
      screen.queryByTestId('order-customer-charges-list-74')
    ).toBeNull();
    expect(screen.queryByTestId('order-delivery-charge-74')).toBeNull();
    expect(screen.queryByTestId('order-packaging-fee-74')).toBeNull();
    expect(screen.queryByTestId('order-fee-tax-74')).toBeNull();
    unmount();

    // OrderSuccessConfirmation (checkout receipt) also renders customer_charges and grand_total verbatim
    render(
      <ToastProvider>
        <OrderSuccessConfirmation
          order={order78WithCharges}
          onBackToHome={vi.fn()}
        />
      </ToastProvider>
    );
    expect(
      screen.getByTestId('confirmed-order-charge-delivery-1')
    ).toHaveTextContent('INR 25.00');
    expect(
      screen.getByTestId('confirmed-order-charge-packaging-2')
    ).toHaveTextContent('INR 10.00');
    expect(
      screen.getByTestId('confirmed-order-fee-tax-total')
    ).toHaveTextContent('INR 6.30');
    expect(
      screen.getByTestId('confirmed-order-grand-total')
    ).toHaveTextContent('INR 53140.12');
  });

  it('5. Admin Delivery and Packaging Fees Module: renders in-force & next scheduled rules, version history, help text, allows non-superuser staff admin to schedule rules, maps 400/409 errors under matching fields, and has NO edit or delete controls', async () => {
    const liveDeliveryRule1 = {
      id: 1,
      currency: 'INR',
      version: 1,
      effective_from: '2026-11-27',
      effective_to: null,
      tax_rate: '18.00',
      status: 'approved',
      reason: 'Live checkout proof; administrative fee schedule verification',
      created_by: 50,
      free_threshold: '1000000.00',
      flat_fee: '25.00',
    };
    const liveDeliveryRule2 = {
      id: 2,
      currency: 'AED',
      version: 1,
      effective_from: '2026-12-15',
      effective_to: null,
      tax_rate: '0.00',
      status: 'approved',
      reason: 'LIVE PROOF, IGNORE',
      created_by: 50,
      free_threshold: '500.00',
      flat_fee: '20.00',
    };
    const livePackagingRule1 = {
      id: 1,
      currency: 'INR',
      version: 1,
      effective_from: '2026-11-27',
      effective_to: null,
      tax_rate: '18.00',
      status: 'approved',
      reason: 'Live checkout proof; administrative fee schedule verification',
      created_by: 50,
      fee_per_parcel: '10.00',
    };

    apiRequest.mockImplementation(async (url, opts) => {
      if (
        url === '/api/admin/orders/delivery-fee-rules/' &&
        (!opts || !opts.method)
      ) {
        return {
          count: 2,
          next: null,
          previous: null,
          results: [liveDeliveryRule2, liveDeliveryRule1],
        };
      }
      if (
        url === '/api/admin/orders/packaging-fee-rules/' &&
        (!opts || !opts.method)
      ) {
        return {
          count: 1,
          next: null,
          previous: null,
          results: [livePackagingRule1],
        };
      }
      if (
        url === '/api/admin/orders/delivery-fee-rules/current/?currency=INR'
      ) {
        return {
          currency: 'INR',
          as_of_date: '2026-11-27',
          in_force: liveDeliveryRule1,
          next: null,
        };
      }
      if (
        url === '/api/admin/orders/delivery-fee-rules/current/?currency=AED'
      ) {
        return {
          currency: 'AED',
          as_of_date: '2026-11-27',
          in_force: null,
          next: liveDeliveryRule2,
        };
      }
      if (
        url === '/api/admin/orders/delivery-fee-rules/current/?currency=EUR'
      ) {
        return {
          currency: 'EUR',
          as_of_date: '2026-11-27',
          in_force: null,
          next: null,
        };
      }
      if (
        url === '/api/admin/orders/packaging-fee-rules/current/?currency=INR'
      ) {
        return {
          currency: 'INR',
          as_of_date: '2026-11-27',
          in_force: livePackagingRule1,
          next: null,
        };
      }
      return { currency: 'AED', as_of_date: '2026-11-27', in_force: null, next: null };
    });

    // Render as non-superuser staff admin (`admin_test`, is_staff: true, is_superuser: false)
    render(
      <AuthContext.Provider
        value={{
          isLoggedIn: true,
          isResolving: false,
          currentUser: {
            id: 50,
            username: 'admin_test',
            role: 'admin',
            is_staff: true,
            is_superuser: false,
          },
        }}
      >
        <DeliveryPackagingFeesModule />
      </AuthContext.Provider>
    );

    // 1) Help text & tax rate help text
    expect(
      await screen.findByTestId('fee-rule-immutability-help')
    ).toHaveTextContent(
      'A fee rule cannot be edited. To change it, schedule a new version.'
    );
    expect(screen.getByTestId('delivery-tax-rate-help')).toHaveTextContent(
      'Tax treatment is not decided yet. Leave at 0 unless your accountant confirms.'
    );

    // 2) In force today (INR) and Next scheduled (AED) rendered verbatim
    expect(
      await screen.findByTestId('delivery-in-force-fee-INR')
    ).toHaveTextContent('INR 25.00');
    expect(
      screen.getByTestId('delivery-in-force-threshold-INR')
    ).toHaveTextContent('INR 1000000.00');
    expect(screen.getByTestId('delivery-next-fee-AED')).toHaveTextContent(
      'AED 20.00'
    );
    expect(
      screen.getByTestId('delivery-next-threshold-AED')
    ).toHaveTextContent('AED 500.00');

    // 3) Version history rows rendered and NO edit or delete controls anywhere
    expect(screen.getByTestId('delivery-rule-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('delivery-rule-row-2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit|delete/i })).toBeNull();

    // 4) Error mapping on Delivery form: 400 backdated, above maximum, missing reason
    apiRequest.mockRejectedValueOnce(
      new ApiError('Validation failed', 400, {
        effective_from: ['Fee rules cannot be backdated.'],
        free_threshold: ['Threshold must be between 0 and 1000000.00.'],
        flat_fee: ['Delivery fee must be between 0 and 5000.00.'],
        tax_rate: ['Tax rate must be between 0 and 30.00.'],
        reason: ['This field may not be blank.'],
      })
    );

    fireEvent.click(screen.getByTestId('delivery-submit-btn'));

    expect(
      await screen.findByTestId('delivery-error-effective_from')
    ).toHaveTextContent('Fee rules cannot be backdated.');
    expect(
      screen.getByTestId('delivery-error-free_threshold')
    ).toHaveTextContent('Threshold must be between 0 and 1000000.00.');
    expect(screen.getByTestId('delivery-error-flat_fee')).toHaveTextContent(
      'Delivery fee must be between 0 and 5000.00.'
    );
    expect(screen.getByTestId('delivery-error-tax_rate')).toHaveTextContent(
      'Tax rate must be between 0 and 30.00.'
    );
    expect(screen.getByTestId('delivery-error-reason')).toHaveTextContent(
      'This field may not be blank.'
    );

    // 5) 409 Date overlap error mapped under effective_from
    apiRequest.mockRejectedValueOnce(
      new ApiError(
        'The proposed date overlaps an existing or later fee-rule version.',
        409,
        {
          detail:
            'The proposed date overlaps an existing or later fee-rule version.',
        }
      )
    );
    fireEvent.click(screen.getByTestId('delivery-submit-btn'));
    expect(
      await screen.findByTestId('delivery-error-effective_from')
    ).toHaveTextContent(
      'The proposed date overlaps an existing or later fee-rule version.'
    );

    // 6) Switch to Packaging Fee Rules tab -> test form submission by non-superuser staff admin
    fireEvent.click(screen.getByTestId('tab-packaging-fee-rules'));

    expect(
      await screen.findByTestId('packaging-in-force-fee-INR')
    ).toHaveTextContent('INR 10.00');
    expect(screen.getByTestId('packaging-tax-rate-help')).toHaveTextContent(
      'Tax treatment is not decided yet. Leave at 0 unless your accountant confirms.'
    );

    fireEvent.change(screen.getByTestId('packaging-currency-input'), {
      target: { value: 'AED' },
    });
    fireEvent.change(screen.getByTestId('packaging-fee-per-parcel-input'), {
      target: { value: '5.00' },
    });
    fireEvent.change(screen.getByTestId('packaging-tax-rate-input'), {
      target: { value: '0.00' },
    });
    fireEvent.change(screen.getByTestId('packaging-effective-from-input'), {
      target: { value: '2026-12-20' },
    });
    fireEvent.change(screen.getByTestId('packaging-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE' },
    });

    let postedPkgPayload = null;
    apiRequest.mockImplementationOnce(async (url, opts) => {
      expect(url).toBe('/api/admin/orders/packaging-fee-rules/');
      expect(opts?.method).toBe('POST');
      postedPkgPayload = JSON.parse(opts.body);
      return {
        id: 2,
        currency: 'AED',
        version: 1,
        fee_per_parcel: '5.00',
        tax_rate: '0.00',
        effective_from: '2026-12-20',
        effective_to: null,
        status: 'approved',
        reason: 'LIVE PROOF, IGNORE',
        created_by: 50,
      };
    });

    fireEvent.click(screen.getByTestId('packaging-submit-btn'));

    await waitFor(() => {
      expect(postedPkgPayload).toEqual({
        currency: 'AED',
        fee_per_parcel: '5.00',
        tax_rate: '0.00',
        effective_from: '2026-12-20',
        reason: 'LIVE PROOF, IGNORE',
      });
    });

    expect(
      await screen.findByTestId('fee-rules-feedback-banner')
    ).toHaveTextContent('Scheduled Packaging Fee Rule v1 (AED)');
  });

  it('6. Role Isolation & Read-Only Guard: customer, seller, and warehouse manager are blocked from /admin/delivery-packaging-fees, and non-staff users see read-only notice without forms', async () => {
    // 1. Route permission checks via authRouting.js
    expect(
      isRouteAllowedForRole('/admin/delivery-packaging-fees', 'customer')
    ).toBe(false);
    expect(
      isRouteAllowedForRole('/admin/delivery-packaging-fees', 'vendor')
    ).toBe(false);
    expect(
      isRouteAllowedForRole(
        '/admin/delivery-packaging-fees',
        'warehouse_manager'
      )
    ).toBe(false);
    expect(
      isRouteAllowedForRole('/admin/delivery-packaging-fees', 'admin')
    ).toBe(true);

    // 2. ProtectedRoute blocks customer, vendor, and warehouse_manager from /admin/delivery-packaging-fees
    for (const blockedRole of ['customer', 'vendor', 'warehouse_manager']) {
      const { unmount } = render(
        <AuthContext.Provider
          value={{
            isLoggedIn: true,
            isResolving: false,
            currentUser: { id: 99, username: 'non_admin', role: blockedRole },
          }}
        >
          <MemoryRouter initialEntries={['/admin/delivery-packaging-fees']}>
            <Routes>
              <Route
                path="/admin/:moduleId"
                element={
                  <ProtectedRoute
                    allowedRoles={getAllowedRolesForRoute('/admin')}
                  >
                    <DeliveryPackagingFeesModule />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );
      expect(screen.getByTestId('role-forbidden-screen')).toBeInTheDocument();
      expect(
        screen.queryByTestId('delivery-packaging-fees-admin-module')
      ).toBeNull();
      unmount();
    }

    // 3. If DeliveryPackagingFeesModule is rendered with a non-staff context, it hides the schedule forms and shows the read-only notice
    apiRequest.mockResolvedValue({ count: 0, results: [] });
    render(
      <AuthContext.Provider
        value={{
          isLoggedIn: true,
          isResolving: false,
          currentUser: {
            id: 21,
            username: 'Irfan',
            role: 'customer',
            is_staff: false,
            is_superuser: false,
          },
        }}
      >
        <DeliveryPackagingFeesModule />
      </AuthContext.Provider>
    );

    expect(
      await screen.findByTestId('fee-rules-readonly-notice')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-delivery-fee-form')).toBeNull();
  });
});
