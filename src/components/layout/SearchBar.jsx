import React, { useState } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => setQuery('');

  return (
    <div className="relative flex-1 max-w-2xl mx-auto w-full">
      <form 
        onSubmit={(e) => e.preventDefault()} 
        className={`relative flex items-center w-full transition-all duration-200 rounded-xl bg-white border ${
          isFocused 
            ? 'border-[#0F3D2E] ring-2 ring-[#D4AF37]/35 shadow-[0_4px_16px_rgba(15,61,46,0.12)]' 
            : 'border-[#D8E0DC] hover:border-[#5C6B63]/60 shadow-xs'
        }`}
      >
        {/* Search Icon */}
        <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-[#5C6B63]">
          <Search className={`w-5 h-5 transition-transform duration-200 ${isFocused ? 'text-[#0F3D2E] scale-110' : 'text-[#5C6B63]'}`} />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for Products, Brands and More"
          className="w-full py-2.5 pr-10 text-sm text-[#0F3D2E] placeholder-[#5C6B63]/70 bg-transparent focus:outline-none font-medium"
          aria-label="Search for products, brands and categories"
        />

        {/* Clear Query Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="pr-3 text-[#5C6B63] hover:text-[#C0392B] transition-colors focus:outline-none icon-interactive cursor-pointer"
            aria-label="Clear search text"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search Submit Button */}
        <button
          type="submit"
          className="mr-1.5 px-3.5 py-1.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] text-xs font-semibold rounded-lg btn-interactive flex items-center space-x-1 shadow-xs cursor-pointer"
        >
          <span className="hidden sm:inline">Search</span>
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] icon-interactive" />
        </button>
      </form>

      {/* Interactive Quick Suggestions overlay on focus */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#D8E0DC] rounded-xl shadow-xl z-50 p-3 text-xs text-[#5C6B63] animate-dropdown">
          <p className="font-bold text-[#0F3D2E] mb-2 uppercase tracking-wider text-[10px] flex items-center justify-between">
            <span>Popular Searches</span>
            <span className="text-[#D4AF37] text-[10px] font-extrabold flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Trending Now</span>
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {['Noise Cancelling Headphones', 'OLED Gaming Monitors', 'Artisan Coffee', 'Leather Watches', 'Wireless Earbuds'].map((tag) => (
              <button
                key={tag}
                type="button"
                onMouseDown={() => setQuery(tag)}
                className="px-2.5 py-1 bg-[#FBF8F1] hover:bg-[#E8F2EE] text-[#0F3D2E] rounded-md border border-[#D8E0DC]/80 font-medium btn-interactive cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
