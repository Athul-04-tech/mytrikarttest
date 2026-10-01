import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import DeliveryModal from '../components/modals/DeliveryModal';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartWishlistContext';
import { resolveMediaUrl } from '../config/env';
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  ChevronRight, 
  RotateCcw, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Minus,
  Plus,
  Tag,
  Layers,
  Store
} from 'lucide-react';

export default function ProductDetailPage({ isLoggedIn, currentUser, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { wishlist, addToWishlist, removeFromWishlist, addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Fetch Published Product Detail on Mount or when ID changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    apiRequest(`/api/products/published/${id}/`)
      .then((data) => {
        if (!isMounted) return;
        setProduct(data);
        const initialVar = data.variants?.[0] || null;
        setSelectedVariant(initialVar);

        const primaryImg = data.images?.find((img) => img.is_primary)?.image 
          || data.images?.[0]?.image 
          || '/products/spatial_headphones_1786529304124.png';
        setSelectedImage(primaryImg);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || (err.status === 404 ? 'Product not found' : 'Failed to load product details.'));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Pricing calculations for current selected variant
  const currentPricing = useMemo(() => {
    if (!selectedVariant) {
      return { priceNum: 0, priceStr: '₹0', originalPriceStr: null, discountStr: null };
    }
    const priceNum = parseFloat(selectedVariant.price || 0);
    const mrpNum = selectedVariant.mrp ? parseFloat(selectedVariant.mrp) : null;
    let discountNum = null;

    if (selectedVariant.discount_percentage != null) {
      discountNum = parseFloat(selectedVariant.discount_percentage);
    } else if (mrpNum && mrpNum > priceNum) {
      discountNum = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
    }

    let discountStr = null;
    let originalPriceStr = null;
    if (mrpNum && mrpNum > priceNum) {
      originalPriceStr = `₹${mrpNum.toLocaleString('en-IN')}`;
      if (discountNum && discountNum >= 1) {
        discountStr = `${Math.round(discountNum)}% Off`;
      }
    }

    return {
      priceNum,
      priceStr: `₹${priceNum.toLocaleString('en-IN')}`,
      originalPriceStr,
      discountStr
    };
  }, [selectedVariant]);

  // Stock availability metrics
  const stockQuantity = selectedVariant ? (selectedVariant.stock_quantity ?? 0) : 0;
  const isOutOfStock = stockQuantity <= 0;
  const isUrgent = stockQuantity > 0 && stockQuantity <= 5;

  // Wishlist state calculation
  const isWishlisted = useMemo(() => {
    if (!product) return false;
    return wishlist.some((w) => w.id === product.id || w.productId === product.id);
  }, [wishlist, product]);

  const toggleWishlist = () => {
    if (!product) return;
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: currentPricing.priceStr,
        rawPrice: currentPricing.priceNum,
        image: selectedImage,
        category: product.category_name || 'General'
      });
    }
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    const cartPayload = {
      id: product.id,
      name: product.name,
      price: currentPricing.priceStr,
      rawPrice: currentPricing.priceNum,
      originalPrice: currentPricing.originalPriceStr,
      discount: currentPricing.discountStr,
      image: selectedImage,
      category: product.category_name || 'General',
      variantId: selectedVariant?.id,
      skuCode: selectedVariant?.sku_code
    };

    addToCart(cartPayload, quantity);
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (stockQuantity > 0 && next > stockQuantity) return stockQuantity;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A2420] flex flex-col font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* Header */}
      <Header 
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        deliveryLocation={deliveryLocation}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full space-y-6">
        
        {/* LOADING SKELETON STATE */}
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-4 w-48 bg-[#FFF3EC] rounded" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-5 space-y-4">
                <div className="aspect-square w-full bg-[#FFF3EC] rounded-2xl" />
                <div className="flex gap-2">
                  <div className="w-16 h-16 bg-[#FFF3EC] rounded-xl" />
                  <div className="w-16 h-16 bg-[#FFF3EC] rounded-xl" />
                </div>
              </div>
              <div className="md:col-span-7 space-y-4">
                <div className="h-4 w-24 bg-[#FFF3EC] rounded" />
                <div className="h-8 w-3/4 bg-[#FFF3EC] rounded" />
                <div className="h-6 w-32 bg-[#FFF3EC] rounded" />
                <div className="h-24 w-full bg-[#FFF3EC] rounded-xl" />
                <div className="h-12 w-full bg-[#FFF3EC] rounded-xl" />
              </div>
            </div>
          </div>
        ) : error || !product ? (
          /* HONEST 404 / ERROR STATE */
          <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE3DC] space-y-4 shadow-xs max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-[#FFF3EC] flex items-center justify-center mx-auto text-[#FA661C]">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-['Outfit'] font-extrabold text-xl text-[#FA661C]">
                Product Not Found
              </h2>
              <p className="text-xs text-[#6B6058] mt-1.5 max-w-md mx-auto">
                {error || 'The product you are looking for does not exist or is no longer listed in our active marketplace.'}
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white font-extrabold text-xs rounded-xl shadow-xs btn-interactive cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Browse All Marketplace Products</span>
            </Link>
          </div>
        ) : (
          /* PRODUCT DETAIL CONTENT */
          <div className="space-y-6 animate-reveal">
            
            {/* Breadcrumb Trail */}
            <nav aria-label="Breadcrumb" className="text-xs text-[#6B6058] flex items-center space-x-1.5 overflow-x-auto pb-1">
              <Link to="/" className="hover:text-[#FA661C] transition-colors font-medium">Home</Link>
              <ChevronRight className="w-3 h-3 text-[#6B6058]/60 shrink-0" />
              <Link to="/products" className="hover:text-[#FA661C] transition-colors font-medium">Products</Link>
              {product.category_name && (
                <>
                  <ChevronRight className="w-3 h-3 text-[#6B6058]/60 shrink-0" />
                  <span className="font-medium text-[#6B6058]">{product.category_name}</span>
                </>
              )}
              <ChevronRight className="w-3 h-3 text-[#6B6058]/60 shrink-0" />
              <span className="font-bold text-[#FA661C] truncate max-w-[200px]">{product.name}</span>
            </nav>

            {/* Main Product Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Image Gallery (5 cols) */}
              <div className="md:col-span-5 space-y-4">
                {/* Primary Featured Image View */}
                <div className="relative aspect-square w-full bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs group">
                  <img 
                    src={resolveMediaUrl(selectedImage)} 
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/products/spatial_headphones_1786529304124.png";
                    }}
                  />

                  {/* Stock Urgency Tag */}
                  {isUrgent && (
                    <span className="absolute top-3 left-3 bg-[#D7263D] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-xs animate-pulse">
                      Only {stockQuantity} Left in Stock!
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="absolute top-3 left-3 bg-[#6B6058] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-xs">
                      Currently Out of Stock
                    </span>
                  )}

                  {/* Wishlist Button Overlay */}
                  <button
                    type="button"
                    onClick={toggleWishlist}
                    className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-md transition-all cursor-pointer ${
                      isWishlisted 
                        ? 'bg-[#D7263D] text-white' 
                        : 'bg-white/90 hover:bg-white text-[#6B6058] hover:text-[#D7263D]'
                    }`}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Thumbnails Gallery Strip */}
                {product.images && product.images.length > 1 && (
                  <div className="flex items-center space-x-3 overflow-x-auto pb-1">
                    {product.images.map((imgObj, idx) => {
                      const isSelected = selectedImage === imgObj.image;
                      return (
                        <button
                          key={imgObj.id || idx}
                          type="button"
                          onClick={() => setSelectedImage(imgObj.image)}
                          className={`w-16 h-16 rounded-xl border overflow-hidden shrink-0 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-[#FA661C] ring-2 ring-[#FF811A]/40 shadow-xs' 
                              : 'border-[#EAE3DC] hover:border-[#6B6058]/60 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img 
                            src={resolveMediaUrl(imgObj.image)} 
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Product Info & Buy Box (7 cols) */}
              <div className="md:col-span-7 space-y-5">
                
                {/* Category & Verified Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FA661C] bg-[#FFF3EC] px-3 py-1 rounded-full border border-[#FA661C]/20">
                    {product.category_name || 'General Catalog'}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-[#FA661C] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 fill-current text-[#FF811A]" />
                    <span>MytriKart Verified Product</span>
                  </div>
                </div>

                {/* Product Title */}
                <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Ratings & Reviews Row */}
                <div className="flex items-center space-x-3 border-b border-[#EAE3DC] pb-4">
                  {product.average_rating ? (
                    <div className="flex items-center space-x-1 bg-[#FFF8F2] px-2.5 py-1 rounded-lg border border-[#FF811A]/30">
                      <Star className="w-3.5 h-3.5 text-[#FF811A] fill-[#FF811A]" />
                      <span className="text-xs font-extrabold text-[#FA661C]">
                        {Number(product.average_rating).toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-[#6B6058] bg-[#F7F4F0] px-2.5 py-1 rounded-lg border border-[#EAE3DC]">
                      No ratings yet
                    </span>
                  )}
                  <span className="text-xs text-[#6B6058]">
                    {product.review_count || 0} customer reviews
                  </span>
                </div>

                {/* Price Display Box */}
                <div className="bg-[#FFF8F2] border border-[#EAE3DC] p-4 rounded-2xl space-y-1">
                  <div className="flex items-baseline space-x-3">
                    <span className="text-2xl sm:text-3xl font-black text-[#FA661C]">
                      {currentPricing.priceStr}
                    </span>
                    {currentPricing.originalPriceStr && (
                      <span className="text-sm sm:text-base text-[#6B6058] line-through">
                        {currentPricing.originalPriceStr}
                      </span>
                    )}
                    {currentPricing.discountStr && (
                      <span className="text-xs font-bold text-[#FA661C] bg-[#FFF3EC] px-2 py-0.5 rounded border border-[#FA661C]/20">
                        {currentPricing.discountStr}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B6058]">
                    Inclusive of all taxes. Free shipping across India.
                  </p>
                </div>

                {/* Variant Selector (if product has variants) */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-2 border-b border-[#EAE3DC] pb-4">
                    <label className="text-xs font-extrabold text-[#FA661C] uppercase tracking-wider block">
                      Select Variant / Specification:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v) => {
                        const isSelected = selectedVariant?.id === v.id;
                        const attrText = v.attributes && Object.keys(v.attributes).length > 0
                          ? Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(' | ')
                          : v.sku_code || `Variant #${v.id}`;

                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariant(v)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center space-x-2 ${
                              isSelected
                                ? 'bg-[#FA661C] text-white border-[#FA661C] shadow-2xs'
                                : 'bg-white text-[#6B6058] hover:text-[#FA661C] border-[#EAE3DC] hover:border-[#FF811A]'
                            }`}
                          >
                            <span>{attrText}</span>
                            <span className="text-[10px] opacity-90">(₹{parseFloat(v.price).toLocaleString('en-IN')})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="space-y-1.5 border-b border-[#EAE3DC] pb-4">
                    <h3 className="text-xs font-extrabold text-[#FA661C] uppercase tracking-wider">
                      Product Overview & Features
                    </h3>
                    <div className="text-xs text-[#1A2420] whitespace-pre-line leading-relaxed">
                      {product.description}
                    </div>
                  </div>
                )}

                {/* Attributes / Specifications List */}
                {product.attribute_values && product.attribute_values.length > 0 && (
                  <div className="space-y-2 border-b border-[#EAE3DC] pb-4">
                    <h3 className="text-xs font-extrabold text-[#FA661C] uppercase tracking-wider">
                      Specifications
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {product.attribute_values.map((attr) => (
                        <div key={attr.id} className="flex items-center space-x-2 bg-[#FFF8F2] p-2 rounded-lg border border-[#EAE3DC]">
                          <span className="font-bold text-[#FA661C]">{attr.attribute_name}:</span>
                          <span className="text-[#1A2420] font-medium">{attr.raw_value || attr.value_name || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & Buy Box Actions */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-extrabold text-[#FA661C] uppercase tracking-wider">Quantity:</span>
                    <div className="flex items-center space-x-1 bg-white border border-[#EAE3DC] rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="p-1.5 rounded-lg text-[#6B6058] hover:text-[#FA661C] disabled:opacity-40 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-extrabold text-xs text-[#1A2420]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        disabled={isOutOfStock || (stockQuantity > 0 && quantity >= stockQuantity)}
                        className="p-1.5 rounded-lg text-[#6B6058] hover:text-[#FA661C] disabled:opacity-40 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className="flex-1 py-3 px-6 bg-[#FA661C] hover:bg-[#E0530B] disabled:bg-[#6B6058] text-white font-extrabold text-sm rounded-xl shadow-xs btn-interactive flex items-center justify-center space-x-2 cursor-pointer transition-all"
                    >
                      <ShoppingBag className="w-4 h-4 text-white" />
                      <span>{isOutOfStock ? 'Currently Out of Stock' : 'Add to Shopping Bag'}</span>
                    </button>
                  </div>
                </div>

                {/* Trust Badges Bar */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-[#6B6058]">
                  <div className="flex items-center space-x-1.5 bg-[#FFF8F2] p-2 rounded-xl border border-[#EAE3DC]">
                    <Truck className="w-4 h-4 text-[#FF811A] shrink-0" />
                    <span className="font-semibold text-[10px]">Fast Delivery</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-[#FFF8F2] p-2 rounded-xl border border-[#EAE3DC]">
                    <ShieldCheck className="w-4 h-4 text-[#FF811A] shrink-0" />
                    <span className="font-semibold text-[10px]">Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-[#FFF8F2] p-2 rounded-xl border border-[#EAE3DC]">
                    <CheckCircle2 className="w-4 h-4 text-[#FF811A] shrink-0" />
                    <span className="font-semibold text-[10px]">Verified Seller</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* Delivery Modal */}
      <DeliveryModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(loc) => setDeliveryLocation(loc)}
        currentLocation={deliveryLocation}
      />

    </div>
  );
}
