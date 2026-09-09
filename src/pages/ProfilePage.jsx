import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import ProfileSidebar, { PROFILE_SECTIONS } from '../components/profile/ProfileSidebar';
import PersonalDetailsSection from '../components/profile/PersonalDetailsSection';
import AddressBookSection from '../components/profile/AddressBookSection';
import OrdersSection from '../components/profile/OrdersSection';
import RefundsSection from '../components/profile/RefundsSection';
import WarrantySection from '../components/profile/WarrantySection';
import NotificationsSection from '../components/profile/NotificationsSection';
import SupportSection from '../components/profile/SupportSection';
import AccountSettingsSection from '../components/profile/AccountSettingsSection';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Home,
  CheckCircle2,
  LogOut
} from 'lucide-react';

export default function ProfilePage({ onLogout }) {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, currentUser, logout, isLoading } = useAuth();

  const isSectionValid = sectionId ? PROFILE_SECTIONS.some(s => s.id === sectionId) : true;
  const initialValidSection = isSectionValid && sectionId ? sectionId : 'profile';

  const [activeSection, setActiveSection] = useState(initialValidSection);
  const [userProfile, setUserProfile] = useState(currentUser || {});
  const [mobileDrilldownOpen, setMobileDrilldownOpen] = useState(Boolean(sectionId));

  // Sync profile state with real AuthContext user profile
  useEffect(() => {
    if (currentUser) {
      setUserProfile(prev => ({
        ...prev,
        ...currentUser,
        fullName: currentUser.fullName || currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username,
        email: currentUser.email || prev.email,
        mobile: currentUser.phone_number || currentUser.mobile || prev.mobile,
      }));
    }
  }, [currentUser]);

  // Sync sectionId from URL instantly
  useEffect(() => {
    if (sectionId) {
      const isValid = PROFILE_SECTIONS.some(s => s.id === sectionId);
      setActiveSection(isValid ? sectionId : 'profile');
      setMobileDrilldownOpen(true);
    } else {
      setActiveSection('profile');
    }
  }, [sectionId]);

  // SEO Standard - Page Metadata
  useEffect(() => {
    const currentMeta = PROFILE_SECTIONS.find(s => s.id === activeSection) || PROFILE_SECTIONS[0];
    document.title = `${currentMeta.label} — MytriKart Account Hub`;
  }, [activeSection]);

  // Protection guard: redirect to /login if logged out and not loading
  if (!isLoggedIn && !isLoading) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const handleSelectSection = (secId) => {
    if (secId === activeSection) return;
    setActiveSection(secId);
    navigate(`/profile/${secId}`);
    setMobileDrilldownOpen(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleMobileBackToHub = () => {
    setMobileDrilldownOpen(false);
    navigate('/profile');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSignOut = async () => {
    await logout();
    if (onLogout) onLogout();
    navigate('/');
  };

  const currentSectionMeta = PROFILE_SECTIONS.find(s => s.id === activeSection) || PROFILE_SECTIONS[0];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A2420] flex flex-col font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* Top Breadcrumb / Navigation Bar */}
      <header className="bg-white border-b border-[#EAE3DC] py-3 px-4 sm:px-8 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="flex items-center space-x-1.5 font-['Outfit'] font-extrabold text-xl text-[#FA661C] group btn-interactive"
              aria-label="Return to Marketplace Homepage"
            >
              <span>Mytri<span className="text-[#FF811A]">Kart</span></span>
            </Link>

            <span className="text-[#EAE3DC] hidden sm:inline">|</span>

            {/* Breadcrumb trail */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-[#6B6058]">
              <Link to="/" className="hover:text-[#FA661C] transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#EAE3DC]" />
              <Link to="/profile" className="font-bold text-[#FA661C]">Account Hub</Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#EAE3DC]" />
              <span className="font-semibold text-[#FF811A]">{currentSectionMeta.label}</span>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-xl border border-[#EAE3DC] bg-[#FFFFFF] hover:bg-[#FFF3EC] text-xs font-bold text-[#FA661C] transition-all flex items-center space-x-1.5 btn-interactive shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Marketplace</span>
              <span className="sm:hidden">Store</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-3.5 py-1.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] text-xs font-bold transition-all shadow-xs btn-interactive flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#FF811A]" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Profile Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Mobile Header Drilldown Bar */}
        <div className="md:hidden mb-4 flex items-center justify-between">
          {mobileDrilldownOpen ? (
            <button
              type="button"
              onClick={handleMobileBackToHub}
              className="flex items-center space-x-1.5 text-xs font-bold text-[#FA661C] bg-white px-3 py-2 rounded-xl border border-[#EAE3DC] shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Account Menu</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF811A]" />
              <span className="font-['Outfit'] font-black text-sm text-[#FA661C]">Select Account Section</span>
            </div>
          )}
        </div>

        {/* Responsive Grid: Left Sidebar + Right Dynamic Main Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className={`md:col-span-4 lg:col-span-3 ${
            mobileDrilldownOpen ? 'hidden md:block' : 'block'
          }`}>
            <ProfileSidebar 
              activeSection={activeSection}
              onSelectSection={handleSelectSection}
              user={userProfile}
              userProfile={userProfile}
              onLogout={handleSignOut}
            />
          </div>

          {/* Right Dynamic Content Section */}
          <div className={`md:col-span-8 lg:col-span-9 ${
            !mobileDrilldownOpen ? 'hidden md:block' : 'block'
          }`}>
            
            <div className="space-y-6">
              
              {/* 1. Personal Details */}
              {activeSection === 'profile' && (
                <PersonalDetailsSection 
                  profileData={userProfile} 
                  userProfile={userProfile}
                  onUpdateProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated }))}
                />
              )}

              {/* 2. Address Book */}
              {activeSection === 'addresses' && (
                <AddressBookSection />
              )}

              {/* 3. Orders & Tracking */}
              {activeSection === 'orders' && (
                <OrdersSection onTrackOrder={(orderId) => alert(`Opening tracking timeline for ${orderId}`)} />
              )}

              {/* 4. Refunds & Returns */}
              {activeSection === 'refunds' && (
                <RefundsSection />
              )}

              {/* 5. Extended Warranty */}
              {activeSection === 'warranty' && (
                <WarrantySection />
              )}

              {/* 8. Notifications Preferences */}
              {activeSection === 'notifications' && (
                <NotificationsSection />
              )}

              {/* 9. Help Center & 24x7 Support */}
              {activeSection === 'support' && (
                <SupportSection />
              )}

              {/* 10. Account Settings */}
              {activeSection === 'settings' && (
                <AccountSettingsSection onLogout={handleSignOut} />
              )}

              {/* Fallback for PAN/GSTIN & Privacy */}
              {(activeSection === 'pan-gstin' || activeSection === 'privacy') && (
                <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-[#FA661C]" />
                    <h3 className="font-['Outfit'] font-black text-lg text-[#FA661C] capitalize">
                      {activeSection.replace('-', ' ')} Verification
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B6058]">
                    Your identity documents and statutory compliance data are verified with 256-bit AES encryption.
                  </p>
                  <div className="p-4 bg-[#FFF8F2] rounded-2xl border border-[#FF811A]/40 text-xs font-bold text-[#FA661C]">
                    Status: KYC Verified & Linked to GSTIN / PAN Dossier
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
