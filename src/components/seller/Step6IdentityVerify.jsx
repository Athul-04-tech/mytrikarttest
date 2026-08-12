import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  Check, 
  RotateCcw, 
  Info, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Camera, 
  FileCheck2, 
  Lock 
} from 'lucide-react';

const REQUIRED_DOCUMENTS = [
  { id: 'aadhaar', label: 'Aadhaar / National Identity Card', desc: 'Front & back scan (PDF/JPG)', required: true },
  { id: 'passport', label: 'Passport (First & Last Page)', desc: 'Valid international travel passport', required: false },
  { id: 'drivingLicense', label: 'Driving License', desc: 'Government issued photo license', required: false },
  { id: 'gstCert', label: 'GST / VAT Registration Certificate', desc: 'Form GST REG-06 or regional equivalent', required: true },
  { id: 'businessLicense', label: 'Business License / Certificate of Inc.', desc: 'Incorporation deed, Udyam, or trade license', required: true },
  { id: 'selfieId', label: 'Live Selfie holding National ID', desc: 'Clear facial portrait with document visible', required: true, isPhoto: true },
  { id: 'addressProof', label: 'Commercial Address Proof', desc: 'Electricity bill, rent agreement, or bank statement', required: true }
];

export default function Step6IdentityVerify({ formData, updateFormData, onNext, onBack }) {
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [errors, setErrors] = useState({});

  const uploadedDocs = formData.uploadedDocuments || {};

  const handleSimulateUpload = (docId) => {
    setUploadingDocId(docId);
    setTimeout(() => {
      setUploadingDocId(null);
      const newDocs = {
        ...uploadedDocs,
        [docId]: {
          fileName: `${docId}_verified_doc.pdf`,
          fileSize: '1.4 MB',
          uploadedAt: 'Just now'
        }
      };
      updateFormData({ uploadedDocuments: newDocs });
    }, 600);
  };

  const handleRemoveDoc = (docId) => {
    const newDocs = { ...uploadedDocs };
    delete newDocs[docId];
    updateFormData({ uploadedDocuments: newDocs });
  };

  const validate = () => {
    const errs = {};
    const mandatoryList = REQUIRED_DOCUMENTS.filter(d => d.required);
    const missing = mandatoryList.filter(d => !uploadedDocs[d.id]);
    
    if (missing.length > 0) {
      errs.docs = `Please upload the ${missing.length} mandatory documents marked with *`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleContinue} className="space-y-6 animate-reveal">
      
      {/* Step Header */}
      <div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Identity & Compliance Verification
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Upload regulatory proof of identity, tax registration, and physical business operations
        </p>
      </div>

      {/* Business Plan / Tier Info Banner */}
      <div className="p-4 rounded-2xl bg-[#FCF7E8] border border-[#D4AF37] flex items-start space-x-3 text-xs text-[#0F3D2E]">
        <Info className="w-5 h-5 text-[#0F3D2E] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Business Plan & Tier Verification Requirement</span>
          <p className="text-[11px] text-[#5C6B63] mt-0.5 leading-relaxed">
            Per marketplace governance standards, document requirements may vary based on your declared annual revenue tier and product category liability. All files are permanently encrypted and accessible only to certified compliance officers.
          </p>
        </div>
      </div>

      {errors.docs && (
        <div className="p-3 bg-[#FDEDEC] text-[#C0392B] border border-[#C0392B]/30 rounded-xl text-xs font-bold animate-dropdown">
          {errors.docs}
        </div>
      )}

      {/* 7 Document Upload Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const isUploaded = !!uploadedDocs[doc.id];
          const isCurrentlyUploading = uploadingDocId === doc.id;

          return (
            <div
              key={doc.id}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between ${
                isUploaded
                  ? 'bg-[#E8F2EE]/50 border-[#0F3D2E] shadow-2xs'
                  : 'bg-white border-[#D8E0DC] hover:border-[#5C6B63]/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${isUploaded ? 'bg-[#0F3D2E] text-[#D4AF37]' : 'bg-[#FBF8F1] text-[#5C6B63]'}`}>
                      {doc.isPhoto ? <Camera className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#0F3D2E]">
                      {doc.label} {doc.required && <span className="text-[#C0392B]">*</span>}
                    </h4>
                  </div>

                  {isUploaded && (
                    <span className="text-[10px] font-extrabold text-[#0F3D2E] bg-[#E8F2EE] px-2 py-0.5 rounded-full flex items-center space-x-1 border border-[#0F3D2E]/20 animate-badge-pop">
                      <Check className="w-3 h-3 text-[#D4AF37]" />
                      <span>Ready</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#5C6B63] mt-1.5 ml-8">
                  {doc.desc}
                </p>
              </div>

              {/* Upload Action / Uploaded State Tray */}
              <div className="mt-4 pt-3 border-t border-[#D8E0DC]/60 flex items-center justify-between">
                {isUploaded ? (
                  <>
                    <div className="flex items-center space-x-1.5 text-[11px] text-[#0F3D2E] font-medium truncate max-w-[200px]">
                      <FileCheck2 className="w-3.5 h-3.5 text-[#0F3D2E] shrink-0" />
                      <span className="truncate">{uploadedDocs[doc.id].fileName}</span>
                      <span className="text-[#5C6B63] text-[10px]">({uploadedDocs[doc.id].fileSize})</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="text-[11px] font-bold text-[#C0392B] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Re-upload</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isCurrentlyUploading}
                    onClick={() => handleSimulateUpload(doc.id)}
                    className="w-full py-2 px-3 bg-[#FBF8F1] hover:bg-[#FCF7E8] text-[#0F3D2E] border border-[#D8E0DC] hover:border-[#D4AF37] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {isCurrentlyUploading ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-[#0F3D2E] border-t-transparent rounded-full animate-spin" />
                        <span>Uploading & Encrypting...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37] icon-interactive" />
                        <span>Upload File (PDF / JPG)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#D8E0DC]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-xs font-bold text-[#5C6B63] bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] btn-interactive flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 icon-interactive" />
          <span>Back: Payout Setup</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-xs font-bold text-[#FBF8F1] bg-[#0F3D2E] hover:bg-[#155440] btn-interactive flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <span>Continue to Final Agreement</span>
          <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
        </button>
      </div>

    </form>
  );
}
