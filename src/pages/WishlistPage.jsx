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
import { resolveMediaUrl } from '../config/env';

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
                  My Wishlist
                </span>
                <span className="text-xs font-bold bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/50 px-2.5 py-0.5 rounded-full">
                  {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Bag Button */}
          <Link
            to="/cart"
            className="px-3.5 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-2 shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#FF811A] icon-interactive" />
            <span>Bag ({cartCount})</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        
        {wishlist.length > 0 ? (
          <div className="space-y-6">
            
            {/* Value Proposition Ribbon */}
            <div className="bg-[#FFF8F2] border border-[#FF811A]/40 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs text-[#FA661C]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#FF811A] shrink-0" />
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
                    className={`bg-white rounded-2xl border border-[#EAE3DC] hover:border-[#FF811A]/60 shadow-xs card-interactive flex flex-col justify-between overflow-hidden relative group transition-all duration-250 ${
                      isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-reveal'
                    }`}
                  >
                    <div>
                      {/* Product Image & Badges */}
                      <div className="relative aspect-[4/3.2] w-full bg-[#FFFFFF] overflow-hidden">
                        <img
                          src={resolveMediaUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover object-center card-img-zoom"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                          {item.discount ? (
                            <span className="bg-[#FA661C] text-[#FF811A] text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                              {item.discount}
                            </span>
                          ) : <span />}

                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="p-1.5 rounded-full bg-white/90 hover:bg-[#FDE8EA] text-[#6B6058] hover:text-[#D7263D] backdrop-blur-xs shadow-xs icon-interactive cursor-pointer"
                            aria-label="Remove item from wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-3.5">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B6058] truncate max-w-[120px]">
                            {item.category || 'Curated'}
                          </span>
                          <div className="flex items-center space-x-1 bg-[#FFF8F2] px-1.5 py-0.2 rounded border border-[#FF811A]/30 text-[10px] font-bold text-[#FA661C]">
                            <Star className="w-2.5 h-2.5 text-[#FF811A] fill-[#FF811A]" />
                            <span>{item.rating || '4.8'}</span>
                          </div>
                        </div>

                        <h3 className="font-bold text-xs text-[#FA661C] line-clamp-2 leading-snug group-hover:text-[#E0530B] transition-colors">
                          {item.name}
                        </h3>

                        <div className="flex items-center space-x-1 text-[10px] text-[#6B6058] mt-1">
                          <Store className="w-3 h-3 text-[#FF811A]" />
                          <span className="truncate">{item.vendorName || 'Verified Merchant'}</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline space-x-2 mt-2 pt-2 border-t border-[#EAE3DC]/50">
                          <span className="text-sm sm:text-base font-black text-[#FA661C]">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          {item.originalPrice && (
                            <span className="text-xs text-[#6B6058] line-through">
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
                        className="w-full py-2 px-3 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#FF811A] icon-interactive" />
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
            <div className="w-20 h-20 rounded-full bg-[#FFF8F2] border border-[#FF811A]/40 text-[#FA661C] flex items-center justify-center mx-auto shadow-sm">
              <Heart className="w-10 h-10 text-[#FF811A]" />
            </div>
            <div>
              <h2 className="font-['Outfit'] text-2xl font-extrabold text-[#FA661C]">
                Your Wishlist is Empty
              </h2>
              <p className="text-xs text-[#6B6058] mt-1.5 leading-relaxed">
                Explore our curated collections and save your favorite electronics, handcrafted fashion, and artisanal decor for later.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="px-6 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] font-bold text-xs rounded-xl btn-interactive shadow-md cursor-pointer inline-block"
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
