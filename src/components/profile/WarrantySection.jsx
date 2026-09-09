import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  MapPin, 
  Phone, 
  Upload, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

export default function WarrantySection({ warranties = [] }) {
  const [claimModalProduct, setClaimModalProduct] = useState(null);
  const [certModalProduct, setCertModalProduct] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [claimSuccess, setClaimSuccess] = useState(false);

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    setClaimSuccess(true);
    setTimeout(() => {
      setClaimSuccess(false);
      setClaimModalProduct(null);
      setIssueDescription('');
    }, 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#EAE3DC]">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Warranty & Claims
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Registered product warranties, digital protection certificates, and authorized service centers
        </p>
      </div>

      {/* Product Warranties Stream / Empty State */}
      <div className="mt-8 space-y-6">
        {warranties.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#FFFFFF]/40 border border-dashed border-[#EAE3DC] rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <ShieldCheck className="w-8 h-8 text-[#FA661C]" />
            </div>
            <h3 className="font-['Outfit'] text-lg font-bold text-[#FA661C]">No Registered Warranties</h3>
            <p className="text-xs text-[#6B6058] max-w-sm mx-auto mt-1">
              Brand warranty coverage and digital protection certificates for your eligible purchases will be listed here.
            </p>
          </div>
        ) : (
          warranties.map((war) => (
          <div
            key={war.id}
            className="border border-[#EAE3DC] rounded-2xl overflow-hidden bg-[#FFFFFF]/40 hover:border-[#FF811A] transition-colors p-5 sm:p-6"
          >
            {/* Top Product Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold bg-[#FFF3EC] text-[#FA661C] px-2 py-0.5 rounded border border-[#FA661C]/20">
                    Warranty Reg: {war.id}
                  </span>
                  <span className="text-[10px] font-bold bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A] px-2 py-0.5 rounded flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-[#FF811A]" />
                    <span>{war.status}</span>
                  </span>
                </div>

                <h3 className="font-['Outfit'] font-extrabold text-base sm:text-lg text-[#FA661C] mt-1.5">
                  {war.productName}
                </h3>
                <p className="text-xs text-[#6B6058] font-mono">
                  Serial Number: <strong className="text-[#FA661C]">{war.serialNumber}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCertModalProduct(war)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#FA661C] bg-white border border-[#EAE3DC] hover:border-[#FA661C] transition-all flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#FF811A]" />
                  <span>Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClaimModalProduct(war)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] transition-all flex items-center space-x-1.5 shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF811A]" />
                  <span>Claim Warranty</span>
                </button>
              </div>
            </div>

            {/* Middle Specs & Service Center Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4 text-xs">
              {/* Warranty Coverage */}
              <div className="space-y-1.5">
                <p className="text-[#6B6058]">
                  Purchase Date: <strong className="text-[#FA661C]">{war.purchaseDate}</strong>
                </p>
                <p className="text-[#6B6058]">
                  Valid Until: <strong className="text-[#FA661C]">{war.warrantyExpiry}</strong>
                </p>
                <p className="text-[#6B6058]">
                  Coverage: <strong className="text-[#FA661C]">{war.coverage}</strong>
                </p>
              </div>

              {/* Service Center Contact Card */}
              <div className="bg-white p-3.5 rounded-xl border border-[#EAE3DC] space-y-1 text-[11px]">
                <h5 className="font-bold text-xs text-[#FA661C] flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FF811A]" />
                  <span>Authorized Service Center</span>
                </h5>
                <p className="text-[#6B6058]">{war.serviceCenter.name}</p>
                <p className="text-[#6B6058]">{war.serviceCenter.address}</p>
                <p className="text-[#FA661C] font-bold pt-0.5">
                  Toll-Free: {war.serviceCenter.phone} ({war.serviceCenter.timings})
                </p>
              </div>
            </div>

          </div>
        )))}
      </div>

      {/* Claim Warranty Modal */}
      {claimModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FFFFFF] border border-[#FF811A]/40 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-dropdown">
            
            <div className="bg-gradient-to-r from-[#FA661C] to-[#E0530B] p-4 text-[#FFFFFF] flex items-center justify-between">
              <h3 className="font-['Outfit'] font-bold text-base text-[#FFFFFF] flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#FF811A]" />
                <span>Submit Warranty Claim</span>
              </h3>
              <button
                type="button"
                onClick={() => setClaimModalProduct(null)}
                className="p-1 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {claimSuccess ? (
                <div className="text-center py-6 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-[#FA661C] mx-auto" />
                  <h4 className="font-bold text-base text-[#FA661C]">Claim Registered Successfully!</h4>
                  <p className="text-xs text-[#6B6058]">
                    Service Ticket #CLM-99214 generated. Our authorized repair technician will contact you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
                  <p className="text-[#6B6058]">
                    Claiming service for: <strong className="text-[#FA661C]">{claimModalProduct.productName}</strong>
                  </p>

                  <div>
                    <label className="block font-bold text-[#FA661C] mb-1">Issue Description</label>
                    <textarea
                      rows={3}
                      required
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="Describe the hardware defect or malfunction in detail..."
                      className="w-full p-3 bg-white border border-[#EAE3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FA661C]/20"
                    />
                  </div>

                  {/* Document Upload UI */}
                  <div>
                    <label className="block font-bold text-[#FA661C] mb-1">Upload Defect Video / Invoice Copy (Optional)</label>
                    <div className="p-4 border-2 border-dashed border-[#EAE3DC] rounded-2xl text-center bg-white hover:border-[#FA661C] transition-colors cursor-pointer">
                      <Upload className="w-6 h-6 text-[#FF811A] mx-auto mb-1" />
                      <span className="font-bold text-[#FA661C]">Choose file or drag here</span>
                      <p className="text-[10px] text-[#6B6058]">PDF, PNG or MP4 under 25MB</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setClaimModalProduct(null)}
                      className="flex-1 py-2.5 bg-white border border-[#EAE3DC] text-[#6B6058] rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl font-bold"
                    >
                      Submit Claim
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* View Certificate Popover */}
      {certModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FFFFFF] border-2 border-[#FF811A] rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-dropdown">
            <div className="w-12 h-12 rounded-full bg-[#FA661C] text-[#FF811A] flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-['Outfit'] text-xl font-black text-[#FA661C]">
              Digital Warranty Certificate
            </h3>
            <div className="bg-white p-4 rounded-2xl border border-[#EAE3DC] text-left text-xs space-y-1.5">
              <p>Product: <strong className="text-[#FA661C]">{certModalProduct.productName}</strong></p>
              <p>Serial Number: <strong className="text-[#FA661C]">{certModalProduct.serialNumber}</strong></p>
              <p>Certified Period: <strong className="text-[#FA661C]">{certModalProduct.warrantyExpiry}</strong></p>
              <p>Status: <span className="text-[#FA661C] font-bold bg-[#FFF3EC] px-1.5 py-0.5 rounded">AUTHENTIC</span></p>
            </div>
            <button
              type="button"
              onClick={() => setCertModalProduct(null)}
              className="w-full py-2.5 bg-[#FA661C] text-[#FFFFFF] font-bold text-xs rounded-xl"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
