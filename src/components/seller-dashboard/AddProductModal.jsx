import React, { useState } from 'react';
import { X, Plus, Package, Sparkles, Upload, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AddProductModal({ isOpen, onClose }) {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [sku, setSku] = useState('SKU-AUD-9500');
  const [price, setPrice] = useState('4999');
  const [stock, setStock] = useState('50');
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Listing Submitted", `${productName || 'New Product Listing'} uploaded for compliance review.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0F3D2E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#D4AF37] max-w-lg w-full p-6 shadow-2xl space-y-4 animate-dropdown text-xs">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DC]">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
              <Package className="w-4 h-4 text-[#D4AF37]" />
            </span>
            <h3 className="font-['Outfit'] font-black text-lg text-[#0F3D2E]">
              Add New Product Listing
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#5C6B63] hover:text-[#0F3D2E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-bold text-[#0F3D2E] block mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Mytri Pro Noise-Cancelling Earbuds"
              className="w-full p-2.5 rounded-xl border border-[#D8E0DC] text-xs bg-[#FBF8F1] focus:ring-1 focus:ring-[#D4AF37] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#0F3D2E] block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D8E0DC] text-xs bg-[#FBF8F1] focus:ring-1 focus:ring-[#D4AF37] outline-none"
              >
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Mobiles">Mobiles</option>
                <option value="Home">Home</option>
                <option value="Appliances">Appliances</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#0F3D2E] block mb-1">
                Seller SKU Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D8E0DC] text-xs bg-[#FBF8F1] font-mono focus:ring-1 focus:ring-[#D4AF37] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#0F3D2E] block mb-1">
                Listing Price (INR ₹)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D8E0DC] text-xs bg-[#FBF8F1] focus:ring-1 focus:ring-[#D4AF37] outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#0F3D2E] block mb-1">
                Opening Stock Units
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D8E0DC] text-xs bg-[#FBF8F1] focus:ring-1 focus:ring-[#D4AF37] outline-none"
              />
            </div>
          </div>

          {/* Upload Dropzone Preview */}
          <div className="p-4 border-2 border-dashed border-[#D8E0DC] rounded-2xl text-center bg-[#FBF8F1] space-y-1">
            <Upload className="w-6 h-6 text-[#5C6B63] mx-auto" />
            <p className="font-bold text-[#0F3D2E] text-xs">Upload Product Images (Up to 5)</p>
            <p className="text-[10px] text-[#5C6B63]">Square 1000x1000px on clean white background recommended</p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D8E0DC] text-[#5C6B63] hover:text-[#0F3D2E] font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] font-bold text-xs btn-interactive cursor-pointer shadow-xs"
            >
              Publish Listing
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
