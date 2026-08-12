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
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#D8E0DC]">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Rewards & Plus Tier
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Loyalty points balance, VIP tier status privileges, and exclusive redemption catalog
        </p>
      </div>

      {/* Hero Tier Card (Executive Gold-Emerald Vault Card) with Micro-Interaction */}
      <div className="mt-8 bg-gradient-to-br from-[#124233] via-[#0F3D2E] to-[#0A2A1F] text-[#FBF8F1] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/50 shadow-xl relative overflow-hidden card-interactive">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Points & Tier */}
          <div>
            <div className="flex items-center space-x-2 text-[#D4AF37] mb-2">
              <Crown className="w-5 h-5 fill-current icon-interactive" />
              <span className="text-xs font-black uppercase tracking-widest">
                {MOCK_REWARDS.tier} MEMBER
              </span>
            </div>

            <p className="text-xs text-[#FBF8F1]/75 uppercase tracking-wider">
              Available Mytri Coin Balance
            </p>
            <div className="font-['Outfit'] font-black text-4xl sm:text-5xl text-[#D4AF37] tracking-tight mt-1 flex items-baseline space-x-2">
              <span>{MOCK_REWARDS.currentPoints.toLocaleString()}</span>
              <span className="text-base text-[#FBF8F1]/80 font-bold">Coins</span>
            </div>
            <p className="text-xs text-[#FBF8F1]/80 mt-1">
              Worth ₹{(MOCK_REWARDS.currentPoints / 2).toLocaleString()} in direct checkout discounts
            </p>
          </div>

          {/* Right: Tier Progress Bar */}
          <div className="bg-[#0A2A1F]/70 border border-[#D4AF37]/30 p-4.5 rounded-2xl max-w-sm w-full backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-[#FBF8F1]">Next Tier: {MOCK_REWARDS.nextTier}</span>
              <span className="text-[#D4AF37]">{MOCK_REWARDS.tierProgressPercent}% Complete</span>
            </div>

            {/* Progress Bar Line */}
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-[#D4AF37]/30">
              <div 
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFF2B2] rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${MOCK_REWARDS.tierProgressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-[#FBF8F1]/70 mt-2">
              Earn <strong className="text-[#D4AF37]">{MOCK_REWARDS.pointsToNextTier} more coins</strong> to unlock free zero-minimum shipping and dedicated personal concierge.
            </p>
          </div>
        </div>
      </div>

      {/* Birthday Reward Spotlight */}
      {MOCK_REWARDS.birthdayGiftUnlocked && (
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FCF7E8] to-[#F4EFE6] border border-[#D4AF37] flex items-center justify-between gap-4 card-interactive">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-[#0F3D2E] text-[#D4AF37] icon-interactive">
              <Cake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase bg-[#0F3D2E] text-[#D4AF37] px-2 py-0.5 rounded">
                BIRTHDAY PRIVILEGE
              </span>
              <h4 className="font-['Outfit'] font-bold text-sm sm:text-base text-[#0F3D2E] mt-1">
                Your ₹1,000 Birthday Celebration Voucher is Ready!
              </h4>
              <p className="text-xs text-[#5C6B63]">
                Valid for your birthday month across fashion and luxury home categories.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert("Claimed Birthday Reward! Added ₹1,000 voucher to your cart.")}
            className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold shrink-0 btn-interactive shadow-xs cursor-pointer"
          >
            Claim Gift
          </button>
        </div>
      )}

      {/* Redemption Catalogue Cards */}
      <div className="mt-10">
        <h3 className="font-['Outfit'] font-extrabold text-lg text-[#0F3D2E] mb-4 flex items-center space-x-2">
          <Gift className="w-5 h-5 text-[#D4AF37] icon-interactive" />
          <span>Redeem Coins for Rewards</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MOCK_REWARDS.redemptionCatalogue.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-[#D8E0DC] hover:border-[#D4AF37] bg-[#FBF8F1]/40 flex flex-col justify-between transition-all card-interactive cursor-pointer"
            >
              <div>
                <span className="text-[10px] font-bold text-[#0F3D2E] bg-[#E8F2EE] px-2 py-0.5 rounded">
                  {item.tag}
                </span>
                <h4 className="font-bold text-sm text-[#0F3D2E] mt-2">
                  {item.title}
                </h4>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#D8E0DC]">
                <span className="font-extrabold text-xs text-[#0F3D2E] flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5 text-[#D4AF37] icon-interactive" />
                  <span>{item.cost}</span>
                </span>
                <button
                  type="button"
                  onClick={() => alert(`Redeemed ${item.title}!`)}
                  className="px-3 py-1 bg-[#0F3D2E] text-[#FBF8F1] rounded-lg text-xs font-bold btn-interactive"
                >
                  Redeem Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Program Card */}
      <div className="mt-8 p-6 rounded-2xl bg-[#FBF8F1] border border-[#D8E0DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-interactive">
        <div>
          <h4 className="font-['Outfit'] font-bold text-base text-[#0F3D2E] flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-[#D4AF37] icon-interactive" />
            <span>Refer a Friend & Earn 500 Coins</span>
          </h4>
          <p className="text-xs text-[#5C6B63] mt-1 max-w-md">
            Give your friends ₹250 off their first order and earn 500 Mytri Coins when they complete their purchase.
          </p>
        </div>

        {/* Code Copier */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="px-4 py-2 bg-white border border-[#D8E0DC] rounded-xl font-mono font-bold text-xs text-[#0F3D2E]">
            {MOCK_REWARDS.referralCode}
          </div>
          <button
            type="button"
            onClick={handleCopyReferral}
            className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#D4AF37]" /> : <Copy className="w-4 h-4 text-[#D4AF37] icon-interactive" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
