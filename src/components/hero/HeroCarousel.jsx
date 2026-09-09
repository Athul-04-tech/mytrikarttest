import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { HERO_SLIDES } from '../../data/mockData';

export default function HeroCarousel({ activeCategory = 'for-you' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter or prioritize slides matching active category
  const relevantSlides = activeCategory === 'for-you'
    ? HERO_SLIDES
    : HERO_SLIDES.filter(s => s.category === activeCategory).length > 0
    ? HERO_SLIDES.filter(s => s.category === activeCategory)
    : HERO_SLIDES;

  // Touch swipe support variables
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  // Auto-play timer (5 seconds interval)
  useEffect(() => {
    if (isPaused || relevantSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % relevantSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, relevantSlides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + relevantSlides.length) % relevantSlides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % relevantSlides.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 40) {
      handleNext();
    }
    if (touchEndX.current - touchStartX.current > 40) {
      handlePrev();
    }
  };

  return (
    <section 
      aria-label="Promotional Hero Banners"
      className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-[#FF811A]/30 group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Track */}
        <div 
          className="flex transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {relevantSlides.map((slide, idx) => (
            <div 
              key={slide.id} 
              className="w-full shrink-0 relative min-h-[260px] sm:min-h-[320px] md:min-h-[380px] flex items-center bg-gradient-to-r"
            >
              {/* Background Cover Image with Gradient Mask */}
              <img 
                src={slide.image} 
                alt={slide.title}
                width="1200"
                height="450"
                decoding="async"
                fetchPriority={idx === 0 ? 'high' : 'low'}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-overlay"
              />

              {/* Decorative Background Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FA661C] via-[#FA661C]/90 to-transparent" />
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#FF811A]/10 to-transparent pointer-events-none" />

              {/* Slide Content Box */}
              <div className="relative z-10 p-6 sm:p-10 md:p-14 max-w-xl text-[#FFFFFF]">
                
                {/* Badge + Tagline */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest bg-[#FF811A] text-[#FA661C] px-2.5 py-0.5 rounded-full shadow-2xs">
                    {slide.badge}
                  </span>
                  <span className="text-xs font-semibold text-[#FF811A] tracking-wider hidden sm:inline-block">
                    • {slide.tagline}
                  </span>
                </div>

                {/* Banner Main Title */}
                <h2 className="font-['Outfit'] text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#FFFFFF] leading-tight mb-2 tracking-tight">
                  {slide.title}
                </h2>

                {/* Subtitle / Offer text */}
                <p className="text-xs sm:text-base text-[#FFFFFF]/90 font-medium mb-6 max-w-md">
                  {slide.subtitle}
                </p>

                {/* CTA Button */}
                <a
                  href="#explore"
                  onClick={(e) => { e.preventDefault(); alert(`Navigating to promotional campaign: ${slide.title}`); }}
                  className="inline-flex items-center space-x-2 bg-[#FF811A] hover:bg-[#E3BE46] text-[#FA661C] font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all btn-interactive"
                >
                  <span>{slide.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

              </div>

              {/* Corner AD Tag */}
              {slide.isAd && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                  <span className="text-[10px] font-bold text-[#FF811A] bg-[#FA661C]/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#FF811A]/40 shadow-xs uppercase tracking-wider">
                    AD
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Arrow Controls */}
        {relevantSlides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#FFFFFF]/80 hover:bg-[#FFFFFF] text-[#FA661C] items-center justify-center shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all btn-interactive focus:outline-none cursor-pointer"
              aria-label="Previous Banner Slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#FFFFFF]/80 hover:bg-[#FFFFFF] text-[#FA661C] items-center justify-center shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all btn-interactive focus:outline-none cursor-pointer"
              aria-label="Next Banner Slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Carousel Dot Indicators */}
        {relevantSlides.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center items-center space-x-2">
            {relevantSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                  currentIndex === idx 
                    ? 'w-7 bg-[#FF811A] shadow-xs' 
                    : 'w-2 bg-[#6B6058]/60 hover:bg-[#FFFFFF]'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
