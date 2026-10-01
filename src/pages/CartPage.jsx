import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartWishlistContext';
import CartItemRow from '../components/cart/CartItemRow';
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
    removeSavedForLater
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
            
            {/* LEFT COLUMN: Cart Items (8 Cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              
              {/* Value Header Banner */}
              <div className="bg-[#FFF3EC] border border-[#FA661C]/20 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs text-[#FA661C]">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#FF811A] shrink-0" />
                  <span className="font-semibold">
                    Free Standard Delivery on all marketplace orders.
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
                              ₹{typeof sv.price === 'number' ? sv.price.toLocaleString('en-IN') : sv.price}
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

            {/* RIGHT COLUMN: Sticky Order Summary (4-5 Cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
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

