import React, { useState } from 'react';
import { 
  Crown, 
  Sparkles, 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  ArrowRight, 
  Cake, 
  Coins, 
  Zap 
} from 'lucide-react';
import { MOCK_REWARDS } from '../../data/profileMockData';

export default function RewardsSection() {
  const [copied, setCopied] = useState(false);

  const handleCopyReferral = () => {
    navigator.clipboard?.writeText(MOCK_REWARDS.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#EAE3DC]">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Rewards & Plus Tier
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Loyalty points balance, VIP tier status privileges, and exclusive redemption catalog
        </p>
      </div>

      {/* Hero Tier Card (Executive Gold-Emerald Vault Card) with Micro-Interaction */}
      <div className="mt-8 bg-gradient-to-br from-[#124233] via-[#FA661C] to-[#0A2A1F] text-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#FF811A]/50 shadow-xl relative overflow-hidden card-interactive">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF811A]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Points & Tier */}
          <div>
            <div className="flex items-center space-x-2 text-[#FF811A] mb-2">
              <Crown className="w-5 h-5 fill-current icon-interactive" />
              <span className="text-xs font-black uppercase tracking-widest">
                {MOCK_REWARDS.tier} MEMBER
              </span>
            </div>

            <p className="text-xs text-[#FFFFFF]/75 uppercase tracking-wider">
              Available Mytri Coin Balance
            </p>
            <div className="font-['Outfit'] font-black text-4xl sm:text-5xl text-[#FF811A] tracking-tight mt-1 flex items-baseline space-x-2">
              <span>{MOCK_REWARDS.currentPoints.toLocaleString()}</span>
              <span className="text-base text-[#FFFFFF]/80 font-bold">Coins</span>
            </div>
            <p className="text-xs text-[#FFFFFF]/80 mt-1">
              Worth ₹{(MOCK_REWARDS.currentPoints / 2).toLocaleString()} in direct checkout discounts
            </p>
          </div>

          {/* Right: Tier Progress Bar */}
          <div className="bg-[#0A2A1F]/70 border border-[#FF811A]/30 p-4.5 rounded-2xl max-w-sm w-full backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-[#FFFFFF]">Next Tier: {MOCK_REWARDS.nextTier}</span>
              <span className="text-[#FF811A]">{MOCK_REWARDS.tierProgressPercent}% Complete</span>
            </div>

            {/* Progress Bar Line */}
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-[#FF811A]/30">
              <div 
                className="h-full bg-gradient-to-r from-[#FF811A] to-[#FFF2B2] rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${MOCK_REWARDS.tierProgressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-[#FFFFFF]/70 mt-2">
              Earn <strong className="text-[#FF811A]">{MOCK_REWARDS.pointsToNextTier} more coins</strong> to unlock free zero-minimum shipping and dedicated personal concierge.
            </p>
          </div>
        </div>
      </div>

      {/* Birthday Reward Spotlight */}
      {MOCK_REWARDS.birthdayGiftUnlocked && (
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFF8F2] to-[#F9F6F0] border border-[#FF811A] flex items-center justify-between gap-4 card-interactive">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-[#FA661C] text-[#FF811A] icon-interactive">
              <Cake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase bg-[#FA661C] text-[#FF811A] px-2 py-0.5 rounded">
                BIRTHDAY PRIVILEGE
              </span>
              <h4 className="font-['Outfit'] font-bold text-sm sm:text-base text-[#FA661C] mt-1">
                Your ₹1,000 Birthday Celebration Voucher is Ready!
              </h4>
              <p className="text-xs text-[#6B6058]">
                Valid for your birthday month across fashion and luxury home categories.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert("Claimed Birthday Reward! Added ₹1,000 voucher to your cart.")}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold shrink-0 btn-interactive shadow-xs cursor-pointer"
          >
            Claim Gift
          </button>
        </div>
      )}

      {/* Redemption Catalogue Cards */}
      <div className="mt-10">
        <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C] mb-4 flex items-center space-x-2">
          <Gift className="w-5 h-5 text-[#FF811A] icon-interactive" />
          <span>Redeem Coins for Rewards</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MOCK_REWARDS.redemptionCatalogue.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-[#EAE3DC] hover:border-[#FF811A] bg-[#FFFFFF]/40 flex flex-col justify-between transition-all card-interactive cursor-pointer"
            >
              <div>
                <span className="text-[10px] font-bold text-[#FA661C] bg-[#FFF3EC] px-2 py-0.5 rounded">
                  {item.tag}
                </span>
                <h4 className="font-bold text-sm text-[#FA661C] mt-2">
                  {item.title}
                </h4>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#EAE3DC]">
                <span className="font-extrabold text-xs text-[#FA661C] flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5 text-[#FF811A] icon-interactive" />
                  <span>{item.cost}</span>
                </span>
                <button
                  type="button"
                  onClick={() => alert(`Redeemed ${item.title}!`)}
                  className="px-3 py-1 bg-[#FA661C] text-[#FFFFFF] rounded-lg text-xs font-bold btn-interactive"
                >
                  Redeem Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Program Card */}
      <div className="mt-8 p-6 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-interactive">
        <div>
          <h4 className="font-['Outfit'] font-bold text-base text-[#FA661C] flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-[#FF811A] icon-interactive" />
            <span>Refer a Friend & Earn 500 Coins</span>
          </h4>
          <p className="text-xs text-[#6B6058] mt-1 max-w-md">
            Give your friends ₹250 off their first order and earn 500 Mytri Coins when they complete their purchase.
          </p>
        </div>

        {/* Code Copier */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="px-4 py-2 bg-white border border-[#EAE3DC] rounded-xl font-mono font-bold text-xs text-[#FA661C]">
            {MOCK_REWARDS.referralCode}
          </div>
          <button
            type="button"
            onClick={handleCopyReferral}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#FF811A]" /> : <Copy className="w-4 h-4 text-[#FF811A] icon-interactive" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
