import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  Check, 
  RotateCcw, 
  Info, 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  FileCheck2,
  AlertCircle
} from 'lucide-react';

const REQUIRED_DOCUMENTS = [
  { id: 'aadhaar', label: 'Aadhaar / National Identity Card', desc: 'Front & back scan (PDF/JPG)', required: true },
  { id: 'passport', label: 'Passport (First & Last Page)', desc: 'Valid international travel passport', required: false },
  { id: 'driving_license', label: 'Driving License', desc: 'Government issued photo license', required: false },
  { id: 'gst_certificate', label: 'GST / VAT Registration Certificate', desc: 'Form GST REG-06 or regional equivalent', required: true },
  { id: 'business_license', label: 'Business License / Certificate of Inc.', desc: 'Incorporation deed, Udyam, or trade license', required: true },
  { id: 'live_selfie', label: 'Live Selfie holding National ID', desc: 'Clear facial portrait with document visible', required: true, isPhoto: true },
  { id: 'address_proof', label: 'Commercial Address Proof', desc: 'Electricity bill, rent agreement, or bank statement', required: true }
];

export default function Step6IdentityVerify({ formData, updateFormData, onNext, onBack }) {
  const [errors, setErrors] = useState({});
  const fileInputRefs = useRef({});

  const uploadedDocs = formData.uploadedDocuments || {};

  const handleFileChange = (docId, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Calculate formatted size
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = `${sizeInMb} MB`;

    const updated = {
      ...uploadedDocs,
      [docId]: {
        fileName: file.name,
        fileSize: sizeStr,
        fileObj: file,
        status: 'done', // 'idle' | 'uploading' | 'done' | 'failed'
        errorMessage: null
      }
    };
    updateFormData({ uploadedDocuments: updated });
    setErrors(prev => ({ ...prev, docs: null }));
  };

  const handleTriggerFileInput = (docId) => {
    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId].click();
    }
  };

  const handleRemoveDoc = (docId) => {
    const newDocs = { ...uploadedDocs };
    delete newDocs[docId];
    updateFormData({ uploadedDocuments: newDocs });
    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId].value = '';
    }
  };

  const validate = () => {
    const errs = {};
    const mandatoryList = REQUIRED_DOCUMENTS.filter(d => d.required);
    const missing = mandatoryList.filter(d => !uploadedDocs[d.id]);
    const failedDocs = REQUIRED_DOCUMENTS.filter(d => uploadedDocs[d.id] && uploadedDocs[d.id].status === 'failed');
    
    if (missing.length > 0) {
      errs.docs = `Please select files for all ${missing.length} mandatory documents marked with *`;
    } else if (failedDocs.length > 0) {
      errs.docs = `Please retry or re-upload the failed document(s) before proceeding.`;
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
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Identity & Compliance Verification
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Upload regulatory proof of identity, tax registration, and physical business operations
        </p>
      </div>

      {/* Business Plan / Tier Info Banner */}
      <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FF811A] flex items-start space-x-3 text-xs text-[#FA661C]">
        <Info className="w-5 h-5 text-[#FA661C] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Business Plan & Tier Verification Requirement</span>
          <p className="text-[11px] text-[#6B6058] mt-0.5 leading-relaxed">
            Per marketplace governance standards, document requirements may vary based on your declared annual revenue tier and product category liability. All files are permanently encrypted and accessible only to certified compliance officers.
          </p>
        </div>
      </div>

      {errors.docs && (
        <div className="p-3 bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/30 rounded-xl text-xs font-bold animate-dropdown flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.docs}</span>
        </div>
      )}

      {/* 7 Document Upload Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const docData = uploadedDocs[doc.id];
          const isUploaded = Boolean(docData && docData.status !== 'failed');
          const isFailed = Boolean(docData && docData.status === 'failed');
          const isCurrentlyUploading = Boolean(docData && docData.status === 'uploading');

          return (
            <div
              key={doc.id}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between ${
                isFailed
                  ? 'bg-[#FDE8EA]/50 border-[#D7263D] shadow-2xs'
                  : isUploaded
                  ? 'bg-[#FFF3EC]/50 border-[#FA661C] shadow-2xs'
                  : 'bg-white border-[#EAE3DC] hover:border-[#6B6058]/60'
              }`}
            >
              <div>
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={(el) => (fileInputRefs.current[doc.id] = el)}
                  onChange={(e) => handleFileChange(doc.id, e)}
                  accept={doc.isPhoto ? "image/*" : "application/pdf,image/*"}
                  className="hidden"
                />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${isFailed ? 'bg-[#D7263D] text-white' : isUploaded ? 'bg-[#FA661C] text-[#FF811A]' : 'bg-[#FFFFFF] text-[#6B6058]'}`}>
                      {doc.isPhoto ? <Camera className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#FA661C]">
                      {doc.label} {doc.required && <span className="text-[#D7263D]">*</span>}
                    </h4>
                  </div>

                  {isUploaded && !isFailed && (
                    <span className="text-[10px] font-extrabold text-[#FA661C] bg-[#FFF3EC] px-2 py-0.5 rounded-full flex items-center space-x-1 border border-[#FA661C]/20 animate-badge-pop">
                      <Check className="w-3 h-3 text-[#FF811A]" />
                      <span>Selected</span>
                    </span>
                  )}
                  {isFailed && (
                    <span className="text-[10px] font-extrabold text-[#D7263D] bg-[#FDE8EA] px-2 py-0.5 rounded-full flex items-center space-x-1 border border-[#D7263D]/20">
                      <AlertCircle className="w-3 h-3 text-[#D7263D]" />
                      <span>Failed</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#6B6058] mt-1.5 ml-8">
                  {doc.desc}
                </p>

                {isFailed && docData.errorMessage && (
                  <p className="text-[10px] text-[#D7263D] font-bold mt-1 ml-8">
                    {docData.errorMessage}
                  </p>
                )}
              </div>

              {/* Upload Action / Uploaded State Tray */}
              <div className="mt-4 pt-3 border-t border-[#EAE3DC]/60 flex items-center justify-between">
                {isUploaded && !isFailed ? (
                  <>
                    <div className="flex items-center space-x-1.5 text-[11px] text-[#FA661C] font-medium truncate max-w-[200px]">
                      <FileCheck2 className="w-3.5 h-3.5 text-[#FA661C] shrink-0" />
                      <span className="truncate">{docData.fileName}</span>
                      <span className="text-[#6B6058] text-[10px]">({docData.fileSize})</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="text-[11px] font-bold text-[#D7263D] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Change</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isCurrentlyUploading}
                    onClick={() => handleTriggerFileInput(doc.id)}
                    className="w-full py-2 px-3 bg-[#FFFFFF] hover:bg-[#FFF8F2] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {isCurrentlyUploading ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-[#FA661C] border-t-transparent rounded-full animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5 text-[#FF811A] icon-interactive" />
                        <span>{isFailed ? 'Retry Upload' : 'Select File (PDF / Image)'}</span>
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
      <div className="flex items-center justify-between pt-6 border-t border-[#EAE3DC]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-xs font-bold text-[#6B6058] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 icon-interactive" />
          <span>Back: Payout Setup</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] btn-interactive flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <span>Continue to Final Agreement</span>
          <ArrowRight className="w-4 h-4 text-[#FF811A] icon-interactive" />
        </button>
      </div>

    </form>
  );
}
