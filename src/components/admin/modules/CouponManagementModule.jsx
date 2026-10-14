import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  Percent, 
  DollarSign, 
  Truck, 
  Sparkles, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { useCoupons } from '../../../utils/couponManager';
import { useToast } from '../../../context/ToastContext';

export default function CouponManagementModule() {
  const toast = useToast();
  const { 
    coupons, 
    availableCoupons, 
    addCoupon, 
    editCoupon, 
    removeCoupon, 
    toggleStatus
  } = useCoupons();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'expired' | 'used' | 'inactive'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'percentage' | 'flat' | 'shipping'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountPercent: 10,
    discountAmount: 100,
    minSpend: 499,
    maxDiscount: 500,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    category: 'all',
    tag: 'SPECIAL OFFER',
    terms: 'Valid on all product categories. One-time redemption per customer account.',
    usageLimit: 500,
    isAvailable: true
  });

  // Calculate Metrics
  const activeCount = availableCoupons.length;
  const expiredCount = coupons.filter(c => c.status === 'expired' || c.tag === 'EXPIRED').length;
  const usedCount = coupons.filter(c => c.status === 'used' || c.tag === 'ALREADY USED' || c.usedOnOrder).length;
  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);

  // Filter coupons
  const filteredCoupons = coupons.filter(c => {
    // Search
    const matchesSearch = 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tag && c.tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Status Filter
    if (statusFilter === 'active') {
      if (!c.isAvailable || c.status !== 'active') return false;
    } else if (statusFilter === 'expired') {
      if (c.status !== 'expired' && c.tag !== 'EXPIRED') return false;
    } else if (statusFilter === 'used') {
      if (c.status !== 'used' && c.tag !== 'ALREADY USED' && !c.usedOnOrder) return false;
    } else if (statusFilter === 'inactive') {
      if (c.isAvailable || c.status === 'expired' || c.status === 'used') return false;
    }

    // Type Filter
    if (typeFilter !== 'all' && c.discountType !== typeFilter) {
      return false;
    }

    return true;
  });

  const handleCopyCode = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    toast.success("Code Copied", `"${code}" copied to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedCoupon(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountPercent: 15,
      discountAmount: 150,
      minSpend: 999,
      maxDiscount: 500,
      expiresAt: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
      category: 'all',
      tag: 'PROMO DEAL',
      terms: 'Minimum cart value required. Valid on all marketplace items.',
      usageLimit: 1000,
      isAvailable: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setModalMode('edit');
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountPercent: coupon.discountPercent || 10,
      discountAmount: coupon.discountAmount || 100,
      minSpend: coupon.minSpend || 0,
      maxDiscount: coupon.maxDiscount || 500,
      expiresAt: coupon.expiresAt || '',
      category: coupon.category || 'all',
      tag: coupon.tag || 'SPECIAL OFFER',
      terms: coupon.terms || '',
      usageLimit: coupon.usageLimit || 500,
      isAvailable: coupon.isAvailable !== false
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Validation Error", "Please provide a valid coupon code.");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Validation Error", "Please provide a promotional title.");
      return;
    }

    try {
      if (modalMode === 'add') {
        addCoupon(formData);
        toast.success("Coupon Created", `Coupon "${formData.code.toUpperCase()}" added to marketplace.`);
      } else {
        editCoupon(selectedCoupon.code, formData);
        toast.success("Coupon Updated", `Coupon "${formData.code.toUpperCase()}" updated successfully.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Operation Failed", err.message || "Could not save coupon.");
    }
  };

  const handleDeleteCoupon = (coupon) => {
    setDeleteConfirmCoupon(coupon);
  };

  const confirmDelete = () => {
    if (!deleteConfirmCoupon) return;
    try {
      removeCoupon(deleteConfirmCoupon.code);
      toast.success("Coupon Deleted", `Coupon "${deleteConfirmCoupon.code}" permanently deleted.`);
      setDeleteConfirmCoupon(null);
    } catch (err) {
      toast.error("Delete Failed", err.message);
    }
  };

  const handleDuplicate = (coupon) => {
    try {
      const clonedCode = `${coupon.code}_COPY`.slice(0, 15);
      addCoupon({
        ...coupon,
        code: clonedCode,
        title: `${coupon.title} (Clone)`,
        usedCount: 0
      });
      toast.success("Coupon Cloned", `Created duplicate code "${clonedCode}".`);
    } catch (err) {
      toast.error("Clone Failed", err.message);
    }
  };

  const handleToggleStatus = (coupon) => {
    toggleStatus(coupon.code);
    toast.info("Status Updated", `Coupon "${coupon.code}" is now ${coupon.isAvailable ? 'Inactive' : 'Active'}.`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#FF811A] mb-1">
            <Tag className="w-4 h-4 text-[#FA661C]" />
            <span>Growth &amp; Marketing Operations</span>
          </div>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
            Coupons &amp; Vouchers Management
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
            Create, edit, toggle, and retire customer discount codes, seasonal campaigns, and partner promo vouchers.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-extrabold shadow-sm btn-interactive flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add New Coupon</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Coupons */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B6058]">Total Coupons</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-['Outfit'] text-[#FA661C]">
            {coupons.length}
          </div>
          <span className="text-[11px] text-[#6B6058] mt-0.5 block">Configured in system</span>
        </div>

        {/* Card 2: Active / Live */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B6058]">Active &amp; Live</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-['Outfit'] text-emerald-700">
            {activeCount}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Ready for checkout</span>
        </div>

        {/* Card 3: Expired / Archived */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B6058]">Expired / Past</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-['Outfit'] text-rose-700">
            {expiredCount}
          </div>
          <span className="text-[11px] text-[#6B6058] mt-0.5 block">Campaigns ended</span>
        </div>

        {/* Card 4: Total Customer Redemptions */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B6058]">Total Redemptions</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF8F2] text-[#FF811A] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-['Outfit'] text-[#FA661C]">
            {totalRedemptions.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#6B6058] mt-0.5 block">Used across marketplace</span>
        </div>

      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#6B6058] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, title, tag..."
              className="w-full pl-9 pr-3.5 py-2 bg-[#FFF8F2]/60 border border-[#EAE3DC] rounded-xl text-xs text-[#FA661C] placeholder:text-[#6B6058]/50 focus:ring-2 focus:ring-[#FF811A] outline-none font-medium"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs font-bold text-[#6B6058] shrink-0">Discount Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#FA661C] focus:ring-2 focus:ring-[#FF811A] outline-none cursor-pointer w-full md:w-auto"
            >
              <option value="all">All Discount Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
              <option value="shipping">Free Shipping</option>
            </select>
          </div>

        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#EAE3DC]/60">
          <span className="text-xs font-bold text-[#6B6058] mr-2">Status:</span>
          {[
            { id: 'all', label: `All (${coupons.length})` },
            { id: 'active', label: `Active (${activeCount})` },
            { id: 'expired', label: `Expired (${expiredCount})` },
            { id: 'used', label: `Used / Redeemed (${usedCount})` },
            { id: 'inactive', label: `Inactive (${coupons.filter(c => !c.isAvailable && c.status === 'inactive').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#FA661C] text-white shadow-2xs'
                  : 'text-[#6B6058] hover:bg-[#FFF8F2] hover:text-[#FA661C]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Coupons Table / List */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        
        {coupons.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="font-['Outfit'] font-bold text-base text-[#1A2420]">No Coupons Configured</h3>
            <p className="text-xs text-[#6B6058] max-w-sm mx-auto">
              There are no coupons configured in the system yet. Click below to add your first discount code.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-2 px-4 py-2 bg-[#FA661C] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-[#E0530B] inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add New Coupon</span>
            </button>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">No Matching Coupons</h3>
            <p className="text-xs text-[#6B6058] max-w-sm mx-auto">
              No coupons matched your current search and filter criteria. Try adjusting your query or resetting filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFF8F2] border-b border-[#EAE3DC] text-[#6B6058] uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Offer Title &amp; Tag</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Min Spend</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4 text-center">Active Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {filteredCoupons.map((coupon) => {
                  const isCopied = copiedCode === coupon.code;
                  const isExpired = coupon.status === 'expired' || coupon.tag === 'EXPIRED';
                  const isUsed = coupon.status === 'used' || coupon.tag === 'ALREADY USED' || coupon.usedOnOrder;

                  return (
                    <tr 
                      key={coupon.code}
                      className="hover:bg-[#FFFDFB] transition-colors"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-xs text-[#FA661C] bg-[#FFF3EC] px-2 py-1 rounded-md border border-[#FA661C]/20 tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 text-[#6B6058] hover:text-[#FA661C] rounded transition-colors cursor-pointer"
                            title="Copy Code"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Title & Tag */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-xs text-[#1A2420] truncate">
                          {coupon.title}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                            isUsed
                              ? 'bg-emerald-100 text-emerald-800'
                              : isExpired
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-[#FFF3EC] text-[#FA661C]'
                          }`}>
                            {coupon.tag || 'PROMO'}
                          </span>
                          <span className="text-[10px] text-[#6B6058] capitalize">
                            • {coupon.category || 'all'}
                          </span>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4 font-bold text-xs text-[#1A2420]">
                        {coupon.discountType === 'percentage' ? (
                          <div className="flex items-center space-x-1 text-[#FA661C]">
                            <Percent className="w-3.5 h-3.5" />
                            <span>{coupon.discountPercent}% OFF</span>
                            <span className="text-[10px] text-[#6B6058] font-normal">(Capped at ₹{coupon.maxDiscount})</span>
                          </div>
                        ) : coupon.discountType === 'shipping' ? (
                          <div className="flex items-center space-x-1 text-emerald-700">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Free Express (₹{coupon.discountAmount})</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-[#FA661C]">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Flat ₹{coupon.discountAmount} OFF</span>
                          </div>
                        )}
                      </td>

                      {/* Min Spend */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-[#6B6058]">
                        ₹{coupon.minSpend?.toLocaleString('en-IN')}
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-[#1A2420]">
                          {coupon.expiresAt}
                        </div>
                        <span className={`text-[10px] font-semibold ${
                          isExpired ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {isExpired ? 'Expired' : 'Active window'}
                        </span>
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-[#1A2420]">
                          {coupon.usedCount || 0} / {coupon.usageLimit || 500}
                        </div>
                        <div className="w-20 bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="bg-[#FA661C] h-full rounded-full"
                            style={{ width: `${Math.min(100, (((coupon.usedCount || 0) / (coupon.usageLimit || 500)) * 100))}%` }}
                          />
                        </div>
                      </td>

                      {/* Active Status Switch */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            coupon.isAvailable ? 'bg-[#FA661C]' : 'bg-gray-300'
                          }`}
                          title={coupon.isAvailable ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              coupon.isAvailable ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(coupon)}
                            className="p-1.5 text-[#6B6058] hover:text-[#FA661C] hover:bg-[#FFF3EC] rounded-lg transition-colors cursor-pointer"
                            title="Clone coupon"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 text-[#6B6058] hover:text-[#FA661C] hover:bg-[#FFF3EC] rounded-lg transition-colors cursor-pointer"
                            title="Edit coupon"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon)}
                            className="p-1.5 text-[#6B6058] hover:text-[#D7263D] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* 5. ADD / EDIT COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs animate-reveal">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 animate-dropdown">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3DC]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-black text-lg text-[#FA661C]">
                    {modalMode === 'add' ? 'Create New Discount Coupon' : `Edit Coupon "${formData.code}"`}
                  </h3>
                  <p className="text-[11px] text-[#6B6058]">
                    Configure discount rules, threshold requirements, and marketplace validity.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#6B6058] hover:text-[#FA661C] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCoupon} className="mt-5 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Coupon Code */}
                <div>
                  <label className="block text-xs font-bold text-[#6B6058] mb-1">
                    Coupon Promo Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    placeholder="e.g. FESTIVE30"
                    className="w-full px-3.5 py-2 border border-[#EAE3DC] rounded-xl text-xs font-mono font-bold uppercase text-[#FA661C] focus:ring-2 focus:ring-[#FF811A] outline-none disabled:bg-gray-100"
                  />
                  <span className="text-[10px] text-[#6B6058] mt-0.5 block">Unique uppercase identifier</span>
                </div>

                {/* Tag / Badge */}
                <div>
                  <label className="block text-xs font-bold text-[#6B6058] mb-1">
                    Display Badge Tag
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                    placeholder="e.g. FLASH DEAL"
                    className="w-full px-3.5 py-2 border border-[#EAE3DC] rounded-xl text-xs font-bold uppercase text-[#FA661C] focus:ring-2 focus:ring-[#FF811A] outline-none"
                  />
                </div>
              </div>

              {/* Offer Title */}
              <div>
                <label className="block text-xs font-bold text-[#6B6058] mb-1">
                  Promotional Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Flat ₹200 Off Festive Sweets & Artisanal Crafts"
                  className="w-full px-3.5 py-2 border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] focus:ring-2 focus:ring-[#FF811A] outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#6B6058] mb-1">
                  Customer Summary Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Save 20% on any order above ₹1,499 across all verified artisanal brand collections."
                  className="w-full px-3.5 py-2 border border-[#EAE3DC] rounded-xl text-xs text-[#1A2420] focus:ring-2 focus:ring-[#FF811A] outline-none"
                />
              </div>

              {/* Discount Rules Grid */}
              <div className="p-4 bg-[#FFF8F2]/60 rounded-2xl border border-[#FF811A]/20 space-y-3">
                <span className="text-xs font-black uppercase text-[#FA661C] block">
                  Discount Economics &amp; Value
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Discount Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B6058] mb-1">
                      Type
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#FA661C] focus:ring-2 focus:ring-[#FF811A] outline-none cursor-pointer"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                      <option value="shipping">Free Shipping</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  {formData.discountType === 'percentage' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-[#6B6058] mb-1">
                        Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-[#6B6058] mb-1">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] outline-none"
                      />
                    </div>
                  )}

                  {/* Max Discount Cap (for percentage) */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B6058] mb-1">
                      Max Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Min Spend */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B6058] mb-1">
                      Minimum Order Value (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minSpend}
                      onChange={(e) => setFormData({ ...formData, minSpend: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] outline-none"
                    />
                  </div>

                  {/* Usage Limit */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B6058] mb-1">
                      Max Total Redemptions
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Expiry & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6B6058] mb-1">
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6B6058] mb-1">
                    Target Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#FA661C] outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion &amp; Apparel</option>
                    <option value="home">Home &amp; Kitchen</option>
                    <option value="festive">Festive Specials</option>
                    <option value="shipping">Express Shipping</option>
                    <option value="vip">VIP / Plus Exclusive</option>
                  </select>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-xs font-bold text-[#6B6058] mb-1">
                  Terms &amp; Conditions
                </label>
                <textarea
                  rows={2}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="e.g. Valid across all delivery pincodes in India. Instant automatic deduction at checkout."
                  className="w-full px-3.5 py-2 border border-[#EAE3DC] rounded-xl text-xs text-[#1A2420] outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-[#EAE3DC]">
                <div>
                  <span className="text-xs font-bold text-[#1A2420] block">Publish as Active Coupon</span>
                  <span className="text-[10px] text-[#6B6058]">When enabled, customers can instantly apply this code on cart and checkout</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isAvailable ? 'bg-[#FA661C]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formData.isAvailable ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#EAE3DC]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#EAE3DC] text-[#6B6058] hover:text-[#FA661C] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-extrabold shadow-sm btn-interactive cursor-pointer"
                >
                  {modalMode === 'add' ? 'Create Coupon' : 'Save Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deleteConfirmCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs animate-reveal">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] w-full max-w-md shadow-2xl p-6 text-center space-y-4 animate-dropdown">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#D7263D] mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-['Outfit'] font-black text-lg text-[#1A2420]">
                Delete Coupon "{deleteConfirmCoupon.code}"?
              </h3>
              <p className="text-xs text-[#6B6058] mt-1">
                Are you sure you want to remove <span className="font-bold">{deleteConfirmCoupon.title}</span>? This action cannot be undone and will prevent customers from using this code.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCoupon(null)}
                className="px-4 py-2 border border-[#EAE3DC] text-[#6B6058] hover:text-[#FA661C] rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 bg-[#D7263D] hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
