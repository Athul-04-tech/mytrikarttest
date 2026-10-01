import React from 'react';
import { Star, Heart, ShoppingBag, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartWishlistContext';
import { resolveMediaUrl } from '../../config/env';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { wishlist, addToWishlist, removeFromWishlist, addToCart } = useCart();
  const toast = useToast();

  const isWishlisted = wishlist.some(item => item.id === product.id || item.productId === product.id);

  const toggleWishlist = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart(product, 1);
  };

  const handleNavigateToDetail = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (product && product.id) {
      navigate(`/product/${product.id}`);
    }
  };

  const hasReviews = Number(product.reviews || 0) > 0 && product.rating != null;

  return (
    <div 
      onClick={handleNavigateToDetail}
      itemScope 
      itemType="https://schema.org/Product" 
      className="group bg-white rounded-2xl border border-[#EAE3DC] hover:border-[#FF811A]/60 shadow-xs card-interactive flex flex-col overflow-hidden relative h-full cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/3.2] w-full bg-[#FFFFFF] overflow-hidden">
        <img 
          itemProp="image"
          src={resolveMediaUrl(product.image)} 
          alt={product.name} 
          width="400"
          height="320"
          decoding="async"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/products/spatial_headphones_1786529304124.png";
          }}
          className="w-full h-full object-cover object-center card-img-zoom"
        />

        {/* Top Badges overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10 pointer-events-none">
          {/* Real Stock Urgency Badge (BRICK RED) */}
          {product.isUrgent && product.urgencyBadge ? (
            <span className="pointer-events-auto bg-[#D7263D] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs tracking-tight animate-pulse">
              {product.urgencyBadge}
            </span>
          ) : (
            <span />
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={toggleWishlist}
            className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-md shadow-xs icon-interactive cursor-pointer ${
              isWishlisted 
                ? 'bg-[#D7263D] text-white shadow-md' 
                : 'bg-white/90 hover:bg-white text-[#6B6058] hover:text-[#D7263D]'
            }`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3 h-3 transition-transform duration-150 ${isWishlisted ? 'fill-current scale-110' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-3 flex flex-col flex-1 justify-between">
        <div>
          {/* Category & Ratings Row */}
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B6058] truncate max-w-[90px]">
              {product.category}
            </span>
            {hasReviews ? (
              <div className="flex items-center space-x-1 bg-[#FFF8F2] px-1.5 py-0.2 rounded border border-[#FF811A]/30">
                <Star className="w-2.5 h-2.5 text-[#FF811A] fill-[#FF811A]" />
                <span className="text-[10px] font-extrabold text-[#FA661C]">
                  {Number(product.rating).toFixed(1)}
                </span>
                <span className="text-[8px] text-[#6B6058]">
                  ({product.reviews})
                </span>
              </div>
            ) : (
              <span className="text-[9px] font-medium text-[#6B6058] bg-[#F7F4F0] px-1.5 py-0.2 rounded border border-[#EAE3DC]">
                No reviews yet
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-xs text-[#FA661C] line-clamp-2 mb-1.5 group-hover:text-[#E0530B] transition-colors leading-snug">
            {product.name}
          </h3>
        </div>

        <div>
          {/* Price Row */}
          <div className="flex items-baseline space-x-1.5 mt-1 pt-1.5 border-t border-[#EAE3DC]/50">
            <span className={`text-xs sm:text-sm font-black ${
              product.isUrgent ? 'text-[#D7263D]' : 'text-[#FA661C]'
            }`}>
              {product.price}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] text-[#6B6058] line-through">
                {product.originalPrice}
              </span>
            )}
            {product.discount && (
              <span className="text-[9px] font-bold text-[#FA661C] bg-[#FFF3EC] px-1 py-0.2 rounded">
                {product.discount}
              </span>
            )}
          </div>

          {/* Quick Action Buttons Row */}
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <button
              type="button"
              onClick={handleNavigateToDetail}
              className="py-1 px-1.5 bg-[#FFFFFF] hover:bg-[#FFF3EC] text-[#000000] border border-[#EAE3DC] hover:border-[#FA661C] rounded-lg text-[11px] font-bold btn-interactive flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Eye className="w-3 h-3 text-[#000000]" />
              <span className="truncate text-[#000000]">Details</span>
            </button>

            <button 
              type="button"
              onClick={handleAddToCart}
              className="py-1 px-1.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#000000] border border-[#FA661C] rounded-lg text-[11px] font-black btn-interactive flex items-center justify-center space-x-1 shadow-xs group/cart cursor-pointer"
            >
              <ShoppingBag className="w-3 h-3 text-[#000000] group-hover/cart:scale-110 transition-transform" />
              <span className="truncate text-[#000000]">Add</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

