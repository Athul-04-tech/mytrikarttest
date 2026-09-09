import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Wallet, 
  Award, 
  Lock, 
  UserCheck, 
  UserX,
  Loader2
} from 'lucide-react';
import { useCart } from '../context/CartWishlistContext';
import ShippingAddressSection, { SAVED_ADDRESSES } from '../components/checkout/ShippingAddressSection';
import PaymentMethodSection from '../components/checkout/PaymentMethodSection';
import OrderSummarySidebar from '../components/cart/OrderSummarySidebar';
import OrderSuccessConfirmation from '../components/checkout/OrderSuccessConfirmation';

export default function CheckoutPage() {
  const {
    cart,
    calculations,
    walletBalance,
    rewardPointsBalance,
    rewardPointsValue,
    useWallet,
    setUseWallet,
    useRewardPoints,
    setUseRewardPoints,
    placeOrder,
    lastPlacedOrder
  } = useCart();

  const navigate = useNavigate();

  const [isGuest, setIsGuest] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(SAVED_ADDRESSES[0]);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(lastPlacedOrder);

  // SEO Standard
  useEffect(() => {
    document.title = "Secure Checkout — MytriKart";
  }, []);

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const order = placeOrder({
        shippingAddress: selectedAddress,
        paymentMethod
      });
      setConfirmedOrder(order);
      setIsProcessing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  // If order was just completed, show Confirmation screen
  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#1A2420] font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
        <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#EAE3DC] shadow-xs px-4 sm:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="font-['Outfit'] font-black text-lg text-[#FA661C]">
              Mytri<span className="text-[#FF811A]">Kart</span> Receipt
            </Link>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
          <OrderSuccessConfirmation order={confirmedOrder} onBackToHome={() => navigate('/')} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#1A2420] font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* 1. Header */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#EAE3DC] shadow-xs px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/cart"
              className="p-2 rounded-xl bg-white hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] icon-interactive cursor-pointer"
              aria-label="Back to Shopping Bag"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[#FA661C]">
                  Secure One-Page Checkout
                </span>
                <span className="text-[10px] font-bold bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>256-bit SSL</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Checkout Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: One-Page Checkout Sections (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* 1. Guest Checkout Notice / Toggle */}
            <div className="bg-[#FFF8F2] border border-[#FF811A]/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white rounded-xl text-[#FA661C] border border-[#FF811A]/40 shrink-0">
                  {isGuest ? <UserX className="w-4 h-4 text-[#D7263D]" /> : <UserCheck className="w-4 h-4 text-[#FA661C]" />}
                </div>
                <div>
                  <span className="font-bold text-[#FA661C] block">
                    {isGuest ? 'Checking out as Guest Visitor' : 'Logged in as Aarav Sharma (Plus Member)'}
                  </span>
                  <p className="text-[10px] text-[#6B6058]">
                    {isGuest 
                      ? 'Saved addresses and loyalty points are hidden in guest mode.' 
                      : 'Addresses and wallet balances are automatically pre-filled.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGuest(!isGuest)}
                className="px-3.5 py-1.5 bg-white hover:bg-[#FFFFFF] text-[#FA661C] border border-[#EAE3DC] rounded-xl text-[11px] font-bold btn-interactive cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
              >
                {isGuest ? 'Switch to Logged In' : 'Continue as Guest'}
              </button>
            </div>

            {/* 2. Shipping Address & Same as Shipping Billing */}
            <ShippingAddressSection
              selectedAddressId={selectedAddress.id}
              onSelectAddress={(addr) => setSelectedAddress(addr)}
              sameAsShipping={sameAsShipping}
              onToggleSameAsShipping={setSameAsShipping}
              isGuest={isGuest}
            />

            {/* 4. Payment Method Selection (with PIN COD Check & EMI) */}
            <PaymentMethodSection
              selectedMethod={paymentMethod}
              onSelectMethod={(m) => setPaymentMethod(m)}
              selectedAddress={selectedAddress}
              payableAmount={calculations.amountPayable}
            />

            {/* 5 & 6. Wallet Usage & Reward Points Redemption */}
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4 text-xs">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#EAE3DC]">
                <span className="w-6 h-6 rounded-full bg-[#FA661C] text-[#FF811A] font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
                  Wallet & Loyalty Redemptions
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* 5. Wallet Usage */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  useWallet ? 'bg-[#FFF8F2] border-[#FF811A]' : 'bg-[#FFFFFF] border-[#EAE3DC]'
                }`}>
                  <label className="flex items-start justify-between cursor-pointer">
                    <div className="flex items-start space-x-2.5">
                      <Wallet className="w-4 h-4 text-[#FF811A] mt-0.5" />
                      <div>
                        <span className="font-bold text-[#FA661C] block">
                          Use Mytri Wallet Balance
                        </span>
                        <p className="text-[10px] text-[#6B6058]">
                          Available balance: <strong className="text-[#FA661C]">₹{walletBalance.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      className="w-4 h-4 text-[#FA661C] rounded border-[#EAE3DC] focus:ring-[#FF811A] cursor-pointer mt-1"
                    />
                  </label>
                </div>

                {/* 6. Reward Points Redemption */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  useRewardPoints ? 'bg-[#FFF8F2] border-[#FF811A]' : 'bg-[#FFFFFF] border-[#EAE3DC]'
                }`}>
                  <label className="flex items-start justify-between cursor-pointer">
                    <div className="flex items-start space-x-2.5">
                      <Award className="w-4 h-4 text-[#FA661C] mt-0.5" />
                      <div>
                        <span className="font-bold text-[#FA661C] block">
                          Redeem Plus Points
                        </span>
                        <p className="text-[10px] text-[#6B6058]">
                          {rewardPointsBalance} Points = <strong className="text-[#FA661C]">₹{rewardPointsValue.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={useRewardPoints}
                      onChange={(e) => setUseRewardPoints(e.target.checked)}
                      className="w-4 h-4 text-[#FA661C] rounded border-[#EAE3DC] focus:ring-[#FF811A] cursor-pointer mt-1"
                    />
                  </label>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky Order Summary & Primary Place Order CTA */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            
            <OrderSummarySidebar isCheckoutPage={true} />

            {/* Place Order Primary Action Button */}
            <div className="p-4 bg-white rounded-3xl border border-[#EAE3DC] space-y-3 text-center">
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isProcessing || cart.length === 0}
                className="w-full py-3.5 px-5 bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] text-[#FFFFFF] rounded-2xl font-black text-sm btn-interactive flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF811A]" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#FF811A]" />
                    <span>Place Order (₹{calculations.amountPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-[#6B6058]">
                By placing this order, you agree to MytriKart Terms of Sale and Fair Returns Policy.
              </p>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
