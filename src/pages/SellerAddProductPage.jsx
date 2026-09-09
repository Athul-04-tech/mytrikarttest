import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Layers, 
  Sparkles, 
  Save, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import { ADMIN_CATEGORY_SCHEMAS } from '../data/categoryAttributesMockData';
import { generateCartesianVariants } from '../utils/variantGenerator';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../utils/api';

// Modular Sections
import CategoryPickerSection from '../components/seller-add-product/CategoryPickerSection';
import DynamicAttributesSection from '../components/seller-add-product/DynamicAttributesSection';
import VariantGeneratorSection from '../components/seller-add-product/VariantGeneratorSection';
import SinglePriceStockSection from '../components/seller-add-product/SinglePriceStockSection';
import ProductBasicInfoSection from '../components/seller-add-product/ProductBasicInfoSection';
import ProductMediaSection from '../components/seller-add-product/ProductMediaSection';
import ShippingComplianceSection from '../components/seller-add-product/ShippingComplianceSection';
import SeoMetadataSection from '../components/seller-add-product/SeoMetadataSection';
import PendingRequestsSidebarWidget from '../components/seller-add-product/PendingRequestsSidebarWidget';
import RequestValueModal from '../components/seller-add-product/RequestValueModal';
import StickyActionBar from '../components/seller-add-product/StickyActionBar';

export default function SellerAddProductPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();

  const editProductId = paramId || searchParams.get('edit');
  const isEditMode = Boolean(editProductId);

  // Real Backend State
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [isLoadingEditData, setIsLoadingEditData] = useState(isEditMode);
  const [editLoaded, setEditLoaded] = useState(false);

  // 1. Category State
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 2. Dynamic Attribute Selections State
  const [attributeValues, setAttributeValues] = useState({});

  // 3. Basic Identity State (Initialized empty when editing, default demo strings when adding)
  const [title, setTitle] = useState(isEditMode ? '' : 'Apex Titan 5G Pro Flagship Smartphone');
  const [brand, setBrand] = useState(isEditMode ? '' : 'Apex Electronics Direct');
  const [subtitle, setSubtitle] = useState(isEditMode ? '' : 'Snapdragon 8 Gen 3 • 120Hz AMOLED • 100W Fast Charge');
  const [description, setDescription] = useState(
    isEditMode ? '' : '• Next-generation flagship smartphone with aerospace-grade titanium frame\n• 50MP Sony LYTIA custom camera sensor with optical image stabilization\n• 5000mAh dual-cell silicon-carbon battery with 100W HyperCharge support\n• IP68 water and dust resistance with ceramic glass protection'
  );
  const [baseSku, setBaseSku] = useState(isEditMode ? '' : 'SKU-MOB-APX-9500');
  const [slug, setSlug] = useState('');

  // 4. Pricing & Inventory State
  const [mrp, setMrp] = useState(isEditMode ? '' : '54999');
  const [sellingPrice, setSellingPrice] = useState(isEditMode ? '' : '44999');
  const [stockQuantity, setStockQuantity] = useState(isEditMode ? '' : '50');

  // 5. Variants Matrix State
  const [variants, setVariants] = useState([]);

  // 6. Media Gallery State
  const [images, setImages] = useState([]);

  // 7. Shipping & Compliance State
  const [weightKg, setWeightKg] = useState('0.45');
  const [dimensions, setDimensions] = useState('16.3 x 7.6 x 0.8 cm');
  const [countryOfOrigin, setCountryOfOrigin] = useState('India');
  const [hsnCode, setHsnCode] = useState(isEditMode ? '' : '8517');
  const [gstRate, setGstRate] = useState('18');
  const [inheritShippingPolicy, setInheritShippingPolicy] = useState(true);
  const [inheritReturnPolicy, setInheritReturnPolicy] = useState(true);

  // 8. SEO Metadata State
  const [metaTitle, setMetaTitle] = useState(isEditMode ? '' : 'Apex Titan 5G Pro (12GB RAM, 256GB Storage) - Lowest Price');
  const [metaDescription, setMetaDescription] = useState(isEditMode ? '' : 'Buy Apex Titan 5G Pro online at best price. Experience ultra-fast 5G, 120Hz display, and 50MP OIS camera with free express delivery.');

  // 9. Governance, Draft & Submission State
  const [requestModalAttr, setRequestModalAttr] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [savedProductId, setSavedProductId] = useState(editProductId ? Number(editProductId) : null);
  const [backendSubmissionError, setBackendSubmissionError] = useState(null);

  // Sync savedProductId immediately if editProductId exists
  useEffect(() => {
    if (editProductId) {
      setSavedProductId(Number(editProductId));
    }
  }, [editProductId]);

  // SEO Standard
  useEffect(() => {
    document.title = isEditMode 
      ? `Edit Product Listing #${editProductId} — MytriKart Seller Hub` 
      : "Add Product Listing — MytriKart Seller Hub";
  }, [isEditMode, editProductId]);

  // Fetch Full Detail when in Edit Mode
  useEffect(() => {
    if (!editProductId) return;

    let isMounted = true;
    async function loadProductDetail() {
      setIsLoadingEditData(true);
      try {
        const product = await apiRequest(`/api/products/vendor/products/${editProductId}/detail/`);
        if (!isMounted) return;

        setTitle(product.name || '');
        setSlug(product.slug || '');
        setDescription(product.description || '');
        setHsnCode(product.hsn_code || '');
        setMetaTitle(product.meta_title || '');
        setMetaDescription(product.meta_description || '');
        setInheritShippingPolicy(!product.shipping_override_enabled);
        setInheritReturnPolicy(!product.refund_warranty_override_enabled);

        if (product.category) {
          setSelectedCategory({
            id: product.category,
            name: product.category_name || `Category #${product.category}`
          });
        }

        const attrMap = {};
        let foundBrand = '';
        if (Array.isArray(product.attribute_values)) {
          product.attribute_values.forEach(av => {
            const attrId = av.category_attribute || av.category_attribute_id;
            const val = av.value !== null && av.value !== undefined ? av.value : (av.raw_value || av.value_name || av.selected_value);
            if (attrId && val !== undefined && val !== null) {
              attrMap[attrId] = val;
            }
            const nameLower = (av.attribute_name || av.category_attribute_name || '').toLowerCase();
            if (nameLower === 'brand') {
              foundBrand = av.value_name || av.raw_value || av.selected_value || '';
            }
          });
        }
        setAttributeValues(attrMap);
        if (foundBrand) setBrand(foundBrand);

        if (Array.isArray(product.variants) && product.variants.length > 0) {
          const firstVariant = product.variants[0];
          setSellingPrice(firstVariant.price ? String(firstVariant.price) : '');
          setMrp(firstVariant.price ? String(firstVariant.price) : '');
          setStockQuantity(firstVariant.stock_quantity !== undefined ? String(firstVariant.stock_quantity) : '');
          setBaseSku(firstVariant.sku_code || '');

          const formattedVariants = product.variants.map((v, idx) => ({
            id: v.id,
            comboId: Object.values(v.attributes || {}).join('__') || `VAR-${v.id}`,
            sku: v.sku_code,
            combinationLabel: Object.entries(v.attributes || {}).map(([k, val]) => `${k}: ${val}`).join(' / ') || 'Base Variant',
            combinationMap: v.attributes || {},
            price: v.price,
            stock: v.stock_quantity,
            isActive: v.is_active,
          }));
          setVariants(formattedVariants);
        }

        setEditLoaded(true);
        toast.info("Product Loaded for Editing", `Loaded details for product listing #${editProductId}.`);
      } catch (err) {
        console.error('Failed to fetch existing product detail for edit:', err);
        toast.error("Error Loading Product", "Unable to fetch existing product details.");
      } finally {
        if (isMounted) setIsLoadingEditData(false);
      }
    }

    loadProductDetail();
    return () => { isMounted = false; };
  }, [editProductId]);

  // Fetch Real Category Tree on Mount
  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);
      try {
        const tree = await apiRequest('/api/products/categories/');
        if (Array.isArray(tree) && tree.length > 0) {
          setCategoriesTree(tree);
          if (!isEditMode) {
            const firstCat = tree[0].children?.length > 0 ? tree[0].children[0] : tree[0];
            setSelectedCategory(firstCat);
          }
        } else {
          if (!isEditMode) setSelectedCategory(ADMIN_CATEGORY_SCHEMAS[0]);
        }
      } catch (err) {
        console.warn('Backend category fetch failed, falling back to mock schema:', err);
        if (!isEditMode) setSelectedCategory(ADMIN_CATEGORY_SCHEMAS[0]);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, [isEditMode]);

  // Fetch Category Attributes when Selected Category changes
  useEffect(() => {
    if (!selectedCategory || !selectedCategory.id) return;

    // Check if category has a numeric ID (real backend category)
    if (typeof selectedCategory.id === 'number') {
      async function loadAttributes() {
        setIsLoadingAttributes(true);
        try {
          const attrs = await apiRequest(`/api/products/categories/${selectedCategory.id}/attributes/`);
          setCategoryAttributes(Array.isArray(attrs) ? attrs : []);
        } catch (err) {
          console.warn(`Failed to fetch attributes for category ${selectedCategory.id}:`, err);
          setCategoryAttributes([]);
        } finally {
          setIsLoadingAttributes(false);
        }
      }
      loadAttributes();
    } else {
      // Mock category fallback
      setCategoryAttributes(selectedCategory.attributes || []);
    }
  }, [selectedCategory]);

  // Compute Real Cartesian Variants whenever multi-selected variation attributes or pricing changes
  useEffect(() => {
    const baseData = {
      title,
      brand,
      mrp,
      sellingPrice,
      stockQuantity,
      coverImage: images[0] || null
    };

    const attrsToUse = categoryAttributes.length > 0 ? categoryAttributes : (selectedCategory?.attributes || []);

    const computed = generateCartesianVariants(
      attributeValues,
      attrsToUse,
      baseData,
      variants
    );

    setVariants(computed);
  }, [attributeValues, selectedCategory, categoryAttributes]);

  // Handle Category Switching
  const handleSelectCategory = (newCat) => {
    setSelectedCategory(newCat);
    setAttributeValues({});
    setVariants([]);
    setBackendSubmissionError(null);
    if (newCat.defaultHsn) setHsnCode(newCat.defaultHsn);
    if (newCat.defaultGst) setGstRate(newCat.defaultGst);
    if (newCat.suggestedWeightKg) setWeightKg(newCat.suggestedWeightKg);
    if (newCat.suggestedDimensions) setDimensions(newCat.suggestedDimensions);
    toast.info("Category Schema Loaded", `Loaded specifications schema for ${newCat.name || newCat.displayName}.`);
  };

  const brandAttribute = useMemo(() => {
    return categoryAttributes.find(attr =>
      attr.attribute_name?.toLowerCase() === 'brand' || attr.name?.toLowerCase() === 'brand'
    );
  }, [categoryAttributes]);

  useEffect(() => {
    if (brandAttribute?.id) {
      setAttributeValues(prev => ({ ...prev, [brandAttribute.id]: brand }));
    }
  }, [brand, brandAttribute?.id]);

  // Handle Dynamic Attribute Change
  const handleChangeAttribute = (attrId, value) => {
    if (String(attrId) === String(brandAttribute?.id)) setBrand(value);
    setAttributeValues(prev => ({
      ...prev,
      [attrId]: value
    }));
    setBackendSubmissionError(null);
  };

  // Bulk Variant Updates
  const handleUpdateVariant = (variantId, updatedProps) => {
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, ...updatedProps } : v));
  };

  const handleBulkApplyPrice = (newPrice) => {
    setVariants(prev => prev.map(v => ({ ...v, price: newPrice })));
  };

  const handleBulkApplyStock = (newStock) => {
    setVariants(prev => prev.map(v => ({ ...v, stock: newStock })));
  };

  // Validation Checks
  const validationErrors = useMemo(() => {
    const errors = [];
    if (!title.trim()) errors.push("Product Listing Title is required");
    if (!brand.trim()) errors.push("Brand Name is required");
    if (!description.trim()) errors.push("Product Description is required");
    if (!selectedCategory) errors.push("Category selection is required");

    // Check required attributes
    const attrsList = categoryAttributes.length > 0 ? categoryAttributes : (selectedCategory?.attributes || []);
    attrsList.forEach(attr => {
      const isReq = attr.is_required !== undefined ? attr.is_required : attr.required;
      if (isReq) {
        const val = attributeValues[attr.id];
        const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          const attrName = attr.attribute_name || attr.name;
          errors.push(`Required specification: ${attrName}`);
        }
      }
    });

    return errors;
  }, [title, brand, description, selectedCategory, categoryAttributes, attributeValues]);

  const hasFilledAttributes = Object.keys(attributeValues).length > 0;

  // Helper to persist non-variation product attribute values via POST /api/products/vendor/products/<pk>/attributes/
  const persistProductAttributes = async (targetProductId) => {
    const attrsList = categoryAttributes.length > 0 ? categoryAttributes : (selectedCategory?.attributes || []);
    if (!attrsList || attrsList.length === 0) return;

    const attributePayload = attrsList.flatMap(attr => {
      const isBrand = attr.attribute_name?.toLowerCase() === 'brand' || attr.name?.toLowerCase() === 'brand';
      const value = isBrand ? brand.trim() : attributeValues[attr.id];
      if (value === undefined || value === null || value === '') return [];

      if (attr.field_type === 'dropdown') {
        const allowed = attr.allowed_values || attr.values || [];
        const option = allowed.find(opt =>
          String(opt.id) === String(value) ||
          String(opt.value || opt.name || opt).toLowerCase() === String(value).toLowerCase()
        );
        if (option) {
          return [{ category_attribute_id: attr.id, value_id: option.id }];
        } else {
          return [{ category_attribute_id: attr.id, raw_value: String(value) }];
        }
      }
      return [{ category_attribute_id: attr.id, raw_value: String(value) }];
    });

    if (attributePayload.length > 0) {
      await apiRequest(`/api/products/vendor/products/${targetProductId}/attributes/`, {
        method: 'POST',
        body: JSON.stringify(attributePayload)
      });
    }
  };

  // Helper to persist variant updates (PATCH existing variants, POST new variants)
  const persistProductVariants = async (targetProductId) => {
    if (!variants || variants.length === 0) return;

    const existingVariants = variants.filter(v => typeof v.id === 'number' || (!isNaN(v.id) && !String(v.id).startsWith('VAR-')));

    // 1. PATCH existing variants individually via PATCH /api/products/vendor/products/<pk>/variants/<variant_pk>/
    for (const v of existingVariants) {
      await apiRequest(`/api/products/vendor/products/${targetProductId}/variants/${v.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          price: Number(v.price !== undefined ? v.price : sellingPrice),
          stock_quantity: Number(v.stock !== undefined ? v.stock : stockQuantity),
          sku_code: v.sku || baseSku,
          is_active: v.isActive !== false
        })
      });
    }

    // 2. Create new variants via POST /api/products/vendor/products/<pk>/variants/
    const newVariants = variants.filter(v => typeof v.id === 'string' && String(v.id).startsWith('VAR-'));
    if (newVariants.length > 0 || existingVariants.length === 0) {
      const variationAttrs = categoryAttributes.filter(a => a.is_variation_capable);
      const attributeValueMap = {};
      variationAttrs.forEach(attr => {
        const val = attributeValues[attr.id];
        if (Array.isArray(val) && val.length > 0) {
          const allowed = attr.allowed_values || attr.values || [];
          attributeValueMap[attr.id] = val.map(selectedValue => {
            const option = allowed.find(value =>
              String(value.id) === String(selectedValue) ||
              String(value.value || value.name || value).toLowerCase() === String(selectedValue).toLowerCase()
            );
            return option ? option.id : Number(selectedValue);
          });
        }
      });

      const variantPayload = variants.map(variant => ({
        attribute_value_ids: Object.fromEntries(
          Object.entries(variant.combinationMap || {}).map(([attributeId, selectedValue]) => {
            const attribute = variationAttrs.find(attr => String(attr.id) === String(attributeId));
            const allowed = attribute?.allowed_values || attribute?.values || [];
            const option = allowed.find(value =>
              String(value.id) === String(selectedValue) ||
              String(value.value || value.name || value).toLowerCase() === String(selectedValue).toLowerCase()
            );
            const valId = option ? option.id : Number(selectedValue);
            return [String(attributeId), valId];
          })
        ),
        sku_code: variant.sku,
        price: Number(variant.price || sellingPrice),
        stock_quantity: Number(variant.stock || stockQuantity),
      }));

      await apiRequest(`/api/products/vendor/products/${targetProductId}/variants/`, {
        method: 'POST',
        body: JSON.stringify({
          attribute_value_map: attributeValueMap,
          variants: variantPayload,
          base_sku: baseSku,
          base_price: Number(sellingPrice),
          base_stock: Number(stockQuantity),
        })
      });
    }
  };

  // Save Draft Action (Persists to real backend database row in DRAFT status)
  const handleSaveDraft = async () => {
    if (!selectedCategory) {
      toast.error("Category Required", "Please select a catalog category before saving draft.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title Required", "Please enter a product title before saving draft.");
      return;
    }

    setIsSavingDraft(true);
    setBackendSubmissionError(null);

    const generatedSlug = slug.trim() || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const productPayload = {
      category: selectedCategory.id,
      name: title.trim(),
      slug: generatedSlug,
      description: description || '',
      hsn_code: hsnCode || '',
      base_currency: 'INR',
      meta_title: metaTitle || '',
      meta_description: metaDescription || '',
      shipping_override_enabled: !inheritShippingPolicy,
      refund_warranty_override_enabled: !inheritReturnPolicy
    };

    let productId = savedProductId;
    try {
      if (productId) {
        // Update existing product row via PATCH /api/products/vendor/products/<pk>/
        await apiRequest(`/api/products/vendor/products/${productId}/`, {
          method: 'PATCH',
          body: JSON.stringify(productPayload)
        });
      } else {
        // Create new product row via POST /api/products/vendor/products/
        const created = await apiRequest('/api/products/vendor/products/', {
          method: 'POST',
          body: JSON.stringify(productPayload)
        });
        productId = created.id;
        setSavedProductId(created.id);
      }

      // Persist attributes and variants via dedicated endpoints
      await persistProductAttributes(productId);
      await persistProductVariants(productId);

      // Persist local backup
      const draftData = {
        title, brand, subtitle, description, baseSku, slug,
        mrp, sellingPrice, stockQuantity, attributeValues,
        weightKg, dimensions, countryOfOrigin, hsnCode, gstRate,
        metaTitle, metaDescription, savedProductId: productId, savedAt: new Date().toISOString()
      };
      localStorage.setItem('mytrikart_seller_product_draft', JSON.stringify(draftData));

      toast.success("Draft Saved to Catalog", `Product draft #${productId} saved to backend database.`);
    } catch (err) {
      console.error('Failed to save product draft:', err);
      let errMsg = err.message || 'Failed to save product draft row';
      if (err.data && typeof err.data === 'object') {
        errMsg = Object.entries(err.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ');
      }
      setBackendSubmissionError(`Draft Save Failed: ${errMsg}`);
      toast.error("Draft Save Failed", errMsg);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit / Publish Listing Action (Wired to Real API Endpoints)
  const handleSubmitListing = async (e) => {
    e.preventDefault();
    setBackendSubmissionError(null);

    if (validationErrors.length > 0) {
      toast.error("Incomplete Listing", validationErrors[0]);
      return;
    }

    setIsSubmitting(true);

    const generatedSlug = slug.trim() || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Step 1: Create or update product via POST/PATCH /api/products/vendor/products/
    const productPayload = {
      category: selectedCategory.id,
      name: title,
      slug: generatedSlug,
      description,
      hsn_code: hsnCode || '',
      base_currency: 'INR',
      meta_title: metaTitle || '',
      meta_description: metaDescription || '',
      shipping_override_enabled: !inheritShippingPolicy,
      refund_warranty_override_enabled: !inheritReturnPolicy
    };

    let createdProduct = null;
    try {
      if (savedProductId) {
        createdProduct = await apiRequest(`/api/products/vendor/products/${savedProductId}/`, {
          method: 'PATCH',
          body: JSON.stringify(productPayload)
        });
      } else {
        createdProduct = await apiRequest('/api/products/vendor/products/', {
          method: 'POST',
          body: JSON.stringify(productPayload)
        });
        setSavedProductId(createdProduct.id);
      }
      toast.info("Product Saved", `Product record ID #${createdProduct.id} ready for submission.`);
    } catch (err) {
      console.error('Failed to create bare product:', err);
      let errMsg = err.message || 'Failed to create product record';
      if (err.data && typeof err.data === 'object') {
        errMsg = Object.entries(err.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ');
      }
      setBackendSubmissionError(`Product Creation Failed: ${errMsg}`);
      toast.error("Product Creation Failed", errMsg);
      setIsSubmitting(false);
      return;
    }

    // Step 2: Persist attributes via POST /api/products/vendor/products/<id>/attributes/
    try {
      await persistProductAttributes(createdProduct.id);
    } catch (err) {
      setBackendSubmissionError(`Could not save product specifications: ${JSON.stringify(err.data || err.message)}`);
      setIsSubmitting(false);
      return;
    }

    // Step 3: Persist variants via PATCH/POST
    try {
      await persistProductVariants(createdProduct.id);
    } catch (variantErr) {
      const detail = variantErr.data || variantErr.message;
      setBackendSubmissionError(`Could not save product variants: ${typeof detail === 'object' ? JSON.stringify(detail) : detail}`);
      setIsSubmitting(false);
      return;
    }

    // Step 4: Trigger Submit for Review via POST /api/products/vendor/products/<pk>/submit/
    try {
      const submitResult = await apiRequest(`/api/products/vendor/products/${createdProduct.id}/submit/`, {
        method: 'POST'
      });

      toast.success(
        "Listing Submitted Successfully!", 
        `Product #${createdProduct.id} is now ${submitResult.status || 'submitted'}.`
      );
      setIsSubmitting(false);
      navigate('/seller/products');
    } catch (submitErr) {
      console.warn('Backend Submit-for-Review rejected validation:', submitErr);
      
      let formattedError = submitErr.message || 'Submission rejected by server validation.';
      if (submitErr.data?.detail) {
        if (typeof submitErr.data.detail === 'string') {
          formattedError = submitErr.data.detail;
        } else if (typeof submitErr.data.detail === 'object') {
          formattedError = Object.entries(submitErr.data.detail)
            .map(([field, msgs]) => `${field.toUpperCase()}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
        }
      }

      setBackendSubmissionError(formattedError);
      toast.error("Submission Validation Error", formattedError);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#1A2420] font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* 1. Header Bar with Breadcrumbs & Fast Exit */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE3DC] shadow-2xs px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <Link
              to="/seller/products"
              className="p-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] icon-interactive cursor-pointer"
              aria-label="Back to Products"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center space-x-1.5 text-[10px] text-[#6B6058] mb-0.5">
                <Link to="/seller/dashboard" className="hover:underline">Seller Hub</Link>
                <ChevronRight className="w-3 h-3 text-[#EAE3DC]" />
                <Link to="/seller/products" className="hover:underline">Catalog</Link>
                <ChevronRight className="w-3 h-3 text-[#EAE3DC]" />
                <span className="font-bold text-[#FA661C]">
                  {isEditMode ? `Edit Product #${editProductId}` : 'Add Product Listing'}
                </span>
              </div>
              <h1 className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[#FA661C] leading-tight">
                {isEditMode ? `Edit Product Specification #${editProductId}` : 'Add New Product Listing'}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isSubmitting}
              className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-[#EAE3DC] bg-[#FFFFFF] hover:bg-[#FFF3EC] text-xs font-bold text-[#FA661C] btn-interactive cursor-pointer disabled:opacity-50"
            >
              {isSavingDraft ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FA661C]" />
              ) : (
                <Save className="w-3.5 h-3.5 text-[#FA661C]" />
              )}
              <span>{isSavingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>

            <span className="text-[10px] font-black uppercase bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A] px-2.5 py-1 rounded-full flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF811A]" />
              <span>Gold Merchant Verified</span>
            </span>
          </div>

        </div>
      </header>

      {/* 2. Main Page Layout (8-Col Main Form + 4-Col Side Governance Panel) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Loading Edit Data Indicator */}
        {isLoadingEditData && (
          <div className="mb-6 p-4 bg-[#FFF3EC] border border-[#FF811A]/40 rounded-2xl flex items-center space-x-3 text-xs text-[#FA661C] font-bold animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-[#FA661C]" />
            <span>Fetching existing product details and category specifications from server...</span>
          </div>
        )}

        {/* Backend Validation Error Alert Banner */}
        {backendSubmissionError && (
          <div className="mb-6 p-5 rounded-3xl bg-[#FDE8EA] border-2 border-[#D7263D] text-[#D7263D] shadow-sm flex items-start space-x-3.5 animate-fadeIn">
            <div className="p-2 rounded-2xl bg-white border border-[#D7263D]/40 text-[#D7263D] shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-['Outfit'] font-extrabold text-sm text-[#D7263D]">
                Backend Validation Error — Submission Rejected
              </h3>
              <p className="text-xs mt-1 font-medium leading-relaxed">
                {backendSubmissionError}
              </p>
              <p className="text-[11px] text-[#6B6058] mt-2 italic">
                Check the highlighted specifications and try submitting again.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Center: Full Sequential Form (8 Cols on Desktop) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Step 1: Category Selection */}
            <CategoryPickerSection 
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              hasFilledAttributes={hasFilledAttributes}
              categoriesTree={categoriesTree}
              isLoadingCategories={isLoadingCategories}
            />

            {/* Step 2: Dynamic Admin Attributes */}
            <DynamicAttributesSection 
              selectedCategory={selectedCategory}
              categoryAttributes={categoryAttributes}
              isLoadingAttributes={isLoadingAttributes}
              attributeValues={attributeValues}
              onChangeAttribute={handleChangeAttribute}
              onRequestNewValue={(attr) => setRequestModalAttr(attr)}
            />

            {/* Step 3: Variants Matrix OR Single Price/Stock */}
            {variants.length > 0 ? (
              <VariantGeneratorSection 
                variants={variants}
                onUpdateVariant={handleUpdateVariant}
                onBulkApplyPrice={handleBulkApplyPrice}
                onBulkApplyStock={handleBulkApplyStock}
              />
            ) : (
              <SinglePriceStockSection 
                mrp={mrp}
                setMrp={setMrp}
                sellingPrice={sellingPrice}
                setSellingPrice={setSellingPrice}
                stockQuantity={stockQuantity}
                setStockQuantity={setStockQuantity}
                gstRate={gstRate}
              />
            )}

            {/* Step 4: Product Identity & Narrative */}
            <ProductBasicInfoSection 
              title={title}
              setTitle={setTitle}
              brand={brand}
              setBrand={setBrand}
              subtitle={subtitle}
              setSubtitle={setSubtitle}
              description={description}
              setDescription={setDescription}
              baseSku={baseSku}
              setBaseSku={setBaseSku}
            />

            {/* Step 5: Studio Media Gallery */}
            <ProductMediaSection productId={savedProductId} />

            {/* Step 6: Shipping & Logistics */}
            <ShippingComplianceSection 
              weightKg={weightKg}
              setWeightKg={setWeightKg}
              dimensions={dimensions}
              setDimensions={setDimensions}
              hsnCode={hsnCode}
              setHsnCode={setHsnCode}
              gstRate={gstRate}
              setGstRate={setGstRate}
              countryOfOrigin={countryOfOrigin}
              setCountryOfOrigin={setCountryOfOrigin}
              inheritShippingPolicy={inheritShippingPolicy}
              setInheritShippingPolicy={setInheritShippingPolicy}
              inheritReturnPolicy={inheritReturnPolicy}
              setInheritReturnPolicy={setInheritReturnPolicy}
            />

            {/* Step 7: SEO Metadata */}
            <SeoMetadataSection 
              metaTitle={metaTitle}
              setMetaTitle={setMetaTitle}
              metaDescription={metaDescription}
              setMetaDescription={setMetaDescription}
              title={title}
              brand={brand}
              sellingPrice={sellingPrice}
            />

          </div>

          {/* Right: Governance Status, Live Checklist & SLA Cards (4 Cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Listing Completion Checklist */}
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
                <h3 className="font-['Outfit'] font-extrabold text-sm text-[#FA661C]">
                  Listing Readiness Checklist
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  validationErrors.length === 0 ? 'bg-[#FFF3EC] text-[#FA661C]' : 'bg-[#FDE8EA] text-[#D7263D]'
                }`}>
                  {validationErrors.length === 0 ? 'Form Ready' : `${validationErrors.length} Pending`}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6058]">Category & Schema</span>
                  {selectedCategory ? (
                    <CheckCircle2 className="w-4 h-4 text-[#FA661C]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#D7263D]" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6058]">Required Specifications</span>
                  {(categoryAttributes.length > 0 ? categoryAttributes : (selectedCategory?.attributes || []))
                    .filter(a => a.is_required || a.required)
                    .every(a => attributeValues[a.id]) ? (
                    <CheckCircle2 className="w-4 h-4 text-[#FA661C]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#D7263D]" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6058]">Pricing & Variations ({variants.length > 0 ? `${variants.length} Variants` : 'Single'})</span>
                  <CheckCircle2 className="w-4 h-4 text-[#FA661C]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6058]">Product Identity & HSN</span>
                  {title && brand && description ? (
                    <CheckCircle2 className="w-4 h-4 text-[#FA661C]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#D7263D]" />
                  )}
                </div>
              </div>
            </div>

            {/* Pending Attribute Governance Queue Widget */}
            <PendingRequestsSidebarWidget 
              onOpenGenericRequest={() => setRequestModalAttr(categoryAttributes[0] || selectedCategory?.attributes?.[0])}
            />

            {/* Merchant SLA Card */}
            <div className="bg-gradient-to-br from-[#FA661C] via-[#16523F] to-[#FA661C] text-[#FFFFFF] rounded-3xl p-5 border border-[#FF811A]/40 shadow-sm relative overflow-hidden text-xs">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF811A]/15 rounded-full blur-xl pointer-events-none" />
              
              <div className="relative z-10 space-y-2">
                <div className="flex items-center space-x-1.5 text-[#FF811A] font-bold uppercase tracking-wider text-[10px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Verified Merchant Privilege</span>
                </div>
                <h4 className="font-['Outfit'] font-bold text-sm text-[#FFFFFF]">
                  Governance Review Integration
                </h4>
                <p className="text-[11px] text-[#FFFFFF]/80 leading-relaxed">
                  Listings submitted go through real backend compliance checks based on merchant trust level and category policies.
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* 3. Sticky Bottom Action Bar */}
      <StickyActionBar 
        onSaveDraft={handleSaveDraft}
        onSubmitListing={handleSubmitListing}
        isSubmitting={isSubmitting}
        isSavingDraft={isSavingDraft}
        validationErrors={validationErrors}
      />

      {/* 4. Request New Attribute Option Governance Modal */}
      <RequestValueModal 
        isOpen={Boolean(requestModalAttr)}
        onClose={() => setRequestModalAttr(null)}
        attribute={requestModalAttr}
        category={selectedCategory}
      />

    </div>
  );
}
