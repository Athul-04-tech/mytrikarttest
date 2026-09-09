import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  Trash2, 
  Star, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  FileText,
  ChevronDown,
  Lock
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function ProductMediaSection({ productId: propProductId }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [selectedProductId, setSelectedProductId] = useState(propProductId || null);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);

  // Sync propProductId if passed
  useEffect(() => {
    if (propProductId) {
      setSelectedProductId(propProductId);
    } else {
      setSelectedProductId(null);
    }
  }, [propProductId]);

  const activeProductId = propProductId || selectedProductId;

  // Fetch images for selected product via GET /api/products/vendor/products/<pk>/images/
  const fetchImages = async (pk) => {
    if (!pk) {
      setImages([]);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiRequest(`/api/products/vendor/products/${pk}/images/`);
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch product images:', err);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeProductId) {
      fetchImages(activeProductId);
    } else {
      setImages([]);
    }
  }, [activeProductId]);

  // Extract verbatim DRF error message from 400 responses
  const extractErrorMessage = (err) => {
    if (err?.data) {
      if (typeof err.data.detail === 'string') {
        return err.data.detail;
      }
      if (err.data.image) {
        return Array.isArray(err.data.image) ? err.data.image.join(' ') : String(err.data.image);
      }
      if (typeof err.data === 'object') {
        const messages = [];
        for (const [key, val] of Object.entries(err.data)) {
          const str = Array.isArray(val) ? val.join(' ') : String(val);
          messages.push(`${key}: ${str}`);
        }
        if (messages.length > 0) return messages.join(' | ');
      }
    }
    return err?.message || 'Failed to upload image. Please check file formatting.';
  };

  // Set as Primary via PATCH /api/products/vendor/products/<pk>/images/<image_pk>/
  const handleSetPrimary = async (imageId) => {
    if (!activeProductId || !imageId) return;
    setSettingPrimaryId(imageId);
    setErrorMessage(null);

    try {
      await apiRequest(`/api/products/vendor/products/${activeProductId}/images/${imageId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_primary: true })
      });

      // Immediately reflect state: mark target as primary, others as false
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: img.id === imageId
        }))
      );
      toast.success("Primary Image Updated", "Set target image as primary thumbnail.");
    } catch (err) {
      console.error('Failed to set primary image:', err);
      const msg = extractErrorMessage(err);
      setErrorMessage(msg);
      toast.error("Set Primary Error", msg);
    } finally {
      setSettingPrimaryId(null);
    }
  };

  // Perform upload via POST /api/products/vendor/products/<pk>/images/
  const handleUploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    if (!activeProductId) {
      setErrorMessage("Please save this product as a draft first before uploading studio gallery media.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append('images', fileList[i]);
    }
    if (isPrimary) {
      formData.append('is_primary', 'true');
    }

    try {
      await apiRequest(`/api/products/vendor/products/${activeProductId}/images/`, {
        method: 'POST',
        body: formData
      });

      toast.success("Images Uploaded", `Successfully attached ${fileList.length} image(s) to studio gallery.`);
      setIsPrimary(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh real images list from GET endpoint
      await fetchImages(activeProductId);
    } catch (err) {
      console.error('Image upload failed:', err);
      const verbatimMsg = extractErrorMessage(err);
      setErrorMessage(verbatimMsg);
      toast.error("Upload Error", verbatimMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete image via DELETE /api/products/vendor/products/<pk>/images/<image_pk>/
  const handleDeleteImage = async (imageId) => {
    if (!activeProductId || !imageId) return;

    setDeletingImageId(imageId);
    setErrorMessage(null);

    try {
      await apiRequest(`/api/products/vendor/products/${activeProductId}/images/${imageId}/`, {
        method: 'DELETE'
      });

      toast.success("Image Deleted", "Removed image asset from product gallery.");
      // Image is removed after 204 confirmation
      await fetchImages(activeProductId);
    } catch (err) {
      console.error('Failed to delete image:', err);
      const msg = err?.data?.detail || err?.message || 'Failed to delete image.';
      setErrorMessage(msg);
      toast.error("Delete Error", msg);
    } finally {
      setDeletingImageId(null);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // BLOCKED / LOCKED STATE BEFORE PRODUCT DRAFT SAVED
  if (!activeProductId) {
    return (
      <section className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs relative animate-fadeIn space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE3DC]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 text-[#FA661C]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Outfit'] text-lg sm:text-xl font-extrabold text-[#FA661C] tracking-tight">
                4. Studio Gallery & Visual Media
              </h2>
              <p className="text-xs text-[#6B6058]">
                Upload studio product assets, set primary thumbnail, and manage catalog gallery
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/40 px-3 py-1 rounded-full flex items-center space-x-1.5 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-[#FA661C]" />
            <span>Save Draft Required</span>
          </span>
        </div>

        {/* Unmissable Blocked State Alert Card */}
        <div 
          data-testid="media-section-blocked-state"
          className="p-8 bg-[#FFF8F2] border-2 border-dashed border-[#FF811A]/40 rounded-3xl text-center space-y-4 animate-fadeIn"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/30 text-[#FA661C] flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6 text-[#FA661C]" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
              Save Product Draft to Enable Studio Gallery
            </h3>
            <p className="text-xs text-[#6B6058] leading-relaxed">
              Please save your product details as a draft first using the <strong className="text-[#FA661C]">Save Draft</strong> button below. Once saved, your catalog product ID will be generated and this gallery upload zone will unlock automatically.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-[#FA661C] bg-[#FFF3EC] border border-[#FF811A]/40 px-3 py-1.5 rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-[#FA661C]" />
              <span>Media uploads require an active product record ID</span>
            </span>
          </div>
        </div>
      </section>
    );
  }

  // ACTIVE UNLOCKED STATE (WHEN PRODUCT RECORD ID IS SAVED AND PRESENT)
  return (
    <section className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs relative animate-fadeIn space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 text-[#FA661C]">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-lg sm:text-xl font-extrabold text-[#FA661C] tracking-tight">
              4. Studio Gallery & Visual Media
            </h2>
            <p className="text-xs text-[#6B6058]">
              Upload studio product assets, set primary thumbnail, and manage catalog gallery (Product #{activeProductId})
            </p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/40 px-3 py-1 rounded-full flex items-center space-x-1.5 self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#FA661C]" />
          <span>{images.length} / 10 Images Uploaded</span>
        </span>
      </div>

      {/* Verbatim Backend Error Message Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FDE8EA] border-2 border-[#D7263D] text-[#D7263D] flex items-start space-x-3 text-xs animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-sm">Media Upload Validation Error</span>
            <p className="mt-0.5 font-medium leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Drag & Drop Multipart Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFiles(e.dataTransfer.files);
          }
        }}
        className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed text-center transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${
          isDragOver
            ? 'border-[#FA661C] bg-[#FFF3EC]'
            : 'border-[#EAE3DC] hover:border-[#FF811A]/60 bg-[#FFFFFF]'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleUploadFiles(e.target.files);
            }
          }}
          className="hidden"
        />

        <div className="p-3.5 rounded-full bg-[#FFF3EC] border border-[#FF811A]/40 text-[#FA661C]">
          {isUploading ? (
            <Loader2 className="w-7 h-7 animate-spin text-[#FA661C]" />
          ) : (
            <UploadCloud className="w-7 h-7 text-[#FA661C]" />
          )}
        </div>

        <div>
          <h3 className="font-['Outfit'] font-extrabold text-sm text-[#FA661C]">
            {isUploading ? 'Uploading Studio Media Files...' : 'Drag & Drop Studio Images Here'}
          </h3>
          <p className="text-xs text-[#6B6058] mt-1">
            or <span className="text-[#FA661C] font-bold underline">browse files</span> from your computer
          </p>
          <span className="text-[10px] text-[#6B6058] block mt-1">
            Allowed formats: JPEG, PNG, WebP, GIF • Maximum 5 MiB per file • Up to 10 images per product
          </span>
        </div>

        <div className="flex items-center space-x-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            id="is-primary-checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="w-4 h-4 text-[#FA661C] accent-[#FA661C] rounded cursor-pointer"
          />
          <label htmlFor="is-primary-checkbox" className="text-xs font-bold text-[#6B6058] cursor-pointer">
            Set first uploaded file as Primary Thumbnail
          </label>
        </div>
      </div>

      {/* Media Gallery / Existing Images List */}
      <div>
        <h4 className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-[#FA661C] mb-3">
          Attached Media Assets ({images.length})
        </h4>

        {isLoading ? (
          <div className="p-8 text-center bg-[#FFF3EC]/30 rounded-2xl border border-[#EAE3DC] space-y-2">
            <Loader2 className="w-6 h-6 text-[#FA661C] animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#6B6058]">Fetching product media assets from server...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="p-8 bg-[#FFF8F2]/50 border border-[#EAE3DC] rounded-2xl text-center space-y-2">
            <ImageIcon className="w-8 h-8 text-[#6B6058]/40 mx-auto" />
            <h5 className="font-['Outfit'] font-extrabold text-sm text-[#FA661C]">No images uploaded yet</h5>
            <p className="text-xs text-[#6B6058] max-w-sm mx-auto">
              Upload high-resolution JPEG, PNG, WebP, or GIF photos (up to 5 MiB each, maximum 10 images).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {images.map((img) => (
              <div
                key={img.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-2xs group relative flex flex-col justify-between transition-all ${
                  img.is_primary ? 'border-[#FA661C] ring-2 ring-[#FA661C]/20' : 'border-[#EAE3DC]'
                }`}
              >
                {/* Image Container */}
                <div className="relative aspect-square bg-[#FFF3EC]/50 overflow-hidden">
                  <img
                    src={getImageUrl(img.image)}
                    alt={`Product Asset ${img.id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Primary Badge */}
                  {img.is_primary && (
                    <span className="absolute top-2 left-2 bg-[#FA661C] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center space-x-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>Primary</span>
                    </span>
                  )}

                  {/* Order Badge */}
                  <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs text-[#6B6058] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#EAE3DC]">
                    #{img.display_order ?? img.id}
                  </span>
                </div>

                {/* Card Actions Footer */}
                <div className="p-2 bg-white border-t border-[#EAE3DC] flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    disabled={settingPrimaryId === img.id || img.is_primary}
                    className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                      img.is_primary
                        ? 'bg-[#FFF3EC] text-[#FA661C] cursor-default'
                        : 'text-[#6B6058] hover:bg-[#FFF3EC] hover:text-[#FA661C]'
                    }`}
                    title={img.is_primary ? 'Primary Thumbnail' : 'Set as Primary'}
                  >
                    {settingPrimaryId === img.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FA661C]" />
                    ) : (
                      <Star className={`w-3.5 h-3.5 ${img.is_primary ? 'fill-current text-[#FA661C]' : 'text-[#6B6058]'}`} />
                    )}
                    <span className="text-[10px]">
                      {img.is_primary ? 'Primary' : 'Set Primary'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    disabled={deletingImageId === img.id}
                    className="p-1.5 rounded-lg text-[#D7263D] hover:bg-[#FDE8EA] icon-interactive cursor-pointer disabled:opacity-50"
                    title="Delete Image"
                  >
                    {deletingImageId === img.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D7263D]" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-[#D7263D]" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}
