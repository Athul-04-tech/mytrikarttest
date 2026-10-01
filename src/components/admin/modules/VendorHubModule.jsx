import React, { useState, useEffect } from 'react';
import { Store, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, X, FileText, Check, Ban, AlertTriangle, Eye, Building2, Globe, Mail, Phone } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

export default function VendorHubModule() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selected vendor for inspection/review modal
  const [selectedVendor, setSelectedVendor] = useState(null);
  
  // Decision Form State inside modal
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Per-document action loading state: { [docId]: boolean }
  const [docLoading, setDocLoading] = useState({});
  const [docRejectReason, setDocRejectReason] = useState({});
  const [rejectingDocId, setRejectingDocId] = useState(null);

  const toast = useToast();

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/vendors/admin/');
      setVendors(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error("Failed to fetch admin vendors list:", err);
      setError(err.data?.detail || err.message || "Failed to load merchant directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openReviewModal = (vendor) => {
    setSelectedVendor(vendor);
    setAction(vendor.onboarding_status === 'under_review' ? 'approve' : 'under_review');
    setReason(vendor.onboarding_review_reason || '');
    setFormError(null);
    setRejectingDocId(null);
  };

  const closeReviewModal = () => {
    setSelectedVendor(null);
    setFormError(null);
    setReason('');
    setRejectingDocId(null);
  };

  // 1. Submit Document Review (verify/reject individual document)
  const handleDocumentReview = async (docId, newStatus, rejectionReason = "") => {
    setDocLoading(prev => ({ ...prev, [docId]: true }));
    try {
      const payload = { status: newStatus };
      if (newStatus === 'rejected' && rejectionReason) {
        payload.rejection_reason = rejectionReason;
      }

      const updatedDoc = await apiRequest(`/api/vendors/documents/${docId}/review/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Update document in selectedVendor and vendors list
      const updateDocs = (docList) => (docList || []).map(d => d.id === docId ? updatedDoc : d);

      setSelectedVendor(prev => prev ? { ...prev, documents: updateDocs(prev.documents) } : null);
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, documents: updateDocs(v.documents) } : v));

      toast.success(
        newStatus === 'verified' ? "Document Verified" : "Document Rejected",
        `Document #${docId} status updated to ${newStatus}.`
      );
      setRejectingDocId(null);
    } catch (err) {
      console.error("Failed to review document:", err);
      const errMsg = err.data?.detail || err.message || "Failed to update document review status.";
      toast.error("Document Review Error", errMsg);
    } finally {
      setDocLoading(prev => ({ ...prev, [docId]: false }));
    }
  };

  // 2. Submit Vendor Onboarding Decision
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;

    if ((action === 'reject' || action === 'resubmit_required') && !reason.trim()) {
      setFormError("A reason is required when rejecting or requesting resubmission.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = { action, reason: reason.trim() };
      const updatedVendor = await apiRequest(`/api/vendors/${selectedVendor.id}/review/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Update vendors list and close modal
      setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
      toast.success("Merchant Review Updated", `Merchant ${updatedVendor.business_name || updatedVendor.store_name} onboarding status is now ${updatedVendor.onboarding_status}.`);
      closeReviewModal();
    } catch (err) {
      console.error("Failed to submit vendor review decision:", err);
      let errMsg = "Failed to update onboarding decision.";
      if (err.data) {
        if (typeof err.data === 'string') errMsg = err.data;
        else if (err.data.detail) errMsg = typeof err.data.detail === 'string' ? err.data.detail : JSON.stringify(err.data.detail);
        else if (err.data.reason) errMsg = Array.isArray(err.data.reason) ? err.data.reason[0] : err.data.reason;
        else if (err.data.action) errMsg = Array.isArray(err.data.action) ? err.data.action[0] : err.data.action;
      } else if (err.message) {
        errMsg = err.message;
      }
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingApprovalsCount = vendors.filter(v => ['registered', 'under_review', 'resubmit_required'].includes(v.onboarding_status)).length;

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
              <Store className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Vendor & Seller Governance Hub
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Merchant Governance: Registration Approvals, GSTIN/Tax ID Verification, KYC Document Verification & Onboarding Decisions.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <span className="text-xs font-bold text-[#FA661C] bg-[#FFF8F2] border border-[#FF811A]/50 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>{pendingApprovalsCount} Pending Governance Reviews</span>
          </span>

          <button
            type="button"
            onClick={fetchVendors}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] btn-interactive cursor-pointer disabled:opacity-50"
            title="Refresh Merchant List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Error Banner */}
      {error && (
        <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl flex items-start space-x-3 text-xs text-[#D7263D]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Error Loading Vendor Directory</div>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 3. Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 text-center animate-pulse text-xs text-[#6B6058]">
          Loading real merchant profiles and KYC documents from backend API...
        </div>
      )}

      {/* 4. Empty Directory State */}
      {!loading && !error && vendors.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-[#EAE3DC] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[#52B788]" />
          </div>
          <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
            No Merchant Profiles Registered
          </h3>
          <p className="text-xs text-[#6B6058] max-w-md mx-auto">
            No seller accounts have registered on the marketplace yet. Newly onboarded merchants will appear here for review.
          </p>
        </div>
      )}

      {/* 5. Real Vendor Table */}
      {!loading && !error && vendors.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Merchant & Store Name</th>
                  <th className="p-3">Jurisdiction & Tax ID</th>
                  <th className="p-3">Business Type</th>
                  <th className="p-3 text-center">KYC Documents</th>
                  <th className="p-3 text-center">Onboarding Status</th>
                  <th className="p-3 text-center">Governance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                {vendors.map((vendor) => {
                  const docs = vendor.documents || [];
                  const verifiedDocs = docs.filter(d => d.status === 'verified').length;
                  const totalDocs = docs.length;

                  let statusBadgeStyle = 'bg-[#FFF3EC] text-[#FA661C] border-[#FA661C]/30';
                  if (['registered', 'under_review'].includes(vendor.onboarding_status)) {
                    statusBadgeStyle = 'bg-[#FFF8F2] text-[#FA661C] border-[#FF811A]/40 animate-pulse';
                  } else if (['approved', 'verified', 'store_published'].includes(vendor.onboarding_status)) {
                    statusBadgeStyle = 'bg-[#EAF5ED] text-[#52B788] border-[#52B788]/40';
                  } else if (['rejected', 'resubmit_required'].includes(vendor.onboarding_status)) {
                    statusBadgeStyle = 'bg-[#FDE8EA] text-[#D7263D] border-[#D7263D]/40';
                  }

                  return (
                    <tr key={vendor.id} className="hover:bg-[#FFF8F2]/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-[#FA661C] text-xs flex items-center space-x-1.5">
                          <span>{vendor.business_name || vendor.store_name}</span>
                          {vendor.is_women_owned && (
                            <span className="text-[9px] font-black uppercase bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/40 px-1.5 py-0.5 rounded-full">
                              Women Owned
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#6B6058] mt-0.5">
                          Store: <span className="font-medium text-[#FA661C]">{vendor.store_name}</span> ({vendor.store_slug})
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-[#FA661C] block">{vendor.country}</span>
                        <span className="font-mono text-[10px] text-[#6B6058]">Tax ID: {vendor.tax_id || 'Not set'}</span>
                      </td>
                      <td className="p-3 text-[#6B6058]">
                        <span className="capitalize block text-[#FA661C] font-semibold">{vendor.business_type || 'company'}</span>
                        <span className="text-[10px]">{vendor.support_phone || vendor.support_email || 'No contact details'}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          totalDocs === 0
                            ? 'bg-gray-100 text-gray-600 border border-gray-300'
                            : verifiedDocs === totalDocs
                            ? 'bg-[#EAF5ED] text-[#52B788] border border-[#52B788]/40'
                            : 'bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/40'
                        }`}>
                          {totalDocs === 0 ? 'No Documents Uploaded' : `${verifiedDocs} / ${totalDocs} Verified`}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusBadgeStyle}`}>
                          {vendor.onboarding_status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => openReviewModal(vendor)}
                          className="px-3 py-1.5 rounded-xl bg-[#FA661C] text-[#FF811A] font-bold text-[10px] btn-interactive cursor-pointer shadow-xs inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Merchant</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Real Merchant Review Modal & Document Inspector */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-reveal">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#EAE3DC]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FA661C] bg-[#FFF3EC] px-2.5 py-0.5 rounded-full border border-[#FA661C]/30">
                  MERCHANT ONBOARDING GOVERNANCE
                </span>
                <h3 className="font-['Outfit'] text-xl sm:text-2xl font-black text-[#FA661C] mt-1.5 flex items-center space-x-2">
                  <span>{selectedVendor.business_name || selectedVendor.store_name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/40">
                    ID #{selectedVendor.id}
                  </span>
                </h3>
                <p className="text-xs text-[#6B6058] mt-0.5">
                  Verify merchant business credentials, uploaded KYC documents, and issue onboarding decisions.
                </p>
              </div>
              
              <button
                type="button"
                onClick={closeReviewModal}
                className="p-1.5 rounded-xl text-[#6B6058] hover:text-[#FA661C] hover:bg-[#FFF3EC] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Merchant Details Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FFF8F2]/60 rounded-2xl border border-[#FF811A]/20 text-xs">
              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Legal Business Name</span>
                <span className="font-bold text-[#FA661C] text-sm">{selectedVendor.business_name || 'N/A'}</span>
              </div>

              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Store Name & Slug</span>
                <span className="font-bold text-[#FA661C] text-sm">{selectedVendor.store_name} ({selectedVendor.store_slug})</span>
              </div>

              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Country Jurisdiction & Tax ID</span>
                <span className="font-bold text-[#FA661C]">{selectedVendor.country} • Tax ID: {selectedVendor.tax_id || 'Not set'}</span>
              </div>

              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Registration Number & Type</span>
                <span className="font-bold text-[#FA661C] capitalize">{selectedVendor.registration_number || 'N/A'} ({selectedVendor.business_type || 'company'})</span>
              </div>

              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Support Contact</span>
                <span className="font-medium text-[#6B6058]">{selectedVendor.support_email || 'No email'} • {selectedVendor.support_phone || 'No phone'}</span>
              </div>

              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Current Onboarding Status</span>
                <span className="font-bold uppercase text-[#FA661C]">{selectedVendor.onboarding_status}</span>
              </div>
            </div>

            {/* Document Verification Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-['Outfit'] font-bold text-sm text-[#FA661C] flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-[#FF811A]" />
                  <span>Uploaded KYC & Governance Documents</span>
                </h4>
                <span className="text-[11px] text-[#6B6058] font-bold">
                  {(selectedVendor.documents || []).filter(d => d.status === 'verified').length} of {(selectedVendor.documents || []).length} Verified
                </span>
              </div>

              {(selectedVendor.documents || []).length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>No documents uploaded by this merchant yet. Staff approval requires all mandatory documents to be uploaded and verified.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedVendor.documents.map((doc) => {
                    const isDocLoading = docLoading[doc.id];
                    const isRejecting = rejectingDocId === doc.id;

                    return (
                      <div key={doc.id} className="p-3 bg-white rounded-xl border border-[#EAE3DC] space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold uppercase text-[#FA661C] tracking-wide">
                              {doc.document_type}
                            </span>
                            <span className="text-[10px] text-[#6B6058]">
                              (Doc #{doc.id})
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Document Status Pill */}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              doc.status === 'verified'
                                ? 'bg-[#EAF5ED] text-[#52B788] border border-[#52B788]/40'
                                : doc.status === 'rejected'
                                ? 'bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/40'
                                : 'bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/40 animate-pulse'
                            }`}>
                              {doc.status}
                            </span>

                            {/* Action Buttons for Document */}
                            {doc.status !== 'verified' && (
                              <button
                                type="button"
                                disabled={isDocLoading}
                                onClick={() => handleDocumentReview(doc.id, 'verified')}
                                className="px-2.5 py-1 rounded-lg bg-[#52B788] text-white font-bold text-[10px] hover:bg-[#40916C] transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                            )}

                            {doc.status !== 'rejected' && (
                              <button
                                type="button"
                                disabled={isDocLoading}
                                onClick={() => setRejectingDocId(isRejecting ? null : doc.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#D7263D] text-white font-bold text-[10px] hover:bg-[#B01E30] transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Reject Doc</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {doc.rejection_reason && (
                          <div className="text-[11px] text-[#D7263D] bg-[#FDE8EA] p-2 rounded-lg font-medium">
                            Rejection Reason: {doc.rejection_reason}
                          </div>
                        )}

                        {/* Inline Rejection Reason Input when rejecting document */}
                        {isRejecting && (
                          <div className="p-3 bg-[#FFF8F2] rounded-xl border border-[#FF811A]/30 space-y-2 animate-reveal">
                            <label className="block text-[10px] font-bold text-[#FA661C] uppercase">
                              Specify Document Rejection Reason
                            </label>
                            <input
                              type="text"
                              value={docRejectReason[doc.id] || ''}
                              onChange={(e) => setDocRejectReason(prev => ({ ...prev, [doc.id]: e.target.value }))}
                              placeholder="e.g. Image blurry or document expired..."
                              className="w-full px-3 py-1.5 rounded-lg border border-[#EAE3DC] bg-white text-xs text-[#FA661C] focus:outline-none focus:border-[#FA661C]"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setRejectingDocId(null)}
                                className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-bold text-[10px]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isDocLoading || !(docRejectReason[doc.id] || '').trim()}
                                onClick={() => handleDocumentReview(doc.id, 'rejected', docRejectReason[doc.id])}
                                className="px-2.5 py-1 rounded-lg bg-[#D7263D] text-white font-bold text-[10px] disabled:opacity-50"
                              >
                                Confirm Rejection
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Onboarding Review Form */}
            <form onSubmit={handleOnboardingSubmit} className="space-y-4 pt-4 border-t border-[#EAE3DC]">
              <h4 className="font-['Outfit'] font-bold text-sm text-[#FA661C] flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-[#FF811A]" />
                <span>Issue Staff Onboarding Decision</span>
              </h4>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-xl text-xs text-[#D7263D] flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-semibold">{formError}</div>
                </div>
              )}

              {/* Action Selection Radio Group */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'approve', label: 'Approve Merchant', color: 'border-[#52B788] bg-[#EAF5ED] text-[#52B788]' },
                  { id: 'under_review', label: 'Under Review', color: 'border-[#FF811A] bg-[#FFF8F2] text-[#FA661C]' },
                  { id: 'resubmit_required', label: 'Request Resubmit', color: 'border-[#FF811A] bg-[#FFF8F2] text-[#FA661C]' },
                  { id: 'reject', label: 'Reject Merchant', color: 'border-[#D7263D] bg-[#FDE8EA] text-[#D7263D]' },
                ].map((item) => {
                  const isSelected = action === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAction(item.id)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        isSelected
                          ? `${item.color} shadow-xs ring-2 ring-offset-1 ring-[#FA661C]`
                          : 'border-[#EAE3DC] bg-white text-[#6B6058] hover:bg-[#FFF8F2]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Decision Reason Textarea (Mandatory for reject & resubmit_required) */}
              <div>
                <label className="block text-xs font-bold text-[#FA661C] mb-1">
                  Decision Reason / Feedback {(action === 'reject' || action === 'resubmit_required') && <span className="text-[#D7263D]">* (Required)</span>}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    action === 'reject'
                      ? "State exact reasons for rejection (e.g. Fraudulent tax documents, failed verification)..."
                      : action === 'resubmit_required'
                      ? "Specify what documents or details the merchant must update before re-applying..."
                      : "Optional notes regarding staff approval or review status..."
                  }
                  className="w-full p-3 rounded-xl border border-[#EAE3DC] text-xs text-[#FA661C] focus:outline-none focus:border-[#FA661C] bg-white"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || ((action === 'reject' || action === 'resubmit_required') && !reason.trim())}
                  className="px-5 py-2 rounded-xl bg-[#FA661C] text-[#FF811A] font-bold text-xs btn-interactive cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {submitting ? "Submitting Decision..." : "Submit Staff Decision"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
