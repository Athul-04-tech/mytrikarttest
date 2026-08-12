import React, { useState } from 'react';
import { User, Mail, Phone, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function Step1PersonalInfo({ formData, updateFormData, onNext, onBack }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.firstName) errs.firstName = "First name is required";
    if (!formData.lastName) errs.lastName = "Last name is required";
    if (!formData.email || !formData.email.includes('@')) errs.email = "Valid corporate email is required";
    if (!formData.mobile || formData.mobile.length < 10) errs.mobile = "10-digit mobile number is required";
    if (!formData.username || formData.username.length < 3) errs.username = "Username must be at least 3 characters";
    if (!formData.password || formData.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";
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
          Personal Information
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Primary account owner credentials and secure merchant access details
        </p>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* First Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            First Name <span className="text-[#C0392B]">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.firstName || ''}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            placeholder="e.g. Aarav"
            className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
          />
          {errors.firstName && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Last Name <span className="text-[#C0392B]">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.lastName || ''}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            placeholder="e.g. Sharma"
            className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
          />
          {errors.lastName && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.lastName}</p>}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Email Address <span className="text-[#C0392B]">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={formData.email || ''}
              onChange={(e) => updateFormData({ email: e.target.value })}
              placeholder="aarav@business.com"
              className="w-full py-2.5 pl-3.5 pr-9 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
            />
            <Mail className="w-4 h-4 text-[#5C6B63] absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          {errors.email && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.email}</p>}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Mobile Number <span className="text-[#C0392B]">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              required
              value={formData.mobile || ''}
              onChange={(e) => updateFormData({ mobile: e.target.value.replace(/\D/g, '') })}
              placeholder="10-digit mobile number"
              className="w-full py-2.5 pl-3.5 pr-9 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
            />
            <Phone className="w-4 h-4 text-[#5C6B63] absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          {errors.mobile && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.mobile}</p>}
        </div>

        {/* Username */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Merchant Username <span className="text-[#C0392B]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={formData.username || ''}
              onChange={(e) => updateFormData({ username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
              placeholder="e.g. aarav_sharma_crafts"
              className="w-full py-2.5 pl-3.5 pr-9 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive font-mono"
            />
            <User className="w-4 h-4 text-[#5C6B63] absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          {errors.username && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.username}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Password <span className="text-[#C0392B]">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={formData.password || ''}
              onChange={(e) => updateFormData({ password: e.target.value })}
              placeholder="Min. 6 characters"
              className="w-full py-2.5 pl-3.5 pr-10 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6B63] hover:text-[#0F3D2E]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Confirm Password <span className="text-[#C0392B]">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={formData.confirmPassword || ''}
              onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
              placeholder="Re-enter password"
              className="w-full py-2.5 pl-3.5 pr-10 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6B63] hover:text-[#0F3D2E]"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.confirmPassword}</p>}
        </div>

      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#D8E0DC]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-xs font-bold text-[#5C6B63] bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] btn-interactive flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 icon-interactive" />
          <span>Change Method</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-xs font-bold text-[#FBF8F1] bg-[#0F3D2E] hover:bg-[#155440] btn-interactive flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <span>Continue to Business Details</span>
          <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
        </button>
      </div>

    </form>
  );
}
