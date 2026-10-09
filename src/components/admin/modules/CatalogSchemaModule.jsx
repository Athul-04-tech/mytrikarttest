import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Tag,
  Check,
  X,
  ChevronRight,
  ShieldAlert,
  Info,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

export default function CatalogSchemaModule() {
  const toast = useToast();

  // Categories list state
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Attributes state for selected category
  const [attributes, setAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);

  // Allowed values state for selected attribute
  const [allowedValues, setAllowedValues] = useState([]);
  const [loadingValues, setLoadingValues] = useState(false);

  // Search & Filter
  const [categorySearch, setCategorySearch] = useState('');

  // Conflict / Server Error banner state
  const [actionError, setActionError] = useState(null);

  // Modal States
  // 1. Category Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState('create'); // 'create' | 'edit'
  const [catFormData, setCatFormData] = useState({ id: null, name: '', slug: '', parent: '', is_active: true, always_requires_review: false });
  const [submittingCat, setSubmittingCat] = useState(false);

  // 2. Attribute Modal
  const [attributeModalOpen, setAttributeModalOpen] = useState(false);
  const [attributeModalMode, setAttributeModalMode] = useState('create');
  const [attrFormData, setAttrFormData] = useState({ id: null, attribute_name: '', field_type: 'dropdown', is_required: false, is_variation_capable: false, display_order: 1 });
  const [submittingAttr, setSubmittingAttr] = useState(false);

  // 3. Allowed Value Modal
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [valueModalMode, setValueModalMode] = useState('create');
  const [valFormData, setValFormData] = useState({ id: null, value: '', display_order: 1 });
  const [submittingVal, setSubmittingVal] = useState(false);

  // Fetch Categories
  const fetchCategories = async () => {
    setLoadingCategories(true);
    setActionError(null);
    try {
      const data = await apiRequest('/api/products/admin/categories/');
      const cats = Array.isArray(data) ? data : (data.results || []);
      setCategories(cats);
      
      // Auto select first category if none selected
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0]);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setActionError(err.data?.detail || err.message || "Failed to load categories.");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch Attributes when Selected Category changes
  const fetchAttributes = async (categoryId) => {
    if (!categoryId) {
      setAttributes([]);
      setSelectedAttribute(null);
      return;
    }
    setLoadingAttributes(true);
    setActionError(null);
    try {
      const data = await apiRequest(`/api/products/admin/categories/${categoryId}/attributes/`);
      const attrs = Array.isArray(data) ? data : (data.results || []);
      setAttributes(attrs);
      // Auto select first dropdown attribute if available
      if (attrs.length > 0) {
        const firstDropdown = attrs.find(a => a.field_type === 'dropdown') || attrs[0];
        setSelectedAttribute(firstDropdown);
      } else {
        setSelectedAttribute(null);
      }
    } catch (err) {
      console.error(`Failed to fetch attributes for category ${categoryId}:`, err);
      setActionError(err.data?.detail || err.message || "Failed to load category attributes.");
    } finally {
      setLoadingAttributes(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchAttributes(selectedCategory.id);
    }
  }, [selectedCategory?.id]);

  // Fetch Allowed Values when Selected Attribute changes
  const fetchAllowedValues = async (attributeId) => {
    if (!attributeId) {
      setAllowedValues([]);
      return;
    }
    setLoadingValues(true);
    setActionError(null);
    try {
      const data = await apiRequest(`/api/products/admin/category-attributes/${attributeId}/values/`);
      const vals = Array.isArray(data) ? data : (data.results || []);
      setAllowedValues(vals);
    } catch (err) {
      console.error(`Failed to fetch allowed values for attribute ${attributeId}:`, err);
      setActionError(err.data?.detail || err.message || "Failed to load attribute values.");
    } finally {
      setLoadingValues(false);
    }
  };

  useEffect(() => {
    if (selectedAttribute && selectedAttribute.field_type === 'dropdown') {
      fetchAllowedValues(selectedAttribute.id);
    } else {
      setAllowedValues([]);
    }
  }, [selectedAttribute?.id]);

  // Auto-generate slug helper
  const handleCatNameChange = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setCatFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') ? slug : prev.slug
    }));
  };

  // --- CATEGORY ACTIONS ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSubmittingCat(true);
    setActionError(null);

    const payload = {
      name: catFormData.name,
      slug: catFormData.slug,
      parent: catFormData.parent ? Number(catFormData.parent) : null,
      is_active: catFormData.is_active,
      always_requires_review: catFormData.always_requires_review,
    };

    try {
      if (categoryModalMode === 'create') {
        const res = await apiRequest('/api/products/admin/categories/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast?.success("Category Created", `Category "${res.name}" added to catalog schema.`);
        fetchCategories();
        setSelectedCategory(res);
      } else {
        const res = await apiRequest(`/api/products/admin/categories/${catFormData.id}/`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast?.success("Category Updated", `Category "${res.name}" updated successfully.`);
        fetchCategories();
        if (selectedCategory?.id === res.id) setSelectedCategory(res);
      }
      setCategoryModalOpen(false);
    } catch (err) {
      console.error("Save Category Error:", err);
      const msg = err.data?.detail
        ? (Array.isArray(err.data.detail) ? err.data.detail.join(' ') : err.data.detail)
        : (err.message || "Failed to save category.");
      setActionError(msg);
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    setActionError(null);

    try {
      await apiRequest(`/api/products/admin/categories/${cat.id}/`, {
        method: 'DELETE',
      });
      toast?.success("Category Deleted", `Category "${cat.name}" removed.`);
      if (selectedCategory?.id === cat.id) setSelectedCategory(null);
      fetchCategories();
    } catch (err) {
      console.error("Delete Category Error:", err);
      const msg = err.data?.detail
        ? (Array.isArray(err.data.detail) ? err.data.detail.join(' ') : err.data.detail)
        : (err.message || "Failed to delete category.");
      setActionError(`Category "${cat.name}": ${msg}`);
    }
  };

  // --- ATTRIBUTE ACTIONS ---
  const handleSaveAttribute = async (e) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setSubmittingAttr(true);
    setActionError(null);

    const payload = {
      attribute_name: attrFormData.attribute_name,
      field_type: attrFormData.field_type,
      is_required: attrFormData.is_required,
      is_variation_capable: attrFormData.is_variation_capable,
      display_order: Number(attrFormData.display_order || 0),
    };

    try {
      if (attributeModalMode === 'create') {
        const res = await apiRequest(`/api/products/admin/categories/${selectedCategory.id}/attributes/`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast?.success("Attribute Created", `Attribute "${res.attribute_name}" defined for category.`);
        fetchAttributes(selectedCategory.id);
        setSelectedAttribute(res);
      } else {
        const res = await apiRequest(`/api/products/admin/category-attributes/${attrFormData.id}/`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast?.success("Attribute Updated", `Attribute "${res.attribute_name}" updated successfully.`);
        fetchAttributes(selectedCategory.id);
        if (selectedAttribute?.id === res.id) setSelectedAttribute(res);
      }
      setAttributeModalOpen(false);
    } catch (err) {
      console.error("Save Attribute Error:", err);
      const msg = err.data?.detail
        ? (Array.isArray(err.data.detail) ? err.data.detail.join(' ') : err.data.detail)
        : (err.message || "Failed to save category attribute.");
      setActionError(msg);
    } finally {
      setSubmittingAttr(false);
    }
  };

  const handleDeleteAttribute = async (attr) => {
    if (!window.confirm(`Are you sure you want to delete attribute "${attr.attribute_name}"?`)) return;
    setActionError(null);

    try {
      await apiRequest(`/api/products/admin/category-attributes/${attr.id}/`, {
        method: 'DELETE',
      });
      toast?.success("Attribute Deleted", `Attribute "${attr.attribute_name}" removed.`);
      if (selectedAttribute?.id === attr.id) setSelectedAttribute(null);
      fetchAttributes(selectedCategory.id);
    } catch (err) {
      console.error("Delete Attribute Error:", err);
      const msg = err.data?.detail
        ? (Array.isArray(err.data.detail) ? err.data.detail.join(' ') : err.data.detail)
        : (err.message || "Failed to delete attribute.");
      setActionError(`Attribute "${attr.attribute_name}": ${msg}`);
    }
  };

  // --- ALLOWED VALUE ACTIONS ---
  const handleSaveValue = async (e) => {
    e.preventDefault();
    if (!selectedAttribute) return;

    setSubmittingVal(true);
    setActionError(null);

    const payload = {
      value: valFormData.value,
      display_order: Number(valFormData.display_order || 0),
    };

    try {
      if (valueModalMode === 'create') {
        const res = await apiRequest(`/api/products/admin/category-attributes/${selectedAttribute.id}/values/`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast?.success("Allowed Value Added", `Value "${res.value}" added to ${selectedAttribute.attribute_name}.`);
        fetchAllowedValues(selectedAttribute.id);
      } else {
        const res = await apiRequest(`/api/products/admin/category-attribute-values/${valFormData.id}/`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast?.success("Allowed Value Updated", `Value updated to "${res.value}".`);
        fetchAllowedValues(selectedAttribute.id);
      }
      setValueModalOpen(false);
    } catch (err) {
      console.error("Save Allowed Value Error:", err);
      const msg = err.data?.detail
        ? (Array.isArray(err.data.detail) ? err.data.detail.join(' ') : err.data.detail)
        : (err.message || "Failed to save allowed value.");
      setActionError(msg);
    } finally {
      setSubmittingVal(false);
    }
  };

  const handleDeleteValue = async (val) => {
    if (!window.confirm(`Are you sure you want to delete allowed value "${val.value}"?`)) return;
    setActionError(null);

    try {
      await apiRequest(`/api/products/admin/category-attribute-values/${val.id}/`, {
        method: 'DELETE',
      });
      toast?.success("Allowed Value Deleted", `Value "${val.value}" removed.`);
      fetchAllowedValues(selectedAttribute.id);
    } catch (err) {
      console.error("Delete Allowed Value Error:", err);
      const msg = err.data?.detail
        ? (Array.isArray(err.data.detail) ? err.data.detail.join(' ') : err.data.detail)
        : (err.message || "Failed to delete allowed value.");
      setActionError(`Allowed Value "${val.value}": ${msg}`);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    c.slug.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
              <Boxes className="w-5 h-5" />
            </span>
            <h2 className="font-['Outfit'] font-black text-2xl text-[#FA661C]">
              Category &amp; Schema Management
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-1">
            Catalog Governance: Define categories, dynamic attributes, variation flags, and allowed values.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setCatFormData({ id: null, name: '', slug: '', parent: '', is_active: true, always_requires_review: false });
              setCategoryModalMode('create');
              setCategoryModalOpen(true);
            }}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#FF811A] text-white text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </button>
        </div>
      </div>

      {/* 2. Admin Defines, Seller Selects Banner */}
      <div className="p-4 bg-gradient-to-r from-[#FFF3EC] to-white border border-[#EAE3DC] rounded-2xl flex items-start space-x-3 shadow-xs">
        <Sparkles className="w-5 h-5 text-[#FA661C] shrink-0 mt-0.5" />
        <div className="text-xs text-[#6B6058] flex-1">
          <span className="font-extrabold text-[#FA661C] uppercase tracking-wider block">
            "Admin Defines, Seller Selects" Governance Architecture
          </span>
          Categories and attributes configured here directly dictate the dynamic input forms, variation fields, and dropdown choices presented to merchants when listing products on the Seller Portal.
          <span className="text-[#D7263D] font-bold block mt-0.5">
            Note: Categories, attributes, or values currently used by existing products cannot be deleted.
          </span>
        </div>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-2xl flex items-start space-x-3 text-xs text-[#D7263D] animate-shake shadow-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#D7263D]" />
          <div className="flex-1">
            <div className="font-extrabold uppercase">Deletion Protection Active</div>
            <p className="mt-0.5 font-medium">{actionError}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="p-1 text-[#D7263D] hover:bg-[#FCD34D]/20 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Three-Column Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANE 1: Categories Tree / List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE3DC] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
            <div className="flex items-center space-x-2">
              <FolderTree className="w-4 h-4 text-[#FA661C]" />
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
                Categories ({categories.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={fetchCategories}
              disabled={loadingCategories}
              className="p-1.5 rounded-lg bg-[#FFF8F2] hover:bg-[#FFF3EC] text-[#FA661C] border border-[#EAE3DC] cursor-pointer"
              title="Refresh Categories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCategories ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className="w-full bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl px-3 py-2 text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
          />

          {/* Category List */}
          {loadingCategories ? (
            <div className="p-6 text-center text-xs text-[#6B6058] animate-pulse">
              Loading category hierarchy...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl">
              No categories found.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                const parentCat = cat.parent ? categories.find(c => c.id === cat.parent) : null;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FFF3EC] border-[#FA661C] shadow-xs'
                        : 'bg-white border-[#EAE3DC] hover:bg-[#FFF8F2]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-bold text-xs truncate ${isSelected ? 'text-[#FA661C]' : 'text-[#1A2420]'}`}>
                          {cat.name}
                        </span>
                        {!cat.is_active && (
                          <span className="bg-[#F1F5F9] text-[#64748B] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-[#6B6058]">
                        <span className="font-mono">slug: {cat.slug}</span>
                        {parentCat && (
                          <span className="bg-[#FFF8F2] px-1.5 py-0.5 rounded text-[#FA661C] font-semibold">
                            parent: {parentCat.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCatFormData({
                            id: cat.id,
                            name: cat.name,
                            slug: cat.slug,
                            parent: cat.parent || '',
                            is_active: cat.is_active,
                            always_requires_review: cat.always_requires_review,
                          });
                          setCategoryModalMode('edit');
                          setCategoryModalOpen(true);
                        }}
                        className="p-1 rounded-lg bg-white hover:bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C] border border-[#EAE3DC]"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat);
                        }}
                        className="p-1 rounded-lg bg-white hover:bg-[#FDE8EA] text-[#6B6058] hover:text-[#D7263D] border border-[#EAE3DC]"
                        title="Delete Category (Protected if in use)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#FA661C]' : 'text-[#6B6058]'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PANE 2: Category Attributes Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE3DC] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
            <div>
              <div className="flex items-center space-x-1.5">
                <SlidersHorizontal className="w-4 h-4 text-[#FA661C]" />
                <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
                  Attributes ({attributes.length})
                </h3>
              </div>
              {selectedCategory && (
                <span className="text-[10px] text-[#6B6058] font-bold block truncate max-w-xs mt-0.5">
                  Category: {selectedCategory.name}
                </span>
              )}
            </div>

            {selectedCategory && (
              <button
                type="button"
                onClick={() => {
                  setAttrFormData({ id: null, attribute_name: '', field_type: 'dropdown', is_required: false, is_variation_capable: false, display_order: attributes.length + 1 });
                  setAttributeModalMode('create');
                  setAttributeModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#FA661C] hover:bg-[#FF811A] text-white text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Attr</span>
              </button>
            )}
          </div>

          {!selectedCategory ? (
            <div className="p-8 text-center text-xs text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl">
              Select a category on the left to manage its custom attributes.
            </div>
          ) : loadingAttributes ? (
            <div className="p-6 text-center text-xs text-[#6B6058] animate-pulse">
              Loading category attributes...
            </div>
          ) : attributes.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl space-y-2">
              <p>No attributes defined for "{selectedCategory.name}".</p>
              <button
                type="button"
                onClick={() => {
                  setAttrFormData({ id: null, attribute_name: '', field_type: 'dropdown', is_required: false, is_variation_capable: false, display_order: 1 });
                  setAttributeModalMode('create');
                  setAttributeModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#FFF3EC] hover:bg-[#FFE3D1] text-[#FA661C] text-xs font-bold rounded-xl cursor-pointer"
              >
                + Define First Attribute
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {attributes.map((attr) => {
                const isSelected = selectedAttribute?.id === attr.id;

                return (
                  <div
                    key={attr.id}
                    onClick={() => setSelectedAttribute(attr)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF3EC] border-[#FA661C] shadow-xs'
                        : 'bg-white border-[#EAE3DC] hover:bg-[#FFF8F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-xs ${isSelected ? 'text-[#FA661C]' : 'text-[#1A2420]'}`}>
                        {attr.attribute_name}
                      </span>

                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setAttrFormData({
                              id: attr.id,
                              attribute_name: attr.attribute_name,
                              field_type: attr.field_type,
                              is_required: attr.is_required,
                              is_variation_capable: attr.is_variation_capable,
                              display_order: attr.display_order,
                            });
                            setAttributeModalMode('edit');
                            setAttributeModalOpen(true);
                          }}
                          className="p-1 rounded-lg bg-white hover:bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C] border border-[#EAE3DC]"
                          title="Edit Attribute"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttribute(attr)}
                          className="p-1 rounded-lg bg-white hover:bg-[#FDE8EA] text-[#6B6058] hover:text-[#D7263D] border border-[#EAE3DC]"
                          title="Delete Attribute (Protected if in use)"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Attribute Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="bg-[#FFF8F2] text-[#FA661C] border border-[#FA661C]/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                        {attr.field_type}
                      </span>
                      {attr.is_variation_capable && (
                        <span className="bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/30 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">
                          Variation Capable
                        </span>
                      )}
                      {attr.is_required ? (
                        <span className="bg-[#FDE8EA] text-[#D7263D] px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                          Required
                        </span>
                      ) : (
                        <span className="bg-[#F1F5F9] text-[#64748B] px-1.5 py-0.5 rounded-md text-[9px]">
                          Optional
                        </span>
                      )}
                      <span className="text-[10px] text-[#6B6058] ml-auto">Order: {attr.display_order}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PANE 3: Allowed Values Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE3DC] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
            <div>
              <div className="flex items-center space-x-1.5">
                <Tag className="w-4 h-4 text-[#FA661C]" />
                <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
                  Allowed Values ({allowedValues.length})
                </h3>
              </div>
              {selectedAttribute && (
                <span className="text-[10px] text-[#6B6058] font-bold block truncate max-w-xs mt-0.5">
                  Attr: {selectedAttribute.attribute_name} ({selectedAttribute.field_type})
                </span>
              )}
            </div>

            {selectedAttribute && selectedAttribute.field_type === 'dropdown' && (
              <button
                type="button"
                onClick={() => {
                  setValFormData({ id: null, value: '', display_order: allowedValues.length + 1 });
                  setValueModalMode('create');
                  setValueModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#FA661C] hover:bg-[#FF811A] text-white text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Value</span>
              </button>
            )}
          </div>

          {!selectedAttribute ? (
            <div className="p-8 text-center text-xs text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl">
              Select an attribute to manage its allowed dropdown values.
            </div>
          ) : selectedAttribute.field_type !== 'dropdown' ? (
            <div className="p-8 text-center text-xs text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl space-y-1">
              <Info className="w-5 h-5 text-[#FA661C] mx-auto mb-1" />
              <div className="font-bold text-[#1A2420]">Free-form Attribute</div>
              <p>"{selectedAttribute.attribute_name}" is of type <code className="bg-[#FFF8F2] text-[#FA661C] px-1 py-0.5 rounded font-mono">{selectedAttribute.field_type}</code>. Sellers input raw values directly during product listing.</p>
            </div>
          ) : loadingValues ? (
            <div className="p-6 text-center text-xs text-[#6B6058] animate-pulse">
              Loading allowed values...
            </div>
          ) : allowedValues.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl space-y-2">
              <p>No allowed values defined for "{selectedAttribute.attribute_name}".</p>
              <button
                type="button"
                onClick={() => {
                  setValFormData({ id: null, value: '', display_order: 1 });
                  setValueModalMode('create');
                  setValueModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#FFF3EC] hover:bg-[#FFE3D1] text-[#FA661C] text-xs font-bold rounded-xl cursor-pointer"
              >
                + Define First Allowed Value
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {allowedValues.map((val) => (
                <div
                  key={val.id}
                  className="p-3 bg-white hover:bg-[#FFF8F2] border border-[#EAE3DC] rounded-2xl flex items-center justify-between transition-all"
                >
                  <div>
                    <span className="font-bold text-xs text-[#1A2420] block">{val.value}</span>
                    <span className="text-[10px] text-[#6B6058]">Display Order: {val.display_order}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        setValFormData({
                          id: val.id,
                          value: val.value,
                          display_order: val.display_order,
                        });
                        setValueModalMode('edit');
                        setValueModalOpen(true);
                      }}
                      className="p-1 rounded-lg bg-white hover:bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C] border border-[#EAE3DC]"
                      title="Edit Value"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteValue(val)}
                      className="p-1 rounded-lg bg-white hover:bg-[#FDE8EA] text-[#6B6058] hover:text-[#D7263D] border border-[#EAE3DC]"
                      title="Delete Allowed Value (Protected if in use)"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 5. MODALS */}

      {/* A. CATEGORY MODAL */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-[#FFF3EC] p-5 border-b border-[#EAE3DC] flex items-center justify-between">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C]">
                {categoryModalMode === 'create' ? 'Create New Category' : `Edit Category #${catFormData.id}`}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1.5 rounded-xl bg-white hover:bg-[#FFF8F2] text-[#6B6058] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1A2420] block">Category Name <span className="text-[#D7263D]">*</span></label>
                <input
                  type="text"
                  required
                  value={catFormData.name}
                  onChange={(e) => handleCatNameChange(e.target.value)}
                  placeholder="e.g. Consumer Electronics"
                  className="w-full bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl p-2.5 text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A2420] block">URL Slug <span className="text-[#D7263D]">*</span></label>
                <input
                  type="text"
                  required
                  value={catFormData.slug}
                  onChange={(e) => setCatFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g. consumer-electronics"
                  className="w-full bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl p-2.5 text-xs font-mono text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A2420] block">Parent Category (Optional)</label>
                <select
                  value={catFormData.parent}
                  onChange={(e) => setCatFormData(prev => ({ ...prev, parent: e.target.value }))}
                  className="w-full bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl p-2.5 text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
                >
                  <option value="">-- None (Root Category) --</option>
                  {categories.filter(c => c.id !== catFormData.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catFormData.is_active}
                    onChange={(e) => setCatFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded text-[#FA661C] focus:ring-[#FA661C]"
                  />
                  <span className="font-bold text-[#1A2420]">Is Active</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catFormData.always_requires_review}
                    onChange={(e) => setCatFormData(prev => ({ ...prev, always_requires_review: e.target.checked }))}
                    className="rounded text-[#FA661C] focus:ring-[#FA661C]"
                  />
                  <span className="font-bold text-[#1A2420]">Require Review</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#EAE3DC] text-[#6B6058] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCat}
                  className="px-5 py-2 rounded-xl bg-[#FA661C] hover:bg-[#FF811A] text-white font-bold disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                >
                  {submittingCat ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. ATTRIBUTE MODAL */}
      {attributeModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-[#FFF3EC] p-5 border-b border-[#EAE3DC] flex items-center justify-between">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C]">
                {attributeModalMode === 'create' ? `Add Attribute to ${selectedCategory.name}` : `Edit Attribute #${attrFormData.id}`}
              </h3>
              <button
                type="button"
                onClick={() => setAttributeModalOpen(false)}
                className="p-1.5 rounded-xl bg-white hover:bg-[#FFF8F2] text-[#6B6058] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttribute} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1A2420] block">Attribute Name <span className="text-[#D7263D]">*</span></label>
                <input
                  type="text"
                  required
                  value={attrFormData.attribute_name}
                  onChange={(e) => setAttrFormData(prev => ({ ...prev, attribute_name: e.target.value }))}
                  placeholder="e.g. Storage Capacity, Color, Screen Size"
                  className="w-full bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl p-2.5 text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A2420] block">Field Type <span className="text-[#D7263D]">*</span></label>
                <select
                  value={attrFormData.field_type}
                  onChange={(e) => setAttrFormData(prev => ({ ...prev, field_type: e.target.value }))}
                  className="w-full bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl p-2.5 text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
                >
                  <option value="dropdown">Dropdown (Allowed Values)</option>
                  <option value="text">Text (Free Form)</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean (Yes/No)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A2420] block">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={attrFormData.display_order}
                  onChange={(e) => setAttrFormData(prev => ({ ...prev, display_order: e.target.value }))}
                  className="w-full bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl p-2.5 text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
                />
              </div>

              <div className="p-3 bg-[#FFF8F2] rounded-2xl border border-[#EAE3DC] space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attrFormData.is_variation_capable}
                    onChange={(e) => setAttrFormData(prev => ({ ...prev, is_variation_capable: e.target.checked }))}
                    className="rounded text-[#FA661C] focus:ring-[#FA661C]"
                  />
                  <div>
                    <span className="font-extrabold text-[#FA661C] block">is_variation_capable</span>
                    <span className="text-[10px] text-[#6B6058]">Allows sellers to generate SKU variants (e.g. Size/Color combinations).</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer pt-1 border-t border-[#EAE3DC]">
                  <input
                    type="checkbox"
                    checked={attrFormData.is_required}
                    onChange={(e) => setAttrFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                    className="rounded text-[#FA661C] focus:ring-[#FA661C]"
                  />
                  <div>
                    <span className="font-bold text-[#1A2420] block">Is Required</span>
                    <span className="text-[10px] text-[#6B6058]">Mandatory attribute when creating product in this category.</span>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAttributeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#EAE3DC] text-[#6B6058] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAttr}
                  className="px-5 py-2 rounded-xl bg-[#FA661C] hover:bg-[#FF811A] text-white font-bold disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                >
                  {submittingAttr ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Attribute</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. ALLOWED VALUE MODAL */}
      {valueModalOpen && selectedAttribute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-[#FFF3EC] p-5 border-b border-[#EAE3DC] flex items-center justify-between">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C]">
                {valueModalMode === 'create' ? `Add Allowed Value to ${selectedAttribute.attribute_name}` : `Edit Value #${valFormData.id}`}
              </h3>
              <button
                type="button"
                onClick={() => setValueModalOpen(false)}
                className="p-1.5 rounded-xl bg-white hover:bg-[#FFF8F2] text-[#6B6058] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveValue} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1A2420] block">Allowed Value <span className="text-[#D7263D]">*</span></label>
                <input
                  type="text"
                  required
                  value={valFormData.value}
                  onChange={(e) => setValFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="e.g. 256 GB, Red, Stainless Steel"
                  className="w-full bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl p-2.5 text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1A2420] block">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={valFormData.display_order}
                  onChange={(e) => setValFormData(prev => ({ ...prev, display_order: e.target.value }))}
                  className="w-full bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl p-2.5 text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setValueModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#EAE3DC] text-[#6B6058] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVal}
                  className="px-5 py-2 rounded-xl bg-[#FA661C] hover:bg-[#FF811A] text-white font-bold disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                >
                  {submittingVal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Allowed Value</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
