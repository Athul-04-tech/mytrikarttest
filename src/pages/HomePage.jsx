import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import CategoryNav from '../components/navigation/CategoryNav';
import HeroCarousel from '../components/hero/HeroCarousel';
import PopularPicks from '../components/products/PopularPicks';
import DeliveryModal from '../components/modals/DeliveryModal';
import ProfileCompletionBanner from '../components/layout/ProfileCompletionBanner';
import Footer from '../components/layout/Footer';
import { Zap, ShieldCheck, Tag, Gift, Sparkles, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

export default function HomePage({ isLoggedIn, currentUser, onLogout }) {
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  // Validate if category exists, else default to 'for-you'
  const isCategoryValid = categorySlug ? CATEGORIES.some(c => c.id === categorySlug) : true;
  const validCategory = isCategoryValid && categorySlug ? categorySlug : 'for-you';

  const [activeCategory, setActiveCategory] = useState(validCategory);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Sync with URL parameter instantly without delay
  useEffect(() => {
    if (categorySlug) {
      const isValid = CATEGORIES.some(c => c.id === categorySlug);
      setActiveCategory(isValid ? categorySlug : 'for-you');
    } else {
      setActiveCategory('for-you');
    }
  }, [categorySlug]);

  const handleCategorySelect = (catId) => {
    if (catId === activeCategory) return;
    setActiveCategory(catId);
    
    if (catId === 'for-you') {
      navigate('/');
    } else {
      navigate(`/category/${catId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#1A2420] flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-[#0F3D2E]">
      
      {/* Accessibility / SEO Landmark */}
      <h1 className="sr-only">
        MytriKart — Multi-Vendor E-Commerce Marketplace Customer Homepage
      </h1>

      {/* Header */}
      <Header 
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        deliveryLocation={deliveryLocation}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Category Navigation Strip with Real URL Routing */}
      <CategoryNav 
        activeCategory={activeCategory}
        onSelectCategory={handleCategorySelect}
      />

      {/* Dismissible Profile Completion Banner */}
      {isLoggedIn && (
        <ProfileCompletionBanner 
          onCompleteProfile={() => navigate('/profile')}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        
        {/* Dynamic Category Hero Carousel */}
        <HeroCarousel activeCategory={activeCategory} />

        {/* Highlight Quick Perks Banner Strip */}
        <section aria-label="Marketplace Perks" className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="bg-white border border-[#D8E0DC] rounded-2xl p-3 sm:p-4 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-2.5 text-center">
            
            <div className="flex items-center justify-center space-x-2 py-1 px-2 rounded-xl bg-[#FBF8F1]">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#0F3D2E]">Flash Deals Daily</span>
            </div>

            <div className="flex items-center justify-center space-x-2 py-1 px-2 rounded-xl bg-[#FBF8F1]">
              <ShieldCheck className="w-4 h-4 text-[#0F3D2E]" />
              <span className="text-xs font-bold text-[#0F3D2E]">Verified Sellers Only</span>
            </div>

            <div className="flex items-center justify-center space-x-2 py-1 px-2 rounded-xl bg-[#FBF8F1]">
              <Tag className="w-4 h-4 text-[#C0392B]" />
              <span className="text-xs font-bold text-[#0F3D2E]">Best Price Assurance</span>
            </div>

            <div className="flex items-center justify-center space-x-2 py-1 px-2 rounded-xl bg-[#FBF8F1]">
              <Gift className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#0F3D2E]">Mytri Plus Rewards</span>
            </div>

          </div>
        </section>

        {/* Dense Product Grid Section with Category Dynamic Content & Sub-Filters */}
        <PopularPicks 
          activeCategory={activeCategory}
          isLoading={false}
        />

        {/* Secondary Promotional Banner Grid */}
        <section aria-label="Marketplace Highlights" className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Seller Hub Join Card */}
            <div className="bg-gradient-to-br from-[#0F3D2E] to-[#16523F] p-6 sm:p-8 rounded-3xl text-[#FBF8F1] shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[200px] border border-[#D4AF37]/30 card-interactive">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#D4AF37] text-[#0F3D2E] px-2.5 py-0.5 rounded-full shadow-2xs">
                  SELLER OPPORTUNITY
                </span>
                <h3 className="font-['Outfit'] text-2xl font-extrabold text-[#FBF8F1] mt-3">
                  Become a Verified MytriKart Marketplace Seller
                </h3>
                <p className="text-xs text-[#FBF8F1]/80 mt-1 max-w-md">
                  Grow your brand across millions of active shoppers with 0% onboarding fee & 24x7 seller support.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  to="/seller/register"
                  className="inline-flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#E3BE46] text-[#0F3D2E] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md btn-interactive cursor-pointer"
                >
                  <span>Start Selling Today</span>
                  <ChevronRight className="w-4 h-4 icon-interactive" />
                </Link>

                <Link
                  to="/seller/dashboard"
                  className="inline-flex items-center space-x-2 bg-[#0A2A1F] hover:bg-[#124233] text-[#D4AF37] border border-[#D4AF37]/40 font-extrabold text-xs px-4 py-2.5 rounded-xl btn-interactive cursor-pointer"
                >
                  <span>Open Seller Hub Dashboard →</span>
                </Link>
              </div>
            </div>

            {/* Mytri Plus Loyalty Card */}
            <div className="bg-gradient-to-br from-[#1D4A3A] via-[#0F3D2E] to-[#0A2A1F] p-6 sm:p-8 rounded-3xl text-[#FBF8F1] shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[200px] border border-[#D4AF37]/30 card-interactive">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#0F3D2E] text-[#D4AF37] border border-[#D4AF37]/50 px-2.5 py-0.5 rounded-full flex items-center w-max space-x-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#D4AF37] icon-interactive" />
                  <span>PLUS LOYALTY ZONE</span>
                </span>
                <h3 className="font-['Outfit'] text-2xl font-extrabold text-[#FBF8F1] mt-3">
                  Unlock Free Fast Delivery & Early Sale Access
                </h3>
                <p className="text-xs text-[#FBF8F1]/80 mt-1 max-w-md">
                  Join millions of Plus members enjoying zero shipping costs, priority customer care, and exclusive cashbacks.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  to="/profile/rewards"
                  className="inline-flex items-center space-x-2 bg-[#FBF8F1] hover:bg-white text-[#0F3D2E] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md btn-interactive cursor-pointer"
                >
                  <span>Explore Gold Perks</span>
                  <ChevronRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
                </Link>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer Component */}
      <Footer />

      {/* Delivery Location Modal */}
      <DeliveryModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(loc) => setDeliveryLocation(loc)}
        currentLocation={deliveryLocation}
      />

    </div>
  );
}
