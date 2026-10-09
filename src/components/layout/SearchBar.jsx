import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

export default function SearchBar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const prefix = query.trim();
    if (!prefix) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await apiRequest(`/api/products/published/?prefix=${encodeURIComponent(prefix)}`);
        if (active) setSuggestions(Array.isArray(results) ? results : []);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setLoadingSuggestions(false);
      }
    }, 180);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
  };

  const executeSearch = (searchTerm) => {
    const trimmed = searchTerm.trim();
    if (trimmed) {
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/products');
    }
    setIsFocused(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleSuggestionClick = (tag) => {
    setQuery(tag);
    executeSearch(tag);
  };

  return (
    <div className="relative flex-1 max-w-2xl mx-auto w-full">
      <form 
        onSubmit={handleSubmit} 
        className={`relative flex items-center w-full transition-all duration-200 rounded-xl bg-white border ${
          isFocused 
            ? 'border-[#FA661C] ring-2 ring-[#FF811A]/35 shadow-[0_4px_16px_rgba(250, 102, 28,0.12)]' 
            : 'border-[#EAE3DC] hover:border-[#6B6058]/60 shadow-xs'
        }`}
      >
        {/* Search Icon */}
        <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-[#6B6058]">
          <Search className={`w-5 h-5 transition-transform duration-200 ${isFocused ? 'text-[#FA661C] scale-110' : 'text-[#6B6058]'}`} />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay hide to allow click handlers on dropdown suggestions to fire
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder="Search for Products, Brands and More"
          className="w-full py-2.5 pr-10 text-sm text-[#FA661C] placeholder-[#6B6058]/70 bg-transparent focus:outline-none font-medium"
          aria-label="Search for products, brands and categories"
        />

        {/* Clear Query Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="pr-3 text-[#6B6058] hover:text-[#D7263D] transition-colors focus:outline-none icon-interactive cursor-pointer"
            aria-label="Clear search text"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search Submit Button */}
        <button
          type="submit"
          className="mr-1.5 px-3.5 py-1.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] text-xs font-semibold rounded-lg btn-interactive flex items-center space-x-1 shadow-xs cursor-pointer"
        >
          <span className="hidden sm:inline">Search</span>
          <Sparkles className="w-3.5 h-3.5 text-[#FF811A] icon-interactive" />
        </button>
      </form>

      {/* Interactive Quick Suggestions overlay on focus */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#EAE3DC] rounded-xl shadow-xl z-50 p-3 text-xs text-[#6B6058] animate-dropdown">
          {query.trim() ? (
            <>
              <p className="font-bold text-[#FA661C] mb-2 uppercase tracking-wider text-[10px]">Products starting with “{query.trim()}”</p>
              {loadingSuggestions ? (
                <p>Looking for matching products…</p>
              ) : suggestions.length ? (
                <ul role="listbox" aria-label="Matching products" className="max-h-72 overflow-y-auto">
                  {suggestions.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected="false"
                        onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(product.name); }}
                        className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-[#1B1B1B] hover:bg-[#FFF3EC]"
                      >
                        <span className="font-semibold">{product.name}</span>
                        {product.category_name && <span className="ml-2 text-xs text-[#6B6058]">{product.category_name}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No products start with those letters.</p>
              )}
            </>
          ) : (
          <>
          <p className="font-bold text-[#FA661C] mb-2 uppercase tracking-wider text-[10px] flex items-center justify-between">
            <span>Popular Categories</span>
            <span className="text-[#FF811A] text-[10px] font-extrabold flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Trending Now</span>
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {['Electronics', 'Laptops', 'Smartphones', 'Kitchen Appliances', 'Fashion'].map((tag) => (
              <button
                key={tag}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(tag);
                }}
                className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#FFF3EC] text-[#FA661C] rounded-md border border-[#EAE3DC]/80 font-medium btn-interactive cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
}
