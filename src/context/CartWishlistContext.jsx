import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useToast } from './ToastContext';

const CartWishlistContext = createContext(null);

// Initial Sample Items for Wishlist
const INITIAL_WISHLIST = [
  {
    id: 'fash-2',
    name: 'Handwoven Pure Mulberry Silk Banarasi Saree (Gold Zari)',
    category: 'Fashion',
    vendorName: 'Royal Heritage Silks & Fashion',
    price: 6499,
    originalPrice: 14999,
    discount: '56% Off',
    rating: 4.9,
    reviews: '3,110',
    image: '/products/banarasi_silk_saree_1786529541618.png'
  },
  {
    id: 'elec-2',
    name: 'Ultra-Slim OLED 4K 32" Curved Gaming Monitor',
    category: 'Electronics',
    vendorName: 'Apex Electronics Direct',
    price: 24499,
    originalPrice: 39999,
    discount: '38% Off',
    rating: 4.9,
    reviews: '3,410',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'home-2',
    name: 'Scandinavian Velvet Accent Lounge Armchair (Emerald Green)',
    category: 'Home',
    vendorName: 'Nordic Living & Furniture',
    price: 8499,
    originalPrice: 16000,
    discount: '46% Off',
    rating: 4.4,
    reviews: '4,290',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=500&q=80'
  }
];

// Initial Sample Items for Cart
const INITIAL_CART = [
  {
    id: 'elec-1',
    name: 'Mytri Elite Spatial ANC Wireless Headphones',
    category: 'Electronics',
    vendorName: 'Apex Electronics Direct',
    variant: 'Matte Emerald Green',
    price: 4999,
    originalPrice: 12999,
    quantity: 1,
    image: '/products/spatial_headphones_1786529304124.png'
  },
  {
    id: 'fash-1',
    name: 'Artisan Genuine Leather Chronograph Watch',
    category: 'Fashion',
    vendorName: 'Royal Heritage Silks & Fashion',
    variant: 'Vintage Cognac Brown',
    price: 3299,
    originalPrice: 7999,
    quantity: 1,
    image: '/products/leather_chronograph_watch_1786529580599.png'
  },
  {
    id: 'app-1',
    name: '15-Bar Artisan Italian Espresso Coffee Machine',
    category: 'Appliances',
    vendorName: 'Artisan Espresso Machines Co.',
    variant: 'Polished Brass & Chrome',
    price: 12999,
    originalPrice: 21999,
    quantity: 1,
    image: '/products/italian_espresso_machine_1786529559641.png'
  }
];

// Valid hardcoded coupon definitions
const VALID_COUPONS = {
  'SAVE10': { code: 'SAVE10', type: 'percent', value: 0.10, desc: '10% Instant Discount on Subtotal', maxCap: 1000 },
  'FLAT100': { code: 'FLAT100', type: 'flat', value: 100, desc: 'Flat ₹100 Off on Orders', minSubtotal: 500 },
  'PLUSVIP': { code: 'PLUSVIP', type: 'flat', value: 300, desc: 'Gold Plus VIP Voucher (₹300 Off)', minSubtotal: 2000 },
  'GOLD50': { code: 'GOLD50', type: 'percent', value: 0.50, desc: '50% Flash Sale Voucher (Max ₹500)', maxCap: 500 }
};

export function CartWishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(INITIAL_WISHLIST);
  const [cart, setCart] = useState(INITIAL_CART);
  const [savedForLater, setSavedForLater] = useState([]);
  
  // Customization & Checkout Options
  const [isGiftWrap, setIsGiftWrap] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('standard'); // 'standard' | 'express' | 'priority'
  const [deliveryDate, setDeliveryDate] = useState('tomorrow'); // 'tomorrow' | '2days' | 'custom'
  const [orderNotes, setOrderNotes] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Wallet & Loyalty Balances
  const walletBalance = 450.00;
  const rewardPointsBalance = 320; // 320 pts = ₹32
  const rewardPointsValue = 32.00;
  const [useWallet, setUseWallet] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(false);

  // Placed Order Receipt State (for Order Confirmation)
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  const toast = useToast();

  // --- WISHLIST ACTIONS ---
  const addToWishlist = useCallback((product) => {
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      return [product, ...prev];
    });
    toast.success("Added to Wishlist", `${product.name} saved to your favorites.`);
  }, [toast]);

  const removeFromWishlist = useCallback((productId) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
    toast.info("Removed from Wishlist", "Item removed from your favorites.");
  }, [toast]);

  const moveToCartFromWishlist = useCallback((product) => {
    // 1. Remove from wishlist
    setWishlist((prev) => prev.filter((item) => item.id !== product.id));
    // 2. Add to cart with quantity 1 (or increment if existing)
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        {
          id: product.id,
          name: product.name,
          category: product.category,
          vendorName: product.vendorName || 'Verified Merchant',
          variant: product.variant || 'Standard Edition',
          price: typeof product.price === 'number' ? product.price : parseInt(String(product.price).replace(/[^\d]/g, ''), 10) || 2999,
          originalPrice: typeof product.originalPrice === 'number' ? product.originalPrice : parseInt(String(product.originalPrice).replace(/[^\d]/g, ''), 10) || 5999,
          quantity: 1,
          image: product.image
        },
        ...prev
      ];
    });
    toast.cart("Moved to Bag", `${product.name} is now in your shopping bag.`, product.image);
  }, [toast]);

  // --- CART ACTIONS ---
  const addToCart = useCallback((product, qty = 1) => {
    const rawPrice = typeof product.price === 'number' ? product.price : parseInt(String(product.price).replace(/[^\d]/g, ''), 10) || 2999;
    const rawOrig = typeof product.originalPrice === 'number' ? product.originalPrice : parseInt(String(product.originalPrice).replace(/[^\d]/g, ''), 10) || 5999;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => 
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        {
          id: product.id,
          name: product.name,
          category: product.category,
          vendorName: product.vendorName || 'Verified Merchant',
          variant: product.variant || 'Standard Edition',
          price: rawPrice,
          originalPrice: rawOrig,
          quantity: qty,
          image: product.image
        },
        ...prev
      ];
    });
    toast.cart("Added to Bag", `${product.name} (Qty: ${qty}) added.`, product.image);
  }, [toast]);

  const updateCartQuantity = useCallback((productId, delta) => {
    setCart((prev) => 
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    toast.info("Removed from Bag", "Item removed from your shopping bag.");
  }, [toast]);

  const saveForLaterItem = useCallback((product) => {
    setCart((prev) => prev.filter((item) => item.id !== product.id));
    setSavedForLater((prev) => [product, ...prev]);
    toast.info("Saved for Later", `${product.name} moved to saved items.`);
  }, [toast]);

  const moveToCartFromSaved = useCallback((product) => {
    setSavedForLater((prev) => prev.filter((item) => item.id !== product.id));
    setCart((prev) => [{ ...product, quantity: product.quantity || 1 }, ...prev]);
    toast.cart("Moved to Bag", `${product.name} added back to shopping bag.`, product.image);
  }, [toast]);

  const removeSavedForLater = useCallback((productId) => {
    setSavedForLater((prev) => prev.filter((item) => item.id !== productId));
    toast.info("Removed", "Item removed from saved list.");
  }, [toast]);

  // --- COUPON VALIDATION ---
  const applyCoupon = useCallback((codeString) => {
    setCouponError('');
    if (!codeString || !codeString.trim()) {
      setCouponError('Please enter a coupon code.');
      return false;
    }
    const clean = codeString.trim().toUpperCase();
    const found = VALID_COUPONS[clean];

    if (!found) {
      setCouponError(`Invalid coupon code "${clean}". Try SAVE10, FLAT100, or PLUSVIP.`);
      return false;
    }

    setAppliedCoupon(found);
    toast.success("Coupon Applied!", `${found.desc} applied successfully.`);
    return true;
  }, [toast]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError('');
    toast.info("Coupon Removed", "Voucher discount removed from total.");
  }, [toast]);

  // --- STRICT MATHEMATICAL DERIVATIONS ---
  const calculations = useMemo(() => {
    // 1. Subtotal
    const cartSubtotal = Number(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2));

    // 2. Coupon Discount
    let couponDiscount = 0;
    if (appliedCoupon && cartSubtotal > 0) {
      if (appliedCoupon.type === 'percent') {
        let disc = cartSubtotal * appliedCoupon.value;
        if (appliedCoupon.maxCap) disc = Math.min(disc, appliedCoupon.maxCap);
        couponDiscount = Number(disc.toFixed(2));
      } else if (appliedCoupon.type === 'flat') {
        if (!appliedCoupon.minSubtotal || cartSubtotal >= appliedCoupon.minSubtotal) {
          couponDiscount = Math.min(appliedCoupon.value, cartSubtotal);
        }
      }
    }

    // 3. Gift Wrap Fee
    const giftWrapFee = isGiftWrap ? 49.00 : 0.00;

    // 4. Shipping Fee
    let shippingFee = 0.00;
    if (shippingMethod === 'express') shippingFee = 99.00;
    else if (shippingMethod === 'priority') shippingFee = 199.00;
    else shippingFee = 0.00; // Free Standard

    // 5. Taxable Base (Subtotal - Coupon Discount)
    const taxableBase = Math.max(0, cartSubtotal - couponDiscount);

    // 6. GST Tax (5% Standard Marketplace Rate)
    const taxRate = 0.05;
    const taxAmount = Number((taxableBase * taxRate).toFixed(2));

    // 7. Pre-Deduction Total
    const preDeductionTotal = Number((taxableBase + giftWrapFee + shippingFee + taxAmount).toFixed(2));

    // 8. Wallet Deduction (Capped at remaining total)
    let walletDeduction = 0.00;
    if (useWallet && preDeductionTotal > 0) {
      walletDeduction = Math.min(walletBalance, preDeductionTotal);
    }

    // 9. Reward Points Deduction (Capped at remaining total after wallet)
    let rewardPointsDeduction = 0.00;
    const remainingAfterWallet = Math.max(0, preDeductionTotal - walletDeduction);
    if (useRewardPoints && remainingAfterWallet > 0) {
      rewardPointsDeduction = Math.min(rewardPointsValue, remainingAfterWallet);
    }

    // 10. Final Payable Amount (Guaranteed Strictly Non-Negative)
    const amountPayable = Math.max(0, Number((preDeductionTotal - walletDeduction - rewardPointsDeduction).toFixed(2)));

    // Total Savings
    const totalOriginal = cart.reduce((acc, item) => acc + ((item.originalPrice || item.price * 1.8) * item.quantity), 0);
    const totalSavings = Math.max(0, (totalOriginal - cartSubtotal) + couponDiscount + walletDeduction + rewardPointsDeduction);

    return {
      cartSubtotal,
      couponDiscount,
      giftWrapFee,
      shippingFee,
      taxableBase,
      taxRatePercent: '5%',
      taxAmount,
      preDeductionTotal,
      walletDeduction,
      rewardPointsDeduction,
      amountPayable,
      totalSavings
    };
  }, [cart, appliedCoupon, isGiftWrap, shippingMethod, useWallet, useRewardPoints]);

  // --- CHECKOUT PLACEMENT SIMULATION ---
  const placeOrder = useCallback((checkoutDetails) => {
    const orderId = `MK-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      orderId,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      items: [...cart],
      calculations: { ...calculations },
      shippingAddress: checkoutDetails.shippingAddress,
      paymentMethod: checkoutDetails.paymentMethod,
      shippingMethod,
      deliveryDate,
      orderNotes
    };

    setLastPlacedOrder(newOrder);
    // Clear cart after checkout
    setCart([]);
    setAppliedCoupon(null);
    setUseWallet(false);
    setUseRewardPoints(false);

    toast.success("Order Placed Successfully!", `Order ${orderId} confirmed. Delivering to ${checkoutDetails.shippingAddress?.city || 'Mumbai'}.`);
    return newOrder;
  }, [cart, calculations, shippingMethod, deliveryDate, orderNotes, toast]);

  const value = {
    wishlist,
    cart,
    savedForLater,
    wishlistCount: wishlist.length,
    cartCount: cart.reduce((acc, item) => acc + item.quantity, 0),
    isGiftWrap,
    setIsGiftWrap,
    shippingMethod,
    setShippingMethod,
    deliveryDate,
    setDeliveryDate,
    orderNotes,
    setOrderNotes,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    walletBalance,
    rewardPointsBalance,
    rewardPointsValue,
    useWallet,
    setUseWallet,
    useRewardPoints,
    setUseRewardPoints,
    calculations,
    lastPlacedOrder,
    // Actions
    addToWishlist,
    removeFromWishlist,
    moveToCartFromWishlist,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    saveForLaterItem,
    moveToCartFromSaved,
    removeSavedForLater,
    placeOrder
  };

  return (
    <CartWishlistContext.Provider value={value}>
      {children}
    </CartWishlistContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartWishlistContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartWishlistProvider');
  }
  return ctx;
}
