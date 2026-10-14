import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Sparkles, 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  ArrowRight, 
  Coins, 
  CheckCircle2,
  X,
  ShoppingBag,
  ExternalLink,
  Award
} from 'lucide-react';
import { MOCK_REWARDS } from '../../data/profileMockData';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartWishlistContext';
import { createCoupon } from '../../utils/couponManager';

export default function RewardsSection({ userProfile }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { applyCoupon } = useCart();

  // Dynamic Coins State with LocalStorage persistence or backend profile
  const [coinsBalance, setCoinsBalance] = useState(() => {
    try {
      if (userProfile?.rewardPoints !== undefined) return Number(userProfile.rewardPoints);
      if (userProfile?.reward_points_display !== undefined) return Number(userProfile.reward_points_display);
      const saved = localStorage.getItem('mytrikart_coins_balance');
      if (saved !== null) return Number(saved);
      return 0;
    } catch {
      return 0;
    }
  });

  const referralCode = userProfile?.referral_code || (userProfile?.username ? `MYTRI-${userProfile.username.toUpperCase()}` : 'MYTRI-REWARD-774');

  const tier = coinsBalance >= 2000 ? "Gold Plus" : coinsBalance >= 1000 ? "Silver" : "Classic";
  const nextTier = coinsBalance >= 2000 ? "Platinum VIP" : coinsBalance >= 1000 ? "Gold Plus" : "Silver";
  const pointsToNextTier = coinsBalance >= 2000 ? 500 : coinsBalance >= 1000 ? (2000 - coinsBalance) : (1000 - coinsBalance);
  const tierProgressPercent = Math.min(100, Math.round(((coinsBalance % 1000) / 1000) * 100));

  const [copied, setCopied] = useState(false);
  const [redemptionSuccessModal, setRedemptionSuccessModal] = useState(null);

  // Sync coins with storage
  useEffect(() => {
    try {
      localStorage.setItem('mytrikart_coins_balance', coinsBalance.toString());
    } catch (_) {}
  }, [coinsBalance]);

  const handleCopyReferral = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(referralCode);
    }
    setCopied(true);
    toast.success("Referral Code Copied!", `Code "${referralCode}" copied to clipboard. Share with friends to earn 500 coins.`);
    setTimeout(() => setCopied(false), 2500);
  };

  // Redeem Coins for Reward Item
  const handleRedeemReward = (item) => {
    // Extract numerical coin cost
    const costMatch = item.cost.match(/\d[\d,]*/);
    const costNumber = costMatch ? parseInt(costMatch[0].replace(/,/g, ''), 10) : 500;

    if (coinsBalance < costNumber) {
      toast.error(
        "Insufficient Mytri Coins", 
        `You have ${coinsBalance.toLocaleString()} coins, but this reward requires ${costNumber.toLocaleString()} coins. Earn ${costNumber - coinsBalance} more coins through shopping!`
      );
      return;
    }

    // Deduct coins
    const newBalance = coinsBalance - costNumber;
    setCoinsBalance(newBalance);

    // Generate real usable coupon
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    let generatedCode = `REWARD-${randomSuffix}`;
    let discountAmount = 500;
    let minSpend = 1499;
    let discountType = 'flat';

    if (item.id === 'RC-1') {
      generatedCode = `MYTRI500-${randomSuffix}`;
      discountAmount = 500;
      minSpend = 1499;
    } else if (item.id === 'RC-2') {
      generatedCode = `LUXURY1000-${randomSuffix}`;
      discountAmount = 1000;
      minSpend = 2999;
    } else if (item.id === 'RC-3') {
      generatedCode = `FREESHIP-${randomSuffix}`;
      discountType = 'shipping';
      discountAmount = 40;
      minSpend = 299;
    } else if (item.id === 'RC-4') {
      generatedCode = `COFFEEPASS-${randomSuffix}`;
      discountAmount = 800;
      minSpend = 1999;
    }

    try {
      createCoupon({
        code: generatedCode,
        title: item.title,
        description: `Unlocked using ${costNumber.toLocaleString()} Mytri Coins loyalty redemption.`,
        discountType,
        discountAmount,
        minSpend,
        maxDiscount: discountAmount,
        expiresAt: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
        category: 'vip',
        tag: 'COIN REWARD',
        terms: `Redeemed with loyalty coins. Requires minimum order value of ₹${minSpend}.`
      });

      setRedemptionSuccessModal({
        title: 'Reward Redeemed Successfully!',
        subtitle: `You have successfully redeemed ${item.title}.`,
        voucherCode: generatedCode,
        discountText: discountType === 'shipping' ? 'Free Express Shipping' : `Flat ₹${discountAmount} OFF`,
        coinsDeducted: costNumber,
        remainingCoins: newBalance
      });

      toast.success("Reward Unlocked!", `${costNumber} coins redeemed. Voucher "${generatedCode}" generated.`);
    } catch (err) {
      toast.error("Redemption Error", err.message || "Failed to generate reward coupon.");
    }
  };

  const handleApplyNowAndGoToCart = async (code) => {
    const success = await applyCoupon(code);
    if (!success) return;
    setRedemptionSuccessModal(null);
    navigate('/cart');
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#FF811A] mb-1">
          <Award className="w-4 h-4 text-[#FA661C]" />
          <span>Loyalty &amp; VIP Privileges</span>
        </div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Rewards &amp; Plus Tier
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Loyalty points balance, VIP tier status privileges, and instant coin redemption catalogue
        </p>
      </div>

      {/* Hero Tier Card (Executive Gold-Emerald Vault Card) */}
      <div className="mt-8 bg-gradient-to-br from-[#124233] via-[#FA661C] to-[#0A2A1F] text-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#FF811A]/50 shadow-xl relative overflow-hidden card-interactive">
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF811A]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Points & Tier */}
          <div>
            <div className="flex items-center space-x-2 text-[#FF811A] mb-2">
              <Crown className="w-5 h-5 fill-current icon-interactive" />
              <span className="text-xs font-black uppercase tracking-widest">
                {tier} MEMBER
              </span>
            </div>

            <p className="text-xs text-[#FFFFFF]/75 uppercase tracking-wider">
              Available Mytri Coin Balance
            </p>
            <div className="font-['Outfit'] font-black text-4xl sm:text-5xl text-[#FF811A] tracking-tight mt-1 flex items-baseline space-x-2">
              <span>{coinsBalance.toLocaleString()}</span>
              <span className="text-base text-[#FFFFFF]/80 font-bold">Coins</span>
            </div>
            <p className="text-xs text-[#FFFFFF]/80 mt-1">
              Worth ₹{(coinsBalance / 2).toLocaleString()} in direct checkout discounts
            </p>
          </div>

          {/* Right: Tier Progress Bar */}
          <div className="bg-[#0A2A1F]/70 border border-[#FF811A]/30 p-4.5 rounded-2xl max-w-sm w-full backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-[#FFFFFF]">Next Tier: {nextTier}</span>
              <span className="text-[#FF811A]">{tierProgressPercent}% Complete</span>
            </div>

            {/* Progress Bar Line */}
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-[#FF811A]/30">
              <div 
                className="h-full bg-gradient-to-r from-[#FF811A] to-[#FFF2B2] rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${tierProgressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-[#FFFFFF]/70 mt-2">
              Earn <strong className="text-[#FF811A]">{pointsToNextTier} more coins</strong> to unlock free zero-minimum shipping and dedicated personal concierge.
            </p>
          </div>
        </div>
      </div>

      {/* Redemption Catalogue Cards */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C] flex items-center space-x-2">
            <Gift className="w-5 h-5 text-[#FF811A] icon-interactive" />
            <span>Redeem Coins for Rewards</span>
          </h3>
          <span className="text-xs text-[#6B6058]">
            Your Balance: <strong className="text-[#FA661C]">{coinsBalance.toLocaleString()} Coins</strong>
          </span>
        </div>

        {(!MOCK_REWARDS.redemptionCatalogue || MOCK_REWARDS.redemptionCatalogue.length === 0) ? (
          <div className="p-8 sm:p-10 text-center rounded-2xl bg-[#FFF8F2] border border-[#EAE3DC] space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <h4 className="font-['Outfit'] font-bold text-base text-[#1A2420]">
              No Active Redemption Rewards
            </h4>
            <p className="text-xs text-[#6B6058] max-w-sm mx-auto">
              There are currently no active loyalty rewards available for coin redemption. New marketplace vouchers and brand passes will appear here when active campaigns launch.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MOCK_REWARDS.redemptionCatalogue.map((item) => {
              const costMatch = item.cost.match(/\d[\d,]*/);
              const costNumber = costMatch ? parseInt(costMatch[0].replace(/,/g, ''), 10) : 500;
              const canAfford = coinsBalance >= costNumber;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-[#EAE3DC] hover:border-[#FF811A] bg-white flex flex-col justify-between transition-all shadow-2xs hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#FA661C] bg-[#FFF3EC] px-2.5 py-0.5 rounded-full border border-[#FA661C]/20">
                        {item.tag}
                      </span>
                      <span className="text-[11px] font-bold text-[#6B6058] flex items-center space-x-1">
                        <Coins className="w-3.5 h-3.5 text-[#FF811A]" />
                        <span>{item.cost}</span>
                      </span>
                    </div>

                    <h4 className="font-['Outfit'] font-black text-base text-[#1A2420] mt-3">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#6B6058] mt-1">
                      Instant discount voucher added directly to your account vouchers upon redemption.
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#EAE3DC]">
                    <span className={`text-[11px] font-bold ${
                      canAfford ? 'text-emerald-700' : 'text-gray-400'
                    }`}>
                      {canAfford ? '✓ Ready to redeem' : `Need ${(costNumber - coinsBalance).toLocaleString()} more coins`}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRedeemReward(item)}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                        canAfford
                          ? 'bg-[#FA661C] hover:bg-[#E0530B] text-white btn-interactive'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Redeem Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Referral Program Card */}
      <div className="mt-8 p-6 rounded-2xl bg-[#FFF8F2]/60 border border-[#FF811A]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-interactive">
        <div>
          <h4 className="font-['Outfit'] font-bold text-base text-[#FA661C] flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-[#FF811A] icon-interactive" />
            <span>Refer a Friend &amp; Earn 500 Coins</span>
          </h4>
          <p className="text-xs text-[#6B6058] mt-1 max-w-md">
            Give your friends ₹250 off their first order and earn 500 Mytri Coins when they complete their purchase.
          </p>
        </div>

        {/* Code Copier */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="px-4 py-2 bg-white border border-[#EAE3DC] rounded-xl font-mono font-bold text-xs text-[#FA661C] shadow-2xs">
            {referralCode}
          </div>
          <button
            type="button"
            onClick={handleCopyReferral}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* SUCCESS REDEMPTION MODAL (Replacing native alert) */}
      {redemptionSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs animate-reveal">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] w-full max-w-md p-6 sm:p-7 shadow-2xl text-center space-y-4 animate-dropdown">
            
            <div className="w-14 h-14 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                SUCCESSFUL REDEMPTION
              </span>
              <h3 className="font-['Outfit'] font-black text-xl text-[#1A2420] mt-2">
                {redemptionSuccessModal.title}
              </h3>
              <p className="text-xs text-[#6B6058] mt-1">
                {redemptionSuccessModal.subtitle}
              </p>
            </div>

            {/* Generated Voucher Ribbon */}
            <div className="p-4 bg-[#FFF8F2] rounded-2xl border border-dashed border-[#FF811A]/80 space-y-2">
              <div className="text-[11px] text-[#6B6058] font-bold">
                Your Exclusive Voucher Code:
              </div>
              <div className="font-mono font-black text-lg text-[#FA661C] tracking-widest bg-white py-1.5 px-3 rounded-xl border border-[#FF811A]/30">
                {redemptionSuccessModal.voucherCode}
              </div>
              <div className="text-xs font-bold text-emerald-700">
                {redemptionSuccessModal.discountText}
              </div>
            </div>

            {/* Coins Balance Breakdown */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl text-xs text-[#6B6058]">
              <span>Coins Deducted: <strong className="text-[#FA661C]">-{redemptionSuccessModal.coinsDeducted}</strong></span>
              <span>New Balance: <strong className="text-[#1A2420]">{redemptionSuccessModal.remainingCoins.toLocaleString()} Coins</strong></span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRedemptionSuccessModal(null)}
                className="w-full py-2.5 border border-[#EAE3DC] text-[#6B6058] hover:text-[#FA661C] rounded-xl text-xs font-bold cursor-pointer"
              >
                Close &amp; Keep Browsing
              </button>
              <button
                type="button"
                onClick={() => handleApplyNowAndGoToCart(redemptionSuccessModal.voucherCode)}
                className="w-full py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-extrabold shadow-sm btn-interactive flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Apply &amp; Go to Cart</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
