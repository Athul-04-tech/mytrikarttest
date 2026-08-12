import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  Star, 
  ArrowLeft, 
  Sparkles, 
  Store 
} from 'lucide-react';
import { useCart } from '../context/CartWishlistContext';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, moveToCartFromWishlist, cartCount } = useCart();
  const [animatingOutId, setAnimatingOutId] = useState(null);
  const navigate = useNavigate();

  // Dynamic SEO Metadata
  useEffect(() => {
    document.title = `My Wishlist (${wishlist.length} Items) — MytriKart`;
  }, [wishlist.length]);

  const handleRemove = (id) => {
    setAnimatingOutId(id);
    setTimeout(() => {
      removeFromWishlist(id);
      setAnimatingOutId(null);
    }, 250);
  };

  const handleMoveToCart = (item) => {
    setAnimatingOutId(item.id);
    setTimeout(() => {
      moveToCartFromWishlist(item);
      setAnimatingOutId(null);
    }, 250);
  };

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
                  My Wishlist
                </span>
                <span className="text-xs font-bold bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/50 px-2.5 py-0.5 rounded-full">
                  {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Bag Button */}
          <Link
            to="/cart"
            className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-2 shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#D4AF37] icon-interactive" />
            <span>Bag ({cartCount})</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        
        {wishlist.length > 0 ? (
          <div className="space-y-6">
            
            {/* Value Proposition Ribbon */}
            <div className="bg-[#FCF7E8] border border-[#D4AF37]/40 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs text-[#0F3D2E]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="font-semibold">
                  Items in your wishlist have price-drop protection and stock reservation for 48 hours.
                </span>
              </div>
            </div>

            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {wishlist.map((item) => {
                const isFading = animatingOutId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border border-[#D8E0DC] hover:border-[#D4AF37]/60 shadow-xs card-interactive flex flex-col justify-between overflow-hidden relative group transition-all duration-250 ${
                      isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-reveal'
                    }`}
                  >
                    <div>
                      {/* Product Image & Badges */}
                      <div className="relative aspect-[4/3.2] w-full bg-[#FBF8F1] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center card-img-zoom"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                          {item.discount ? (
                            <span className="bg-[#0F3D2E] text-[#D4AF37] text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                              {item.discount}
                            </span>
                          ) : <span />}

                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="p-1.5 rounded-full bg-white/90 hover:bg-[#FDEDEC] text-[#5C6B63] hover:text-[#C0392B] backdrop-blur-xs shadow-xs icon-interactive cursor-pointer"
                            aria-label="Remove item from wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-3.5">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#5C6B63] truncate max-w-[120px]">
                            {item.category || 'Curated'}
                          </span>
                          <div className="flex items-center space-x-1 bg-[#FCF7E8] px-1.5 py-0.2 rounded border border-[#D4AF37]/30 text-[10px] font-bold text-[#0F3D2E]">
                            <Star className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37]" />
                            <span>{item.rating || '4.8'}</span>
                          </div>
                        </div>

                        <h3 className="font-bold text-xs text-[#0F3D2E] line-clamp-2 leading-snug group-hover:text-[#155440] transition-colors">
                          {item.name}
                        </h3>

                        <div className="flex items-center space-x-1 text-[10px] text-[#5C6B63] mt-1">
                          <Store className="w-3 h-3 text-[#D4AF37]" />
                          <span className="truncate">{item.vendorName || 'Verified Merchant'}</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline space-x-2 mt-2 pt-2 border-t border-[#D8E0DC]/50">
                          <span className="text-sm sm:text-base font-black text-[#0F3D2E]">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          {item.originalPrice && (
                            <span className="text-xs text-[#5C6B63] line-through">
                              ₹{item.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Primary Move to Cart CTA */}
                    <div className="p-3.5 pt-0">
                      <button
                        type="button"
                        onClick={() => handleMoveToCart(item)}
                        className="w-full py-2 px-3 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37] icon-interactive" />
                        <span>Move to Shopping Bag</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          /* Empty Wishlist State */
          <div className="py-16 text-center max-w-md mx-auto space-y-4 animate-reveal">
            <div className="w-20 h-20 rounded-full bg-[#FCF7E8] border border-[#D4AF37]/40 text-[#0F3D2E] flex items-center justify-center mx-auto shadow-sm">
              <Heart className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="font-['Outfit'] text-2xl font-extrabold text-[#0F3D2E]">
                Your Wishlist is Empty
              </h2>
              <p className="text-xs text-[#5C6B63] mt-1.5 leading-relaxed">
                Explore our curated collections and save your favorite electronics, handcrafted fashion, and artisanal decor for later.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="px-6 py-2.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] font-bold text-xs rounded-xl btn-interactive shadow-md cursor-pointer inline-block"
              >
                Browse Marketplace Products
              </Link>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
