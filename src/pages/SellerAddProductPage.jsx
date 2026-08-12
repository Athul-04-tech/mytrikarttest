import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  Save, 
  Layers, 
  DollarSign, 
  Tag, 
  FileText, 
  ShieldCheck, 
  Plus, 
  Trash2,
  ChevronRight,
  Info 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const CREATION_STEPS = [
  { id: 1, title: 'Category & Brand', desc: 'Classification' },
  { id: 2, title: 'Product Details', desc: 'Title & Story' },
  { id: 3, title: 'Variations', desc: 'Colors & Specs' },
  { id: 4, title: 'Pricing & Stock', desc: 'GST & Inventory' },
  { id: 5, title: 'Studio Media', desc: '1000x1000px Photos' },
  { id: 6, title: 'Logistics & SEO', desc: 'Dimensions & Meta' }
];

export default function SellerAddProductPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const toast = useToast();
  const navigate = useNavigate();

  // Form State
  const [category, setCategory] = useState('Electronics');
  const [subCategory, setSubCategory] = useState('Audio & Headphones');
  const [brand, setBrand] = useState('Apex Elite Audio');
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('SKU-AUD-9520');
  const [mrp, setMrp] = useState('9999');
  const [sellingPrice, setSellingPrice] = useState('4499');
  const [gstRate, setGstRate] = useState('18');
  const [hsnCode, setHsnCode] = useState('85183000');
  const [stockQuantity, setStockQuantity] = useState('100');
  const [weightKg, setWeightKg] = useState('0.45');
  const [dimensions, setDimensions] = useState('18 x 15 x 8 cm');
  const [description, setDescription] = useState('');

  // SEO Standard
  useEffect(() => {
    document.title = "Add Product Listing — MytriKart Seller Hub";
  }, []);

  const handleSaveDraft = () => {
    toast.info("Draft Saved", "Listing saved to Drafts queue (SKU-AUD-9520).");
  };

  const handlePublishListing = (e) => {
    e.preventDefault();
    toast.success("Listing Submitted for Verification", `${title || 'New Product Listing'} uploaded to catalog.`);
    setTimeout(() => {
      navigate('/seller/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FBF8F1] flex flex-col text-[#1A2420] font-sans selection:bg-[#D4AF37]/30 selection:text-[#0F3D2E]">
      
      {/* 1. Header Bar with Breadcrumb Navigation */}
      <header className="sticky top-0 z-40 bg-[#FBF8F1]/95 backdrop-blur-md border-b border-[#D8E0DC] shadow-xs px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <Link
              to="/seller/dashboard"
              className="p-2 rounded-xl bg-white hover:bg-[#E8F2EE] border border-[#D8E0DC] text-[#0F3D2E] icon-interactive cursor-pointer"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center space-x-1 text-[10px] text-[#5C6B63] mb-0.5">
                <Link to="/seller/dashboard" className="hover:underline">Seller Hub</Link>
                <ChevronRight className="w-3 h-3 text-[#D4AF37]" />
                <Link to="/seller/products" className="hover:underline">Catalog</Link>
                <ChevronRight className="w-3 h-3 text-[#D4AF37]" />
                <span className="font-bold text-[#0F3D2E]">New Listing Creation</span>
              </div>
              <h1 className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[#0F3D2E]">
                Add New Product Listing
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FBF8F1] border border-[#D8E0DC] text-[#0F3D2E] text-xs font-bold btn-interactive cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={handlePublishListing}
              className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] text-xs font-black btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Submit & Publish</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Step-by-Step Creation Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Step Progress Stepper */}
        <div className="bg-white rounded-2xl border border-[#D8E0DC] p-3 sm:p-4 shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between min-w-[560px] gap-2">
            {CREATION_STEPS.map((st) => {
              const isCurrent = currentStep === st.id;
              const isPassed = currentStep > st.id;

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setCurrentStep(st.id)}
                  className={`flex items-center space-x-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#FCF7E8] border border-[#D4AF37]'
                      : isPassed
                      ? 'bg-[#E8F2EE] text-[#0F3D2E]'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-[#0F3D2E] text-[#D4AF37]'
                      : isPassed
                      ? 'bg-[#0F3D2E] text-[#FBF8F1]'
                      : 'bg-[#D8E0DC] text-[#5C6B63]'
                  }`}>
                    {isPassed ? '✓' : st.id}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0F3D2E] block">{st.title}</span>
                    <span className="text-[10px] text-[#5C6B63] block">{st.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Form Cards */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-xs space-y-6 text-xs animate-reveal">
          
          {/* STEP 1: Category & Classification */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-[#D8E0DC] pb-3">
                <h3 className="font-['Outfit'] font-black text-lg text-[#0F3D2E]">
                  Step 1 — Category & Brand Identification
                </h3>
                <p className="text-[#5C6B63] text-xs">Classify your item to ensure correct marketplace tax rates and filters.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">Primary Marketplace Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-bold text-[#0F3D2E]"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion & Apparel</option>
                    <option value="Mobiles">Mobiles & Wearables</option>
                    <option value="Home">Home & Furniture</option>
                    <option value="Appliances">Kitchen & Appliances</option>
                    <option value="Sports">Sports & Fitness</option>
                    <option value="Beauty">Beauty & Skincare</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">Sub-Category Taxonomy *</label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">Seller SKU Code *</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Title & Story */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-[#D8E0DC] pb-3">
                <h3 className="font-['Outfit'] font-black text-lg text-[#0F3D2E]">
                  Step 2 — Product Title & Description
                </h3>
                <p className="text-[#5C6B63] text-xs">Craft clear search-friendly titles and rich storytelling for shoppers.</p>
              </div>

              <div>
                <label className="font-bold text-[#0F3D2E] block mb-1">Product Title (Up to 150 Characters) *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mytri Elite Spatial ANC Wireless Headphones with 40h Battery"
                  className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-bold text-[#0F3D2E]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F3D2E] block mb-1">Full Product Story & Specifications *</label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe material quality, certifications, sound profiles, warranty, and package contents..."
                  className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Variations */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-[#D8E0DC] pb-3">
                <h3 className="font-['Outfit'] font-black text-lg text-[#0F3D2E]">
                  Step 3 — Color & Size Variations
                </h3>
                <p className="text-[#5C6B63] text-xs">Add variant attributes like colorways, sizes, and memory tiers.</p>
              </div>

              <div className="p-4 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC] space-y-3">
                <span className="font-bold text-[#0F3D2E] block">Configured Color Options:</span>
                <div className="flex flex-wrap gap-2">
                  {['Matte Emerald Green', 'Classic Gold', 'Obsidian Black'].map((c) => (
                    <span key={c} className="px-3 py-1 bg-white border border-[#D4AF37] rounded-xl text-xs font-bold text-[#0F3D2E] flex items-center space-x-1.5 shadow-2xs">
                      <span>{c}</span>
                      <span className="text-[#5C6B63] cursor-pointer">×</span>
                    </span>
                  ))}
                  <button type="button" className="px-3 py-1 bg-[#E8F2EE] text-[#0F3D2E] font-bold rounded-xl text-xs flex items-center space-x-1">
                    <Plus className="w-3 h-3" />
                    <span>Add Color</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Pricing & Stock */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-[#D8E0DC] pb-3">
                <h3 className="font-['Outfit'] font-black text-lg text-[#0F3D2E]">
                  Step 4 — Pricing, GST Tax & Inventory Stock
                </h3>
                <p className="text-[#5C6B63] text-xs">Set maximum retail price, seller discounted price, and GST slab.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">Maximum Retail Price (MRP ₹) *</label>
                  <input
                    type="number"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">Marketplace Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-mono font-black text-[#0F3D2E]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">Opening Stock Units *</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">GST Tax Slab Rate *</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-bold"
                  >
                    <option value="5">GST 5% (Standard Essential)</option>
                    <option value="12">GST 12% (Appliances)</option>
                    <option value="18">GST 18% (Electronics & Audio)</option>
                    <option value="28">GST 28% (Luxury & Auto)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">Harmonized HSN Code *</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Media Uploads */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border-b border-[#D8E0DC] pb-3">
                <h3 className="font-['Outfit'] font-black text-lg text-[#0F3D2E]">
                  Step 5 — Studio Photography & Visual Media
                </h3>
                <p className="text-[#5C6B63] text-xs">High resolution 1000x1000px square photography increases conversion by 45%.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Main 1:1 Cover Photo */}
                <div className="p-5 border-2 border-dashed border-[#D4AF37] bg-[#FCF7E8] rounded-2xl text-center space-y-2">
                  <Upload className="w-8 h-8 text-[#D4AF37] mx-auto" />
                  <span className="font-black text-xs text-[#0F3D2E] block">Primary Cover Photograph (1:1 Ratio)</span>
                  <p className="text-[10px] text-[#5C6B63]">Matte Emerald studio headphone preview loaded.</p>
                  <div className="w-20 h-20 rounded-xl overflow-hidden mx-auto border border-[#D4AF37] shadow-xs">
                    <img src="/products/spatial_headphones_1786529304124.png" alt="Cover" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Additional Multi-Angle Gallery */}
                <div className="p-5 border-2 border-dashed border-[#D8E0DC] bg-[#FBF8F1] rounded-2xl text-center space-y-2">
                  <Plus className="w-8 h-8 text-[#5C6B63] mx-auto" />
                  <span className="font-bold text-xs text-[#0F3D2E] block">Upload Multi-Angle Gallery (Up to 6)</span>
                  <p className="text-[10px] text-[#5C6B63]">Side, unboxing, accessories, and lifestyle shots.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Shipping & SEO */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="border-b border-[#D8E0DC] pb-3">
                <h3 className="font-['Outfit'] font-black text-lg text-[#0F3D2E]">
                  Step 6 — Shipping Logistics & Meta Attributes
                </h3>
                <p className="text-[#5C6B63] text-xs">Set package dimensions for automated courier billing.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">Gross Deadweight (Kilograms) *</label>
                  <input
                    type="text"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F3D2E] block mb-1">Package Dimensions (L x W x H cm) *</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="pt-4 border-t border-[#D8E0DC] flex items-center justify-between">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              className="px-4 py-2 rounded-xl border border-[#D8E0DC] disabled:opacity-30 disabled:cursor-not-allowed text-[#0F3D2E] font-bold text-xs cursor-pointer"
            >
              ← Previous Step
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
                className="px-5 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] font-bold text-xs rounded-xl btn-interactive cursor-pointer shadow-xs"
              >
                Continue to Step {currentStep + 1} →
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublishListing}
                className="px-6 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] font-black text-xs rounded-xl btn-interactive shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Submit Listing for Review</span>
              </button>
            )}
          </div>

        </div>

      </main>

    </div>
  );
}
