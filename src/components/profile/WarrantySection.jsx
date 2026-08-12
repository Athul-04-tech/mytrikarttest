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
import { MOCK_WARRANTIES } from '../../data/profileMockData';

export default function WarrantySection() {
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
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#D8E0DC]">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Warranty & Claims
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Registered product warranties, digital protection certificates, and authorized service centers
        </p>
      </div>

      {/* Product Warranties Stream */}
      <div className="mt-8 space-y-6">
        {MOCK_WARRANTIES.map((war) => (
          <div
            key={war.id}
            className="border border-[#D8E0DC] rounded-2xl overflow-hidden bg-[#FBF8F1]/40 hover:border-[#D4AF37] transition-colors p-5 sm:p-6"
          >
            {/* Top Product Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8E0DC]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold bg-[#E8F2EE] text-[#0F3D2E] px-2 py-0.5 rounded border border-[#0F3D2E]/20">
                    Warranty Reg: {war.id}
                  </span>
                  <span className="text-[10px] font-bold bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37] px-2 py-0.5 rounded flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                    <span>{war.status}</span>
                  </span>
                </div>

                <h3 className="font-['Outfit'] font-extrabold text-base sm:text-lg text-[#0F3D2E] mt-1.5">
                  {war.productName}
                </h3>
                <p className="text-xs text-[#5C6B63] font-mono">
                  Serial Number: <strong className="text-[#0F3D2E]">{war.serialNumber}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCertModalProduct(war)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#0F3D2E] bg-white border border-[#D8E0DC] hover:border-[#0F3D2E] transition-all flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClaimModalProduct(war)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#FBF8F1] bg-[#0F3D2E] hover:bg-[#155440] transition-all flex items-center space-x-1.5 shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Claim Warranty</span>
                </button>
              </div>
            </div>

            {/* Middle Specs & Service Center Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4 text-xs">
              {/* Warranty Coverage */}
              <div className="space-y-1.5">
                <p className="text-[#5C6B63]">
                  Purchase Date: <strong className="text-[#0F3D2E]">{war.purchaseDate}</strong>
                </p>
                <p className="text-[#5C6B63]">
                  Valid Until: <strong className="text-[#0F3D2E]">{war.warrantyExpiry}</strong>
                </p>
                <p className="text-[#5C6B63]">
                  Coverage: <strong className="text-[#0F3D2E]">{war.coverage}</strong>
                </p>
              </div>

              {/* Service Center Contact Card */}
              <div className="bg-white p-3.5 rounded-xl border border-[#D8E0DC] space-y-1 text-[11px]">
                <h5 className="font-bold text-xs text-[#0F3D2E] flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Authorized Service Center</span>
                </h5>
                <p className="text-[#5C6B63]">{war.serviceCenter.name}</p>
                <p className="text-[#5C6B63]">{war.serviceCenter.address}</p>
                <p className="text-[#0F3D2E] font-bold pt-0.5">
                  Toll-Free: {war.serviceCenter.phone} ({war.serviceCenter.timings})
                </p>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Claim Warranty Modal */}
      {claimModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FBF8F1] border border-[#D4AF37]/40 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-dropdown">
            
            <div className="bg-gradient-to-r from-[#0F3D2E] to-[#155440] p-4 text-[#FBF8F1] flex items-center justify-between">
              <h3 className="font-['Outfit'] font-bold text-base text-[#FBF8F1] flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
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
                  <CheckCircle2 className="w-12 h-12 text-[#0F3D2E] mx-auto" />
                  <h4 className="font-bold text-base text-[#0F3D2E]">Claim Registered Successfully!</h4>
                  <p className="text-xs text-[#5C6B63]">
                    Service Ticket #CLM-99214 generated. Our authorized repair technician will contact you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
                  <p className="text-[#5C6B63]">
                    Claiming service for: <strong className="text-[#0F3D2E]">{claimModalProduct.productName}</strong>
                  </p>

                  <div>
                    <label className="block font-bold text-[#0F3D2E] mb-1">Issue Description</label>
                    <textarea
                      rows={3}
                      required
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="Describe the hardware defect or malfunction in detail..."
                      className="w-full p-3 bg-white border border-[#D8E0DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20"
                    />
                  </div>

                  {/* Document Upload UI */}
                  <div>
                    <label className="block font-bold text-[#0F3D2E] mb-1">Upload Defect Video / Invoice Copy (Optional)</label>
                    <div className="p-4 border-2 border-dashed border-[#D8E0DC] rounded-2xl text-center bg-white hover:border-[#0F3D2E] transition-colors cursor-pointer">
                      <Upload className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                      <span className="font-bold text-[#0F3D2E]">Choose file or drag here</span>
                      <p className="text-[10px] text-[#5C6B63]">PDF, PNG or MP4 under 25MB</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setClaimModalProduct(null)}
                      className="flex-1 py-2.5 bg-white border border-[#D8E0DC] text-[#5C6B63] rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl font-bold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FBF8F1] border-2 border-[#D4AF37] rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-dropdown">
            <div className="w-12 h-12 rounded-full bg-[#0F3D2E] text-[#D4AF37] flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-['Outfit'] text-xl font-black text-[#0F3D2E]">
              Digital Warranty Certificate
            </h3>
            <div className="bg-white p-4 rounded-2xl border border-[#D8E0DC] text-left text-xs space-y-1.5">
              <p>Product: <strong className="text-[#0F3D2E]">{certModalProduct.productName}</strong></p>
              <p>Serial Number: <strong className="text-[#0F3D2E]">{certModalProduct.serialNumber}</strong></p>
              <p>Certified Period: <strong className="text-[#0F3D2E]">{certModalProduct.warrantyExpiry}</strong></p>
              <p>Status: <span className="text-[#0F3D2E] font-bold bg-[#E8F2EE] px-1.5 py-0.5 rounded">AUTHENTIC</span></p>
            </div>
            <button
              type="button"
              onClick={() => setCertModalProduct(null)}
              className="w-full py-2.5 bg-[#0F3D2E] text-[#FBF8F1] font-bold text-xs rounded-xl"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
