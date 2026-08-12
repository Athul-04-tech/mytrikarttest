import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Shirt, 
  Smartphone, 
  Laptop, 
  Sparkle, 
  Home, 
  Tv, 
  Baby, 
  HeartPulse, 
  Car, 
  Dumbbell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';

// Locked unified icon mapping with consistent stroke style
const ICON_MAP = {
  Sparkles,
  Shirt,
  Smartphone,
  Laptop,
  Sparkle,
  Home,
  Tv,
  Baby,
  HeartPulse,
  Car,
  Dumbbell
};

// Subtle, tasteful tonal tinting per category theme
const CATEGORY_TONES = {
  'for-you': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#D4AF37]' },
  'fashion': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#9C5A4C]' },
  'mobiles': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#3B6E8C]' },
  'electronics': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#4A5D78]' },
  'beauty': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#B86B77]' },
  'home': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#8A6D3B]' },
  'appliances': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#46655A]' },
  'toys': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#BF7E28]' },
  'health': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#2D7A58]' },
  'auto': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#4F5D58]' },
  'sports': { text: 'text-[#0F3D2E]', activeRing: 'ring-[#D4AF37]', iconTint: 'text-[#8C6239]' }
};

export default function CategoryNav({ activeCategory = 'for-you', onSelectCategory }) {
  const [selectedId, setSelectedId] = useState(activeCategory);
  const [justSelectedId, setJustSelectedId] = useState(null);
  const [rippleTarget, setRippleTarget] = useState(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const scrollContainerRef = useRef(null);

  // Sync incoming activeCategory prop
  useEffect(() => {
    if (activeCategory) {
      setSelectedId(activeCategory);
    }
  }, [activeCategory]);

  // Handle dynamic edge fades on horizontal scroll
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 12);
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 12);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      handleScroll();
      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleSelect = (id, event) => {
    setSelectedId(id);
    setJustSelectedId(id);
    if (onSelectCategory) onSelectCategory(id);

    // Mobile haptic-style visual ripple trigger
    if (event) {
      setRippleTarget(id);
      setTimeout(() => setRippleTarget(null), 550);
    }

    setTimeout(() => {
      setJustSelectedId(null);
    }, 400);
  };

  const handleArrowScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <nav 
      aria-label="Marketplace Category Navigation"
      className="bg-white border-b border-[#D8E0DC] py-2.5 shadow-2xs sticky top-[105px] sm:top-[73px] z-30 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 relative group/nav">
        
        {/* Desktop Left Scroll Arrow */}
        {showLeftFade && (
          <button
            type="button"
            onClick={() => handleArrowScroll('left')}
            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 border border-[#D8E0DC] text-[#0F3D2E] items-center justify-center shadow-md hover:bg-[#FCF7E8] transition-all hover:scale-110"
            aria-label="Scroll Categories Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Desktop Right Scroll Arrow */}
        {showRightFade && (
          <button
            type="button"
            onClick={() => handleArrowScroll('right')}
            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 border border-[#D8E0DC] text-[#0F3D2E] items-center justify-center shadow-md hover:bg-[#FCF7E8] transition-all hover:scale-110"
            aria-label="Scroll Categories Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Soft Dynamic Edge Fades (Mobile & Tablet indicator) */}
        {showLeftFade && (
          <div className="sm:hidden absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10 animate-fadeIn" />
        )}
        {showRightFade && (
          <div className="sm:hidden absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 animate-fadeIn" />
        )}

        {/* Horizontal Scroll Track with Touch Snapping */}
        <div 
          ref={scrollContainerRef}
          className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar py-1 px-3 snap-x-mandatory scroll-smooth"
        >
          {CATEGORIES.map((cat) => {
            const IconComp = ICON_MAP[cat.iconName] || Sparkles;
            const isActive = cat.id === selectedId;
            const isJustSelected = cat.id === justSelectedId;
            const isRippling = cat.id === rippleTarget;
            const tone = CATEGORY_TONES[cat.id] || CATEGORY_TONES['for-you'];

            return (
              <button
                key={cat.id}
                type="button"
                onClick={(e) => handleSelect(cat.id, e)}
                className={`flex flex-col items-center justify-center shrink-0 px-2 sm:px-3 py-1.5 rounded-2xl transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:ring-offset-2 relative snap-align-center cursor-pointer ${
                  isActive ? 'scale-[1.03]' : 'hover:bg-[#FBF8F1]/80'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Browse ${cat.label} Category`}
              >
                {/* Visual Tactile Ripple Pulse on Tap */}
                {isRippling && (
                  <span className="absolute top-4 w-11 h-11 rounded-full bg-[#D4AF37]/35 animate-ripple pointer-events-none z-0" />
                )}

                {/* Dimensional Icon Badge */}
                <div 
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 mb-1.5 ${
                    isActive 
                      ? `category-active-gradient ${tone.text} ring-2 ${tone.activeRing} category-icon-shadow ${
                          isJustSelected ? 'animate-category-settle' : 'animate-category-breathe'
                        }` 
                      : 'bg-[#FBF8F1] text-[#5C6B63] category-icon-shadow hover:category-icon-shadow-hover hover:scale-108 hover:bg-white group-hover:text-[#0F3D2E]'
                  }`}
                >
                  {/* Unified Line Icon with Locked Stroke Width (1.8) & Hover Spring Wiggle */}
                  <IconComp 
                    strokeWidth={1.8}
                    className={`w-5 h-5 transition-all duration-300 transform ${
                      isActive 
                        ? `${tone.iconTint} scale-105` 
                        : `${tone.iconTint}/80 group-hover:${tone.iconTint} group-hover:scale-110 group-hover:rotate-[-4deg] group-hover:duration-150`
                    }`} 
                  />
                </div>

                {/* Category Label with Smooth Color & Spacing Transition */}
                <span className={`text-[11px] sm:text-xs tracking-tight transition-all duration-200 whitespace-nowrap ${
                  isActive 
                    ? 'text-[#0F3D2E] font-extrabold tracking-normal' 
                    : 'text-[#5C6B63] font-medium group-hover:text-[#0F3D2E] group-hover:font-bold group-hover:tracking-normal'
                }`}>
                  {cat.label}
                </span>

                {/* Animated Center-Outward Drawing Emerald Underline */}
                {isActive && (
                  <span 
                    className="absolute -bottom-1 inset-x-2 h-0.5 bg-[#0F3D2E] rounded-full animate-underline" 
                  />
                )}
              </button>
            );
          })}
        </div>

      </div>
    </nav>
  );
}
