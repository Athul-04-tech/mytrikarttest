import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { apiRequest } from '../utils/api';

const CartWishlistContext = createContext(null);

export function CartWishlistProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const toast = useToast();

  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [savedForLater, setSavedForLater] = useState([]);
  
  // Placed Order Receipt State (for Order Confirmation)
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

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
      stockQuantity: details.stock_quantity ?? 999,
      skuCode: details.sku_code,
      currency: details.currency || 'INR',
      addedAt: item.added_at
    };
  }, []);

  // Auth requirement guard for guest users
  const requireAuth = useCallback((actionDescription = 'add items to your shopping cart') => {
    if (!isLoggedIn) {
      toast.info(
        "Login Required",
        `Please sign in to ${actionDescription}.`
      );
      const currentPath = `${location.pathname}${location.search}`;
      navigate('/login', { state: { from: currentPath } });
      return false;
    }
    return true;
  }, [isLoggedIn, toast, navigate, location.pathname, location.search]);

  // Load real cart from GET /api/orders/cart/ when logged in
  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) {
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
    } catch (err) {
      // Keep cart [] on unauthenticated or error
      setCart([]);
    } finally {
      setCartLoading(false);
    }
  }, [isLoggedIn, mapCartItem]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Load real wishlist from GET /api/customers/wishlist/ when logged in
  useEffect(() => {
    if (isLoggedIn) {
      apiRequest('/api/customers/wishlist/')
        .then((items) => {
          if (Array.isArray(items)) {
            setWishlist(items.map((item) => ({
              id: item.product,
              productId: item.product,
              variantId: item.variant,
              wishlistId: item.id,
              addedAt: item.added_at
            })));
          }
        })
        .catch(() => {
          // Keep local wishlist state on error
        });
    } else {
      setWishlist([]);
    }
  }, [isLoggedIn]);

  // --- WISHLIST ACTIONS ---
  const addToWishlist = useCallback(async (product) => {
    if (!requireAuth('save items to your wishlist')) return;

    const targetProduct = typeof product === 'object' ? product : { id: product };
    const productId = targetProduct.id;

    try {
      const res = await apiRequest('/api/customers/wishlist/', {
        method: 'POST',
        body: JSON.stringify({ product: productId, variant: targetProduct.variantId || null })
      });
      const newItem = {
        ...targetProduct,
        id: productId,
        productId,
        wishlistId: res?.id
      };
      setWishlist((prev) => {
        if (prev.some((item) => item.id === productId || item.productId === productId)) return prev;
        return [newItem, ...prev];
      });
      toast.success("Added to Wishlist", `${targetProduct.name || 'Item'} saved to your favorites.`);
    } catch (err) {
      if (err?.status === 409) {
        toast.info("Wishlist", "Item is already in your wishlist.");
      } else {
        setWishlist((prev) => {
          if (prev.some((item) => item.id === productId)) return prev;
          return [targetProduct, ...prev];
        });
        toast.success("Added to Wishlist", `${targetProduct.name || 'Item'} saved to your favorites.`);
      }
    }
  }, [requireAuth, toast]);

  const removeFromWishlist = useCallback(async (productId) => {
    const target = wishlist.find((item) => item.id === productId || item.productId === productId || item.wishlistId === productId);
    const wishlistItemId = target?.wishlistId;

    setWishlist((prev) => prev.filter((item) => item.id !== productId && item.productId !== productId && item.wishlistId !== productId));
    toast.info("Removed from Wishlist", "Item removed from your favorites.");

    if (isLoggedIn && wishlistItemId) {
      try {
        await apiRequest(`/api/customers/wishlist/${wishlistItemId}/`, { method: 'DELETE' });
      } catch (err) {
        // Silently handle error
      }
    }
  }, [wishlist, isLoggedIn, toast]);

  const { isProductOwnedByCurrentSeller } = useAuth();

  const moveToCartFromWishlist = useCallback(async (product) => {
    if (!requireAuth('add items to your shopping cart')) return;

    if (isProductOwnedByCurrentSeller && isProductOwnedByCurrentSeller(product)) {
      toast.error(
        "Seller Action Restricted",
        "You cannot purchase items from your own seller catalog. You can purchase items from other sellers."
      );
      return;
    }

    // 1. Remove from wishlist
    setWishlist((prev) => prev.filter((item) => item.id !== product.id));

    // 2. Add to cart via API
    let variantId = null;
    if (typeof product === 'object' && product !== null) {
      variantId = product.variantId || product.product_variant || product.variants?.[0]?.id || product.id;
    } else {
      variantId = product;
    }

    try {
      await apiRequest('/api/orders/cart/', {
        method: 'POST',
        body: JSON.stringify({ product_variant: Number(variantId), quantity: 1 })
      });
      await fetchCart();
      toast.cart("Moved to Bag", `${product.name || 'Item'} is now in your shopping bag.`, product.image);
    } catch (err) {
      const errorMsg = err?.data?.detail || err?.message || 'Failed to move item to cart.';
      toast.error("Cart Error", errorMsg);
    }
  }, [requireAuth, isProductOwnedByCurrentSeller, toast, fetchCart]);

  // --- REAL BACKEND CART ACTIONS ---
  const addToCart = useCallback(async (product, qty = 1) => {
    if (!requireAuth('add items to your shopping cart')) return;

    if (isProductOwnedByCurrentSeller && isProductOwnedByCurrentSeller(product)) {
      toast.error(
        "Seller Action Restricted",
        "You cannot purchase items from your own seller catalog. You can purchase items from other sellers."
      );
      return;
    }

    let variantId = null;
    if (typeof product === 'object' && product !== null) {
      variantId = product.variantId;
    } else {
      variantId = product;
    }

    if (!variantId || Number.isNaN(Number(variantId))) {
      toast.error("Unavailable", "This product is not available for purchase yet.");
      return;
    }

    try {
      await apiRequest('/api/orders/cart/', {
        method: 'POST',
        body: JSON.stringify({ product_variant: Number(variantId), quantity: qty })
      });
      await fetchCart();
      toast.cart("Added to Bag", `${product?.name || 'Item'} (Qty: ${qty}) added.`, product?.image);
    } catch (err) {
      const errorMsg = err?.data?.detail || err?.message || 'Failed to add item to cart.';
      toast.error("Cart Error", errorMsg);
    }
  }, [requireAuth, isProductOwnedByCurrentSeller, toast, fetchCart]);

  const updateCartQuantity = useCallback(async (cartItemId, deltaOrNewQty) => {
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
      const errorMsg = err?.data?.detail || err?.message || 'Failed to update item quantity.';
      toast.error("Cart Error", errorMsg);
    }
  }, [cart, fetchCart, toast]);

  const removeFromCart = useCallback(async (cartItemId) => {
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
  }, [cart, fetchCart, toast]);

  const saveForLaterItem = useCallback((product) => {
    removeFromCart(product.id);
    setSavedForLater((prev) => [product, ...prev]);
    toast.info("Saved for Later", `${product.name} moved to saved items.`);
  }, [removeFromCart, toast]);

  const moveToCartFromSaved = useCallback(async (product) => {
    if (!requireAuth('add items to your shopping cart')) return;

    setSavedForLater((prev) => prev.filter((item) => item.id !== product.id));
    await addToCart(product, product.quantity || 1);
  }, [requireAuth, addToCart]);

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

    // 3. Taxable Base
    const taxableBase = cartSubtotal;

    // 4. GST Tax (5% Standard Marketplace Rate Estimate prior to checkout)
    const taxRate = 0.05;
    const taxAmount = Number((taxableBase * taxRate).toFixed(2));

    // 5. Payable Total Amount
    const amountPayable = Number((cartSubtotal + shippingFee + taxAmount).toFixed(2));

    return {
      cartSubtotal,
      couponDiscount: 0.00,
      giftWrapFee: 0.00,
      shippingFee,
      taxableBase,
      taxRatePercent: '5%',
      taxAmount,
      preDeductionTotal: amountPayable,
      walletDeduction: 0.00,
      rewardPointsDeduction: 0.00,
      amountPayable,
      totalSavings: 0.00
    };
  }, [cart]);

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
        body: JSON.stringify({ delivery_address })
      });

      setLastPlacedOrder(createdOrder);
      setCart([]);
      toast.success("Order Placed Successfully!", `Order ${createdOrder.order_number || createdOrder.id} confirmed.`);
      return createdOrder;
    } catch (err) {
      const errorMsg = err?.data?.detail || err?.message || 'Failed to place order. Please verify details and try again.';
      toast.error("Checkout Error", errorMsg);
      throw err;
    }
  }, [toast]);

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

