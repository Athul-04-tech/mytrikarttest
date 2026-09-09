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
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#1A2420] font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#EAE3DC] shadow-xs px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-white hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] icon-interactive cursor-pointer"
              aria-label="Back to Marketplace"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[#FA661C]">
                  Shopping Bag
                </span>
                <span className="text-xs font-bold bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/50 px-2.5 py-0.5 rounded-full">
                  {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Link
              to="/wishlist"
              className="text-[#6B6058] hover:text-[#FA661C] font-bold link-interactive cursor-pointer"
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
              <div className="bg-[#FFF3EC] border border-[#FA661C]/20 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs text-[#FA661C]">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#FF811A] shrink-0" />
                  <span className="font-semibold">
                    Gold Plus Privilege: Free Standard Delivery on all orders above ₹499.
                  </span>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6058] block">
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
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#EAE3DC] space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-[#FA661C] font-bold">
                  <Calendar className="w-4 h-4 text-[#FF811A]" />
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
                          ? 'bg-[#FFF8F2] border-[#FF811A] shadow-2xs'
                          : 'bg-[#FFFFFF] border-[#EAE3DC] hover:border-[#FF811A]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#FA661C]">{del.label}</span>
                        {del.isHot && (
                          <span className="text-[9px] font-black bg-[#FA661C] text-[#FF811A] px-1.5 py-0.2 rounded">
                            HOT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#6B6058] block mt-0.5">{del.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shipping Method Selection */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#EAE3DC] space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-[#FA661C] font-bold">
                  <Truck className="w-4 h-4 text-[#FF811A]" />
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
                          ? 'bg-[#FFF8F2] border-[#FF811A] shadow-2xs'
                          : 'bg-[#FFFFFF] border-[#EAE3DC] hover:border-[#FF811A]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[#FA661C]">
                        <span>{shp.title}</span>
                        <span className="font-black text-[11px]">{shp.price}</span>
                      </div>
                      <span className="text-[10px] text-[#6B6058] block mt-0.5">{shp.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gift Wrap Toggle */}
              <div className="p-4 bg-white rounded-2xl border border-[#EAE3DC] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#FFF8F2] text-[#FF811A]">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#FA661C] block">
                      Add Artisan Gold Gift Wrapping (+₹49)
                    </span>
                    <p className="text-[10px] text-[#6B6058]">
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
                  <div className="w-11 h-6 bg-[#EAE3DC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#EAE3DC] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA661C]" />
                </label>
              </div>

              {/* Order Notes Textarea */}
              <div className="p-4 bg-white rounded-2xl border border-[#EAE3DC] space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-[#FA661C] font-bold">
                  <MessageSquare className="w-4 h-4 text-[#FF811A]" />
                  <span>Order Notes for Seller (Optional)</span>
                </div>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Leave package with front security gate, or ring bell twice."
                  className="w-full p-2.5 bg-[#FFFFFF] border border-[#EAE3DC] rounded-xl text-xs text-[#FA661C] focus:ring-1 focus:ring-[#FF811A] outline-none"
                />
              </div>

              {/* Saved for Later Section */}
              {savedForLater.length > 0 && (
                <div className="pt-4 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6058] block">
                    Saved for Later ({savedForLater.length})
                  </span>

                  <div className="space-y-2.5">
                    {savedForLater.map((sv) => (
                      <div
                        key={sv.id}
                        className="p-3.5 bg-white rounded-2xl border border-[#EAE3DC] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <img
                            src={sv.image}
                            alt={sv.name}
                            className="w-14 h-14 rounded-lg object-cover border border-[#EAE3DC] shrink-0"
                          />
                          <div className="truncate">
                            <h4 className="font-bold text-[#FA661C] truncate max-w-[240px]">
                              {sv.name}
                            </h4>
                            <span className="font-black text-xs text-[#FA661C] mt-0.5 block">
                              ₹{sv.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveToCartFromSaved(sv)}
                            className="px-3 py-1.5 bg-[#FA661C] text-[#FFFFFF] text-[11px] font-bold rounded-xl btn-interactive cursor-pointer"
                          >
                            Move to Bag
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedForLater(sv.id)}
                            className="p-1.5 text-[#6B6058] hover:text-[#D7263D] icon-interactive cursor-pointer"
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
            <div className="w-20 h-20 rounded-full bg-[#FFF8F2] border border-[#FF811A]/40 text-[#FA661C] flex items-center justify-center mx-auto shadow-sm">
              <ShoppingBag className="w-10 h-10 text-[#FF811A]" />
            </div>
            <div>
              <h2 className="font-['Outfit'] text-2xl font-extrabold text-[#FA661C]">
                Your Shopping Bag is Empty
              </h2>
              <p className="text-xs text-[#6B6058] mt-1.5 leading-relaxed">
                Discover trending flagship electronics, pure Banarasi silk sarees, and handcrafted home furnishings.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="px-6 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] font-bold text-xs rounded-xl btn-interactive shadow-md cursor-pointer inline-block"
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
