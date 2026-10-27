import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { apiRequest } from '../utils/api';

const CartWishlistContext = createContext(null);

export function CartWishlistProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, currentUser, isProductOwnedByCurrentSeller } = useAuth();
  const toast = useToast();

  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [savedForLater, setSavedForLater] = useState([]);
  
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // In-memory queue for pending actions (gating resume after login)
  const pendingActionRef = useRef(null);

  // Discard any old localStorage cart or wishlist keys left over from earlier guest behavior
  useEffect(() => {
    try {
      const keysToPurge = [
        'cart',
        'wishlist',
        'mytrikart_cart',
        'mytrikart_wishlist',
        'mytrikart_guest_cart',
        'mytrikart_guest_wishlist'
      ];
      keysToPurge.forEach((key) => localStorage.removeItem(key));
      sessionStorage.removeItem('mytrikart_applied_coupon');
    } catch (_) {}
  }, []);

  // Helper to map backend CartItem serializer output to clean frontend shape
  const mapCartItem = useCallback((item) => {
    const details = item.product_details || {};
    const unitPrice = typeof details.unit_price === 'number'
      ? details.unit_price
      : (parseFloat(details.unit_price || '0') || 0);

    let variantLabel = details.sku_code || 'Standard Edition';
    if (details.attributes && typeof details.attributes === 'object' && Object.keys(details.attributes).length > 0) {
      variantLabel = Object.entries(details.attributes).map(([k, v]) => `${k}: ${v}`).join(', ');
    }

    return {
      id: item.id, // CartItem PK in backend
      cartItemId: item.id,
      variantId: item.product_variant,
      productId: details.product_id,
      name: details.product_name || 'Product',
      category: details.vendor_display_name || 'General',
      vendorName: details.vendor_display_name || 'Verified Merchant',
      variant: variantLabel,
      price: unitPrice,
      originalPrice: null,
      quantity: item.quantity,
      image: details.primary_image_url || '/products/spatial_headphones_1786529304124.png',
      stockQuantity: details.stock_quantity ?? 0, // Server is source of truth: 0 fallback, no fake 999
      skuCode: details.sku_code,
      currency: details.currency || 'INR',
      addedAt: item.added_at
    };
  }, []);

  // Shared gate for shopping actions
  const checkCustomerAuth = useCallback((actionType, payload, actionDescription = 'continue') => {
    if (!isLoggedIn) {
      if (actionType) {
        pendingActionRef.current = { type: actionType, payload, actionDescription };
      }
      toast.info(
        "Login Required",
        `Please sign in to ${actionDescription}.`
      );
      const currentPath = `${location.pathname}${location.search}`;
      navigate('/login', { state: { from: currentPath } });
      return false;
    }

    if (currentUser?.role && currentUser.role !== 'customer') {
      toast.error(
        "Account Restricted",
        "Please use a customer account to shop."
      );
      return false;
    }

    return true;
  }, [isLoggedIn, currentUser, toast, navigate, location.pathname, location.search]);

  // Load real cart from GET /api/orders/cart/ when logged in as customer
  const fetchCart = useCallback(async () => {
    if (!isLoggedIn || (currentUser?.role && currentUser.role !== 'customer')) {
      setCart([]);
      return;
    }
    setCartLoading(true);
    try {
      const items = await apiRequest('/api/orders/cart/');
      if (Array.isArray(items)) {
        setCart(items.map(mapCartItem));
      } else {
        setCart([]);
      }
    } catch (_) {
      setCart([]);
    } finally {
      setCartLoading(false);
    }
  }, [isLoggedIn, currentUser?.role, mapCartItem]);

  // Load real wishlist from GET /api/customers/wishlist/ when logged in as customer
  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn || (currentUser?.role && currentUser.role !== 'customer')) {
      setWishlist([]);
      return;
    }
    try {
      const items = await apiRequest('/api/customers/wishlist/');
      if (Array.isArray(items)) {
        const enriched = await Promise.all(
          items.map(async (item) => {
            try {
              const prod = await apiRequest(`/api/products/published/${item.product}/`);
              const primaryVar = (prod.variants || []).find(v => v.id === item.variant) || prod.variants?.[0] || {};
              const rawPrice = parseFloat(primaryVar.price || 0);
              const rawMrp = primaryVar.mrp ? parseFloat(primaryVar.mrp) : null;
              const primaryImg = (prod.images || []).find(img => img.is_primary)?.image || prod.images?.[0]?.image || '/products/spatial_headphones_1786529304124.png';

              return {
                id: item.product,
                productId: item.product,
                variantId: item.variant || primaryVar.id,
                wishlistId: item.id,
                addedAt: item.added_at,
                name: prod.name,
                category: prod.category_name || 'General',
                vendorName: prod.vendor_display_name || 'Verified Merchant',
                price: rawPrice,
                originalPrice: rawMrp && rawMrp > rawPrice ? rawMrp : null,
                discount: primaryVar.discount_percentage ? `${Math.round(primaryVar.discount_percentage)}% Off` : null,
                image: primaryImg,
                rating: prod.average_rating || '4.8',
              };
            } catch (_) {
              return {
                id: item.product,
                productId: item.product,
                variantId: item.variant,
                wishlistId: item.id,
                addedAt: item.added_at,
                name: `Product #${item.product}`,
                price: 0,
                image: '/products/spatial_headphones_1786529304124.png'
              };
            }
          })
        );
        setWishlist(enriched);
      } else {
        setWishlist([]);
      }
    } catch (_) {
      setWishlist([]);
    }
  }, [isLoggedIn, currentUser?.role]);

  // Synchronize cart & wishlist when auth status changes
  useEffect(() => {
    if (isLoggedIn && currentUser?.role === 'customer') {
      fetchCart();
      fetchWishlist();
    } else {
      setCart([]);
      setWishlist([]);
      setSavedForLater([]);
      setAppliedCoupon(null);
      setCouponError('');
    }
  }, [isLoggedIn, currentUser?.role, fetchCart, fetchWishlist]);

  // Helper to resolve variant ID
  const resolveVariantId = async (product) => {
    let variantId = null;
    if (typeof product === 'object' && product !== null) {
      variantId = product.variantId || product.product_variant || product.variants?.[0]?.id;
      if (!variantId && (product.productId || product.id)) {
        const prodId = product.productId || product.id;
        try {
          const pubProd = await apiRequest(`/api/products/published/${prodId}/`);
          variantId = pubProd?.variants?.[0]?.id;
        } catch (_) {
          try {
            const fetchedProd = await apiRequest(`/api/products/${prodId}/`);
            variantId = fetchedProd?.variants?.[0]?.id || fetchedProd?.variants?.[0]?.variant_id;
          } catch (_) {}
        }
      }
    } else {
      variantId = product;
    }
    return variantId;
  };

  // Execution functions (called when authorized)
  const executeAddToCart = useCallback(async (product, qty = 1) => {
    if (isProductOwnedByCurrentSeller && isProductOwnedByCurrentSeller(product)) {
      toast.error(
        "Seller Action Restricted",
        "You cannot purchase items from your own seller catalog. You can purchase items from other sellers."
      );
      return { success: false, reason: 'You cannot purchase items from your own seller catalog' };
    }

    const itemName = product?.name || product?.title || 'Item';
    const variantId = await resolveVariantId(product);

    if (variantId && !Number.isNaN(Number(variantId))) {
      try {
        await apiRequest('/api/orders/cart/', {
          method: 'POST',
          body: JSON.stringify({ product_variant: Number(variantId), quantity: qty })
        });
        await fetchCart();
        toast.cart("Added to Bag", `${itemName} (Qty: ${qty}) added.`, product?.image);
        return { success: true, name: itemName };
      } catch (err) {
        const errMsg = err?.data?.detail || err?.data?.quantity?.[0] || err?.data?.product_variant?.[0] || err?.message || `Failed to add "${itemName}" to cart.`;
        toast.error("Add to Bag Failed", errMsg);
        return { success: false, reason: errMsg, name: itemName };
      }
    }

    const errNoVariant = `Unable to resolve product variant for "${itemName}".`;
    toast.error("Add to Bag Failed", errNoVariant);
    return { success: false, reason: errNoVariant, name: itemName };
  }, [isProductOwnedByCurrentSeller, toast, fetchCart]);

  const executeAddToWishlist = useCallback(async (product) => {
    const targetProduct = typeof product === 'object' ? product : { id: product };
    const productId = targetProduct.productId || targetProduct.id;

    try {
      await apiRequest('/api/customers/wishlist/', {
        method: 'POST',
        body: JSON.stringify({ product: productId, variant: targetProduct.variantId || null })
      });
      await fetchWishlist();
      toast.success("Added to Wishlist", `${targetProduct.name || 'Item'} saved to your favorites.`);
      return { success: true };
    } catch (err) {
      if (err?.status === 409) {
        toast.info("Wishlist", "Item is already in your wishlist.");
      } else {
        const errorMsg = err?.data?.detail || err?.data?.product?.[0] || err?.message || 'Failed to save item to wishlist.';
        toast.error("Wishlist Error", errorMsg);
      }
      return { success: false, error: err };
    }
  }, [fetchWishlist, toast]);

  const executeMoveToCartFromWishlist = useCallback(async (product) => {
    if (isProductOwnedByCurrentSeller && isProductOwnedByCurrentSeller(product)) {
      toast.error(
        "Seller Action Restricted",
        "You cannot purchase items from your own seller catalog. You can purchase items from other sellers."
      );
      return;
    }

    let variantId = null;
    if (typeof product === 'object' && product !== null) {
      variantId = product.variantId || product.product_variant || product.variants?.[0]?.id || product.id;
    } else {
      variantId = product;
    }

    try {
      // 1. Add to cart via real API
      await apiRequest('/api/orders/cart/', {
        method: 'POST',
        body: JSON.stringify({ product_variant: Number(variantId), quantity: 1 })
      });

      // 2. Only after cart call succeeds, remove from wishlist on server
      const wishlistItemId = product.wishlistId || wishlist.find(w => w.id === product.id || w.productId === product.id)?.wishlistId;
      if (wishlistItemId) {
        try {
          await apiRequest(`/api/customers/wishlist/${wishlistItemId}/`, { method: 'DELETE' });
        } catch (_) {}
      }

      await Promise.all([fetchCart(), fetchWishlist()]);
      toast.cart("Moved to Bag", `${product.name || 'Item'} is now in your shopping bag.`, product.image);
    } catch (err) {
      const errorMsg = err?.data?.detail || err?.data?.product_variant?.[0] || err?.message || 'Failed to move item to cart.';
      toast.error("Cart Error", errorMsg);
    }
  }, [isProductOwnedByCurrentSeller, wishlist, fetchCart, fetchWishlist, toast]);

  const wasLoggedInRef = useRef(isLoggedIn);

  // Resume pending action after login
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      wasLoggedInRef.current = true;
      if (currentUser.role === 'customer') {
        const pending = pendingActionRef.current;
        if (pending) {
          pendingActionRef.current = null;
          if (pending.type === 'ADD_TO_CART') {
            executeAddToCart(pending.payload.product, pending.payload.qty);
          } else if (pending.type === 'ADD_TO_WISHLIST') {
            executeAddToWishlist(pending.payload.product);
          } else if (pending.type === 'MOVE_TO_CART_FROM_WISHLIST') {
            executeMoveToCartFromWishlist(pending.payload.product);
          }
        }
      } else {
        // Discard pending action if non-customer (seller or admin) logged in
        pendingActionRef.current = null;
      }
    } else if (!isLoggedIn) {
      if (wasLoggedInRef.current) {
        pendingActionRef.current = null;
        wasLoggedInRef.current = false;
      }
    }
  }, [isLoggedIn, currentUser, executeAddToCart, executeAddToWishlist, executeMoveToCartFromWishlist]);

  // --- PUBLIC WISHLIST ACTIONS ---
  const addToWishlist = useCallback(async (product) => {
    if (!checkCustomerAuth('ADD_TO_WISHLIST', { product }, 'save items to your wishlist')) {
      return { success: false, reason: 'Authentication required' };
    }
    return await executeAddToWishlist(product);
  }, [checkCustomerAuth, executeAddToWishlist]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!checkCustomerAuth(null, null, 'manage your wishlist')) return;

    const target = wishlist.find((item) => item.id === productId || item.productId === productId || item.wishlistId === productId);
    const wishlistItemId = target?.wishlistId;

    if (wishlistItemId) {
      try {
        await apiRequest(`/api/customers/wishlist/${wishlistItemId}/`, { method: 'DELETE' });
        await fetchWishlist();
        toast.info("Removed from Wishlist", "Item removed from your favorites.");
      } catch (err) {
        const errorMsg = err?.data?.detail || err?.message || 'Failed to remove item from wishlist.';
        toast.error("Wishlist Error", errorMsg);
      }
    }
  }, [checkCustomerAuth, wishlist, fetchWishlist, toast]);

  const moveToCartFromWishlist = useCallback(async (product) => {
    if (!checkCustomerAuth('MOVE_TO_CART_FROM_WISHLIST', { product }, 'add items to your shopping cart')) {
      return;
    }
    await executeMoveToCartFromWishlist(product);
  }, [checkCustomerAuth, executeMoveToCartFromWishlist]);

  // --- PUBLIC CART ACTIONS ---
  const addToCart = useCallback(async (product, qty = 1) => {
    if (!checkCustomerAuth('ADD_TO_CART', { product, qty }, 'add items to your shopping cart')) {
      return { success: false, reason: 'Authentication required' };
    }
    return await executeAddToCart(product, qty);
  }, [checkCustomerAuth, executeAddToCart]);

  const applyCoupon = useCallback(async (code) => {
    if (!checkCustomerAuth(null, null, 'apply coupons')) return false;

    setCouponError('');
    if (!code || !code.trim()) {
      setCouponError('Please enter a coupon code.');
      return false;
    }
    try {
      const result = await apiRequest('/api/orders/apply-coupon/', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() })
      });
      const couponData = {
        code: result.code,
        desc: result.description || `${result.discount_type === 'percentage' ? `${result.discount_value}% off` : `₹${result.discount_value} off`}`,
        discountAmount: Number(result.discount_amount),
        type: result.discount_type
      };
      setAppliedCoupon(couponData);
      toast.success('Coupon Applied!', `₹${couponData.discountAmount.toFixed(2)} discount validated.`);
      return true;
    } catch (err) {
      const message = err?.data?.detail || err?.message || 'Coupon could not be applied.';
      setCouponError(message);
      toast.error('Coupon Error', message);
      return false;
    }
  }, [checkCustomerAuth, toast]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError('');
    try {
      sessionStorage.removeItem('mytrikart_applied_coupon');
    } catch (_) {}
    toast.info("Coupon Removed", "Promotional coupon has been removed.");
  }, [toast]);

  const updateCartQuantity = useCallback(async (cartItemId, deltaOrNewQty) => {
    if (!checkCustomerAuth(null, null, 'modify your cart')) return;

    const existing = cart.find((item) => item.id === cartItemId || item.cartItemId === cartItemId);
    if (!existing) return;

    let newQty = 1;
    if (deltaOrNewQty === 1 || deltaOrNewQty === -1) {
      newQty = existing.quantity + deltaOrNewQty;
    } else {
      newQty = deltaOrNewQty;
    }

    if (newQty < 1) {
      return;
    }

    try {
      await apiRequest(`/api/orders/cart/${existing.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQty })
      });
      await fetchCart();
    } catch (err) {
      const errorMsg = err?.data?.detail || err?.data?.quantity?.[0] || err?.message || 'Failed to update item quantity.';
      toast.error("Cart Error", errorMsg);
    }
  }, [checkCustomerAuth, cart, fetchCart, toast]);

  const removeFromCart = useCallback(async (cartItemId) => {
    if (!checkCustomerAuth(null, null, 'modify your cart')) return;

    const existing = cart.find((item) => item.id === cartItemId || item.cartItemId === cartItemId);
    const targetId = existing ? existing.id : cartItemId;

    try {
      await apiRequest(`/api/orders/cart/${targetId}/`, {
        method: 'DELETE'
      });
      await fetchCart();
      toast.info("Removed from Bag", "Item removed from your shopping bag.");
    } catch (err) {
      const errorMsg = err?.data?.detail || err?.message || 'Failed to remove item.';
      toast.error("Cart Error", errorMsg);
    }
  }, [checkCustomerAuth, cart, fetchCart, toast]);

  const saveForLaterItem = useCallback((product) => {
    removeFromCart(product.id);
    setSavedForLater((prev) => [product, ...prev]);
    toast.info("Saved for Later", `${product.name} moved to saved items.`);
  }, [removeFromCart, toast]);

  const moveToCartFromSaved = useCallback(async (product) => {
    if (!checkCustomerAuth('ADD_TO_CART', { product, qty: product.quantity || 1 }, 'add items to your shopping cart')) {
      return;
    }

    setSavedForLater((prev) => prev.filter((item) => item.id !== product.id));
    await addToCart(product, product.quantity || 1);
  }, [checkCustomerAuth, addToCart]);

  const removeSavedForLater = useCallback((productId) => {
    setSavedForLater((prev) => prev.filter((item) => item.id !== productId));
    toast.info("Removed", "Item removed from saved list.");
  }, [toast]);

  // --- MATHEMATICAL DERIVATIONS ---
  const calculations = useMemo(() => {
    // 1. Subtotal
    const cartSubtotal = Number(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2));

    // 2. Shipping Fee (Standard Free)
    const shippingFee = 0.00;

    // Preview uses only the discount amount returned by the server. Checkout revalidates it.
    const couponDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;

    // 4. Taxable Base & GST (5%)
    const postDiscountSubtotal = Math.max(0, cartSubtotal - couponDiscount);
    const taxableBase = postDiscountSubtotal;
    const taxRate = 0.05;
    const taxAmount = Number((taxableBase * taxRate).toFixed(2));

    // 5. Payable Total Amount
    const amountPayable = Number((postDiscountSubtotal + shippingFee + taxAmount).toFixed(2));

    return {
      cartSubtotal,
      couponDiscount,
      giftWrapFee: 0.00,
      shippingFee,
      taxableBase,
      taxRatePercent: '5%',
      taxAmount,
      preDeductionTotal: amountPayable,
      walletDeduction: 0.00,
      rewardPointsDeduction: 0.00,
      amountPayable,
      totalSavings: couponDiscount
    };
  }, [cart, appliedCoupon]);

  // --- REAL BACKEND CHECKOUT ---
  const placeOrder = useCallback(async (checkoutDetails) => {
    const addr = checkoutDetails?.shippingAddress || checkoutDetails?.delivery_address || {};
    
    // Map address fields to the exact keys required by create_order_from_cart in backend
    const delivery_address = {
      recipient_name: addr.full_name || addr.recipient_name || addr.name || '',
      recipient_phone: addr.phone_number || addr.recipient_phone || addr.phone || '',
      address_line1: addr.address_line1 || addr.addressLine || '',
      address_line2: addr.address_line2 || addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || addr.pincode || '',
      country: addr.country || 'IN'
    };

    try {
      const createdOrder = await apiRequest('/api/orders/checkout/', {
        method: 'POST',
        body: JSON.stringify({ delivery_address, coupon_code: appliedCoupon?.code || null })
      });

      setLastPlacedOrder(createdOrder);
      setCart([]);
      setAppliedCoupon(null);
      setCouponError('');
      try { sessionStorage.removeItem('mytrikart_applied_coupon'); } catch (_) {}
      toast.success("Order Placed Successfully!", `Order ${createdOrder.order_number || createdOrder.id} confirmed.`);
      return createdOrder;
    } catch (err) {
      const errorMsg = err?.data?.detail || err?.message || 'Failed to place order. Please verify details and try again.';
      toast.error("Checkout Error", errorMsg);
      throw err;
    }
  }, [toast, appliedCoupon]);

  const value = {
    wishlist,
    cart,
    savedForLater,
    cartLoading,
    wishlistCount: wishlist.length,
    cartCount: cart.reduce((acc, item) => acc + item.quantity, 0),
    calculations,
    lastPlacedOrder,
    fetchCart,
    fetchWishlist,
    // Coupon state & actions
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
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
