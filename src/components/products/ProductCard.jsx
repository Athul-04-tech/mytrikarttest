import React from 'react';
import { Star, Heart, ShoppingBag, Eye } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartWishlistContext';

export default function ProductCard({ product }) {
  const { wishlist, addToWishlist, removeFromWishlist, addToCart } = useCart();
  const toast = useToast();

  const isWishlisted = wishlist.some(item => item.id === product.id);

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

  const handlePreviewDetails = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toast.info("Quick Product Preview", `Viewing details for ${product.name}`);
  };

  return (
    <div 
      itemScope 
      itemType="https://schema.org/Product" 
      className="group bg-white rounded-2xl border border-[#D8E0DC] hover:border-[#D4AF37]/60 shadow-xs card-interactive flex flex-col overflow-hidden relative h-full cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/3.2] w-full bg-[#FBF8F1] overflow-hidden">
        <img 
          itemProp="image"
          src={product.image} 
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
          {/* Urgency Badge (BRICK RED) or Offer Badge */}
          {product.isUrgent ? (
            <span className="pointer-events-auto bg-[#C0392B] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs tracking-tight animate-pulse">
              {product.urgencyBadge}
            </span>
          ) : product.offerText ? (
            <span className="pointer-events-auto bg-[#0F3D2E] text-[#D4AF37] text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
              {product.offerText}
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
                ? 'bg-[#C0392B] text-white shadow-md' 
                : 'bg-white/90 hover:bg-white text-[#5C6B63] hover:text-[#C0392B]'
            }`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3 h-3 transition-transform duration-150 ${isWishlisted ? 'fill-current scale-110' : ''}`} />
          </button>
        </div>

        {/* Sponsored / AD tag indicator */}
        {product.sponsored && (
          <span className="absolute bottom-1.5 left-1.5 text-[8px] font-bold text-[#5C6B63] bg-white/90 backdrop-blur-xs px-1 py-0.2 rounded border border-[#D8E0DC]">
            Sponsored
          </span>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-3 flex flex-col flex-1 justify-between">
        <div>
          {/* Category & Ratings Row */}
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#5C6B63] truncate max-w-[90px]">
              {product.category}
            </span>
            <div className="flex items-center space-x-1 bg-[#FCF7E8] px-1.5 py-0.2 rounded border border-[#D4AF37]/30">
              <Star className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37]" />
              <span className="text-[10px] font-extrabold text-[#0F3D2E]">
                {product.rating}
              </span>
              <span className="text-[8px] text-[#5C6B63]">
                ({product.reviews})
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-xs text-[#0F3D2E] line-clamp-2 mb-1.5 group-hover:text-[#155440] transition-colors leading-snug">
            {product.name}
          </h3>
        </div>

        <div>
          {/* Price Row */}
          <div className="flex items-baseline space-x-1.5 mt-1 pt-1.5 border-t border-[#D8E0DC]/50">
            <span className={`text-xs sm:text-sm font-black ${
              product.isUrgent ? 'text-[#C0392B]' : 'text-[#0F3D2E]'
            }`}>
              {product.price}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] text-[#5C6B63] line-through">
                {product.originalPrice}
              </span>
            )}
            {product.discount && (
              <span className="text-[9px] font-bold text-[#0F3D2E] bg-[#E8F2EE] px-1 py-0.2 rounded">
                {product.discount}
              </span>
            )}
          </div>

          {/* Quick Action Buttons Row */}
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <button 
              type="button"
              onClick={handlePreviewDetails}
              className="py-1 px-1.5 bg-[#FBF8F1] hover:bg-[#E8F2EE] text-[#0F3D2E] border border-[#D8E0DC] hover:border-[#0F3D2E] rounded-lg text-[11px] font-bold btn-interactive flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Eye className="w-3 h-3 text-[#D4AF37]" />
              <span className="truncate">Details</span>
            </button>

            <button 
              type="button"
              onClick={handleAddToCart}
              className="py-1 px-1.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] border border-[#0F3D2E] rounded-lg text-[11px] font-bold btn-interactive flex items-center justify-center space-x-1 shadow-xs group/cart cursor-pointer"
            >
              <ShoppingBag className="w-3 h-3 text-[#D4AF37] group-hover/cart:scale-110 transition-transform" />
              <span className="truncate">Add</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
