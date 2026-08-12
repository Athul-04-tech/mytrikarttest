import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Gift, 
  Truck, 
  Calendar, 
  MessageSquare, 
  Bookmark, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useCart } from '../context/CartWishlistContext';
import CartItemRow from '../components/cart/CartItemRow';
import CouponApplyBox from '../components/cart/CouponApplyBox';
import OrderSummarySidebar from '../components/cart/OrderSummarySidebar';

export default function CartPage() {
  const {
    cart,
    savedForLater,
    cartCount,
    updateCartQuantity,
    removeFromCart,
    saveForLaterItem,
    moveToCartFromSaved,
    removeSavedForLater,
    isGiftWrap,
    setIsGiftWrap,
    shippingMethod,
    setShippingMethod,
    deliveryDate,
    setDeliveryDate,
    orderNotes,
    setOrderNotes
  } = useCart();

  const navigate = useNavigate();

  // Dynamic SEO Metadata
  useEffect(() => {
    document.title = `Shopping Bag (${cartCount} Items) — MytriKart`;
  }, [cartCount]);

  return (
    <div className="min-h-screen bg-[#FBF8F1] flex flex-col text-[#1A2420] font-sans selection:bg-[#D4AF37]/30 selection:text-[#0F3D2E]">
      
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 bg-[#FBF8F1]/95 backdrop-blur-md border-b border-[#D8E0DC] shadow-xs px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-white hover:bg-[#E8F2EE] border border-[#D8E0DC] text-[#0F3D2E] icon-interactive cursor-pointer"
              aria-label="Back to Marketplace"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[#0F3D2E]">
                  Shopping Bag
                </span>
                <span className="text-xs font-bold bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/50 px-2.5 py-0.5 rounded-full">
                  {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Link
              to="/wishlist"
              className="text-[#5C6B63] hover:text-[#0F3D2E] font-bold link-interactive cursor-pointer"
            >
              View Saved Wishlist →
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        
        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* LEFT COLUMN: Cart Items & Delivery Options (8 Cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              
              {/* Value Header Banner */}
              <div className="bg-[#E8F2EE] border border-[#0F3D2E]/20 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs text-[#0F3D2E]">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="font-semibold">
                    Gold Plus Privilege: Free Standard Delivery on all orders above ₹499.
                  </span>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B63] block">
                  Items in your Bag ({cart.length})
                </span>

                {cart.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQty={updateCartQuantity}
                    onRemove={removeFromCart}
                    onSaveForLater={saveForLaterItem}
                  />
                ))}
              </div>

              {/* Delivery Date Selection */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#D8E0DC] space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-[#0F3D2E] font-bold">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>Choose Delivery Schedule</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'tomorrow', label: 'Tomorrow by 2 PM', sub: 'Fastest Delivery', isHot: true },
                    { id: '2days', label: 'In 2 Days (Standard)', sub: 'Regular Dispatch', isHot: false },
                    { id: 'custom', label: 'Weekend Delivery', sub: 'Saturday 10 AM - 6 PM', isHot: false }
                  ].map((del) => (
                    <button
                      key={del.id}
                      type="button"
                      onClick={() => setDeliveryDate(del.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer btn-interactive ${
                        deliveryDate === del.id
                          ? 'bg-[#FCF7E8] border-[#D4AF37] shadow-2xs'
                          : 'bg-[#FBF8F1] border-[#D8E0DC] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F3D2E]">{del.label}</span>
                        {del.isHot && (
                          <span className="text-[9px] font-black bg-[#0F3D2E] text-[#D4AF37] px-1.5 py-0.2 rounded">
                            HOT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#5C6B63] block mt-0.5">{del.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shipping Method Selection */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#D8E0DC] space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-[#0F3D2E] font-bold">
                  <Truck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Select Shipping Method</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'standard', title: 'Standard Delivery', price: 'FREE', desc: '3-5 business days' },
                    { id: 'express', title: 'Express Air Cargo', price: '+ ₹99', desc: 'Guaranteed 24-48 hrs' },
                    { id: 'priority', title: 'Priority Same-Day', price: '+ ₹199', desc: 'Dispatched in 4 hrs' }
                  ].map((shp) => (
                    <button
                      key={shp.id}
                      type="button"
                      onClick={() => setShippingMethod(shp.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer btn-interactive ${
                        shippingMethod === shp.id
                          ? 'bg-[#FCF7E8] border-[#D4AF37] shadow-2xs'
                          : 'bg-[#FBF8F1] border-[#D8E0DC] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[#0F3D2E]">
                        <span>{shp.title}</span>
                        <span className="font-black text-[11px]">{shp.price}</span>
                      </div>
                      <span className="text-[10px] text-[#5C6B63] block mt-0.5">{shp.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gift Wrap Toggle */}
              <div className="p-4 bg-white rounded-2xl border border-[#D8E0DC] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#FCF7E8] text-[#D4AF37]">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#0F3D2E] block">
                      Add Artisan Gold Gift Wrapping (+₹49)
                    </span>
                    <p className="text-[10px] text-[#5C6B63]">
                      Personalized greeting card & emerald ribbon wrap included.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGiftWrap}
                    onChange={(e) => setIsGiftWrap(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D8E0DC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D8E0DC] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F3D2E]" />
                </label>
              </div>

              {/* Order Notes Textarea */}
              <div className="p-4 bg-white rounded-2xl border border-[#D8E0DC] space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-[#0F3D2E] font-bold">
                  <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                  <span>Order Notes for Seller (Optional)</span>
                </div>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Leave package with front security gate, or ring bell twice."
                  className="w-full p-2.5 bg-[#FBF8F1] border border-[#D8E0DC] rounded-xl text-xs text-[#0F3D2E] focus:ring-1 focus:ring-[#D4AF37] outline-none"
                />
              </div>

              {/* Saved for Later Section */}
              {savedForLater.length > 0 && (
                <div className="pt-4 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B63] block">
                    Saved for Later ({savedForLater.length})
                  </span>

                  <div className="space-y-2.5">
                    {savedForLater.map((sv) => (
                      <div
                        key={sv.id}
                        className="p-3.5 bg-white rounded-2xl border border-[#D8E0DC] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <img
                            src={sv.image}
                            alt={sv.name}
                            className="w-14 h-14 rounded-lg object-cover border border-[#D8E0DC] shrink-0"
                          />
                          <div className="truncate">
                            <h4 className="font-bold text-[#0F3D2E] truncate max-w-[240px]">
                              {sv.name}
                            </h4>
                            <span className="font-black text-xs text-[#0F3D2E] mt-0.5 block">
                              ₹{sv.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveToCartFromSaved(sv)}
                            className="px-3 py-1.5 bg-[#0F3D2E] text-[#FBF8F1] text-[11px] font-bold rounded-xl btn-interactive cursor-pointer"
                          >
                            Move to Bag
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedForLater(sv.id)}
                            className="p-1.5 text-[#5C6B63] hover:text-[#C0392B] icon-interactive cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Coupon + Sticky Order Summary (4-5 Cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <CouponApplyBox />
              <OrderSummarySidebar onProceedToCheckout={() => navigate('/checkout')} />
            </div>

          </div>
        ) : (
          /* Empty Cart State */
          <div className="py-16 text-center max-w-md mx-auto space-y-4 animate-reveal">
            <div className="w-20 h-20 rounded-full bg-[#FCF7E8] border border-[#D4AF37]/40 text-[#0F3D2E] flex items-center justify-center mx-auto shadow-sm">
              <ShoppingBag className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="font-['Outfit'] text-2xl font-extrabold text-[#0F3D2E]">
                Your Shopping Bag is Empty
              </h2>
              <p className="text-xs text-[#5C6B63] mt-1.5 leading-relaxed">
                Discover trending flagship electronics, pure Banarasi silk sarees, and handcrafted home furnishings.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="px-6 py-2.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] font-bold text-xs rounded-xl btn-interactive shadow-md cursor-pointer inline-block"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
