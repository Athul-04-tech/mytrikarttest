import React, { useState, useEffect } from 'react';
import { 
  FileText, Image, BookOpen, HelpCircle, ShieldCheck, 
  Plus, Edit, Trash2, Globe, Eye, CheckCircle2, AlertCircle, 
  RefreshCw, X, ArrowUpRight, Search, Lock, Calendar, Layers
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

export default function CmsModule() {
  const [activeTab, setActiveTab] = useState('pages');
  const toast = useToast();

  // Data States
  const [pages, setPages] = useState([]);
  const [banners, setBanners] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [faqCategories, setFaqCategories] = useState([]);
  const [faqItems, setFaqItems] = useState([]);
  const [agreements, setAgreements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Form State
  const [modalType, setModalType] = useState(null); // 'create_page', 'edit_page', 'create_banner', 'edit_banner', 'create_post', 'edit_post', 'create_faq_cat', 'edit_faq_cat', 'create_faq_item', 'edit_faq_item', 'create_agreement', 'view_agreement'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, item, name }

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pagesRes, bannersRes, blogRes, faqCatRes, faqItemRes, agreementsRes] = await Promise.all([
        apiRequest('/api/cms/admin/pages/').catch(() => []),
        apiRequest('/api/cms/admin/banners/').catch(() => []),
        apiRequest('/api/cms/admin/blog-posts/').catch(() => []),
        apiRequest('/api/cms/admin/faq-categories/').catch(() => []),
        apiRequest('/api/cms/admin/faq-items/').catch(() => []),
        apiRequest('/api/cms/admin/agreement-versions/').catch(() => []),
      ]);

      setPages(Array.isArray(pagesRes) ? pagesRes : (pagesRes.results || []));
      setBanners(Array.isArray(bannersRes) ? bannersRes : (bannersRes.results || []));
      setBlogPosts(Array.isArray(blogRes) ? blogRes : (blogRes.results || []));
      setFaqCategories(Array.isArray(faqCatRes) ? faqCatRes : (faqCatRes.results || []));
      setFaqItems(Array.isArray(faqItemRes) ? faqItemRes : (faqItemRes.results || []));
      setAgreements(Array.isArray(agreementsRes) ? agreementsRes : (agreementsRes.results || []));
    } catch (err) {
      console.error("Failed to load CMS data:", err);
      setError(err.data?.detail || err.message || "Failed to retrieve CMS content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setFormError(null);

    if (type.includes('page')) {
      setFormData(item ? { ...item } : {
        title: '',
        slug: '',
        body: '',
        meta_title: '',
        meta_description: '',
        og_title: '',
        og_description: '',
        twitter_title: '',
        twitter_description: '',
        noindex: false
      });
    } else if (type.includes('banner')) {
      setFormData(item ? {
        title: item.title || '',
        image_url: item.image_url || '',
        link_url: item.link_url || '',
        placement: item.placement || 'homepage_hero',
        start_date: item.start_date || '',
        end_date: item.end_date || '',
        is_active: item.is_active !== undefined ? item.is_active : true,
        display_order: item.display_order || 0
      } : {
        title: '',
        image_url: '',
        link_url: '',
        placement: 'homepage_hero',
        start_date: '',
        end_date: '',
        is_active: true,
        display_order: 0
      });
    } else if (type.includes('post')) {
      setFormData(item ? { ...item } : {
        title: '',
        slug: '',
        excerpt: '',
        body: '',
        featured_image_url: '',
        tags: '',
        meta_title: '',
        meta_description: '',
        og_title: '',
        og_description: '',
        twitter_title: '',
        twitter_description: '',
        noindex: false
      });
    } else if (type.includes('faq_cat')) {
      setFormData(item ? { ...item } : {
        title: '',
        slug: '',
        display_order: 0
      });
    } else if (type.includes('faq_item')) {
      setFormData(item ? {
        category: item.category || (faqCategories[0]?.id || ''),
        question: item.question || '',
        answer: item.answer || '',
        is_active: item.is_active !== undefined ? item.is_active : true,
        display_order: item.display_order || 0
      } : {
        category: faqCategories[0]?.id || '',
        question: '',
        answer: '',
        is_active: true,
        display_order: 0
      });
    } else if (type.includes('agreement')) {
      setFormData(item ? { ...item } : {
        agreement_type: 'terms',
        version: '',
        title: '',
        body: ''
      });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setFormData({});
    setFormError(null);
  };

  // Helper for auto-generating slug from title
  const handleTitleChange = (titleVal) => {
    setFormData(prev => {
      const slugVal = titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return {
        ...prev,
        title: titleVal,
        slug: prev.slug === undefined || prev.slug === '' || prev.slug === prev.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') ? slugVal : prev.slug
      };
    });
  };

  // --- Actions: Create/Edit Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (modalType === 'create_page') {
        const payload = {
          title: formData.title,
          slug: formData.slug,
          body: formData.body,
          meta_title: formData.meta_title || '',
          meta_description: formData.meta_description || '',
          og_title: formData.og_title || '',
          og_description: formData.og_description || '',
          twitter_title: formData.twitter_title || '',
          twitter_description: formData.twitter_description || '',
          noindex: Boolean(formData.noindex)
        };
        const created = await apiRequest('/api/cms/admin/pages/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setPages(prev => [created, ...prev]);
        toast.success("Page Created", `CMS Page "${created.title}" successfully created.`);
      } else if (modalType === 'edit_page') {
        const payload = {
          title: formData.title,
          slug: formData.slug,
          body: formData.body,
          meta_title: formData.meta_title || '',
          meta_description: formData.meta_description || '',
          og_title: formData.og_title || '',
          og_description: formData.og_description || '',
          twitter_title: formData.twitter_title || '',
          twitter_description: formData.twitter_description || '',
          noindex: Boolean(formData.noindex)
        };
        const updated = await apiRequest(`/api/cms/admin/pages/${selectedItem.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
        toast.success("Page Updated", `CMS Page "${updated.title}" updated successfully.`);
      } else if (modalType === 'create_banner') {
        const payload = {
          title: formData.title,
          image_url: formData.image_url,
          link_url: formData.link_url || '',
          placement: formData.placement,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          is_active: Boolean(formData.is_active),
          display_order: parseInt(formData.display_order || 0, 10)
        };
        const created = await apiRequest('/api/cms/admin/banners/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setBanners(prev => [...prev, created]);
        toast.success("Banner Created", `Banner "${created.title}" added successfully.`);
      } else if (modalType === 'edit_banner') {
        const payload = {
          title: formData.title,
          image_url: formData.image_url,
          link_url: formData.link_url || '',
          placement: formData.placement,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          is_active: Boolean(formData.is_active),
          display_order: parseInt(formData.display_order || 0, 10)
        };
        const updated = await apiRequest(`/api/cms/admin/banners/${selectedItem.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        setBanners(prev => prev.map(b => b.id === updated.id ? updated : b));
        toast.success("Banner Updated", `Banner "${updated.title}" updated.`);
      } else if (modalType === 'create_post') {
        const payload = {
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt || '',
          body: formData.body,
          featured_image_url: formData.featured_image_url || '',
          tags: formData.tags || '',
          meta_title: formData.meta_title || '',
          meta_description: formData.meta_description || '',
          og_title: formData.og_title || '',
          og_description: formData.og_description || '',
          twitter_title: formData.twitter_title || '',
          twitter_description: formData.twitter_description || '',
          noindex: Boolean(formData.noindex)
        };
        const created = await apiRequest('/api/cms/admin/blog-posts/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setBlogPosts(prev => [created, ...prev]);
        toast.success("Blog Post Created", `Post "${created.title}" created.`);
      } else if (modalType === 'edit_post') {
        const payload = {
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt || '',
          body: formData.body,
          featured_image_url: formData.featured_image_url || '',
          tags: formData.tags || '',
          meta_title: formData.meta_title || '',
          meta_description: formData.meta_description || '',
          og_title: formData.og_title || '',
          og_description: formData.og_description || '',
          twitter_title: formData.twitter_title || '',
          twitter_description: formData.twitter_description || '',
          noindex: Boolean(formData.noindex)
        };
        const updated = await apiRequest(`/api/cms/admin/blog-posts/${selectedItem.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        setBlogPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
        toast.success("Blog Post Updated", `Post "${updated.title}" updated.`);
      } else if (modalType === 'create_faq_cat') {
        const payload = {
          title: formData.title,
          slug: formData.slug,
          display_order: parseInt(formData.display_order || 0, 10)
        };
        const created = await apiRequest('/api/cms/admin/faq-categories/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setFaqCategories(prev => [...prev, created]);
        toast.success("FAQ Category Created", `Category "${created.title}" added.`);
      } else if (modalType === 'edit_faq_cat') {
        const payload = {
          title: formData.title,
          slug: formData.slug,
          display_order: parseInt(formData.display_order || 0, 10)
        };
        const updated = await apiRequest(`/api/cms/admin/faq-categories/${selectedItem.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        setFaqCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success("FAQ Category Updated", `Category "${updated.title}" updated.`);
      } else if (modalType === 'create_faq_item') {
        const payload = {
          category: parseInt(formData.category, 10),
          question: formData.question,
          answer: formData.answer,
          is_active: Boolean(formData.is_active),
          display_order: parseInt(formData.display_order || 0, 10)
        };
        const created = await apiRequest('/api/cms/admin/faq-items/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setFaqItems(prev => [...prev, created]);
        toast.success("FAQ Item Created", `FAQ item added.`);
      } else if (modalType === 'edit_faq_item') {
        const payload = {
          category: parseInt(formData.category, 10),
          question: formData.question,
          answer: formData.answer,
          is_active: Boolean(formData.is_active),
          display_order: parseInt(formData.display_order || 0, 10)
        };
        const updated = await apiRequest(`/api/cms/admin/faq-items/${selectedItem.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        setFaqItems(prev => prev.map(i => i.id === updated.id ? updated : i));
        toast.success("FAQ Item Updated", `FAQ item updated.`);
      } else if (modalType === 'create_agreement') {
        const payload = {
          agreement_type: formData.agreement_type,
          version: formData.version,
          title: formData.title,
          body: formData.body
        };
        const created = await apiRequest('/api/cms/admin/agreement-versions/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setAgreements(prev => [created, ...prev]);
        toast.success("Agreement Version Published", `Version ${created.version} (${created.agreement_type}) issued.`);
      }

      closeModal();
    } catch (err) {
      console.error("Form action error:", err);
      const errDetail = err.data ? JSON.stringify(err.data) : (err.message || "Failed to execute request.");
      setFormError(errDetail);
    } finally {
      setFormSubmitting(false);
    }
  };

  // --- Publish / Unpublish Actions ---
  const handlePublishToggle = async (type, item, actionName) => {
    try {
      const endpoint = `/api/cms/admin/${type}/${item.id}/${actionName}/`;
      const updated = await apiRequest(endpoint, { method: 'POST' });
      
      if (type === 'pages') {
        setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else if (type === 'blog-posts') {
        setBlogPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
      }

      toast.success(
        actionName === 'publish' ? "Content Published" : "Content Unpublished",
        `"${item.title}" is now ${updated.status}.`
      );
    } catch (err) {
      console.error(`Failed to ${actionName} ${type}:`, err);
      toast.error("Publish Error", err.data?.detail || err.message || `Failed to ${actionName} item.`);
    }
  };

  // --- Delete Execution ---
  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { type, item } = deleteConfirm;

    try {
      let endpoint = '';
      if (type === 'page') endpoint = `/api/cms/admin/pages/${item.id}/`;
      else if (type === 'banner') endpoint = `/api/cms/admin/banners/${item.id}/`;
      else if (type === 'post') endpoint = `/api/cms/admin/blog-posts/${item.id}/`;
      else if (type === 'faq_cat') endpoint = `/api/cms/admin/faq-categories/${item.id}/`;
      else if (type === 'faq_item') endpoint = `/api/cms/admin/faq-items/${item.id}/`;

      await apiRequest(endpoint, { method: 'DELETE' });

      if (type === 'page') setPages(prev => prev.filter(p => p.id !== item.id));
      else if (type === 'banner') setBanners(prev => prev.filter(b => b.id !== item.id));
      else if (type === 'post') setBlogPosts(prev => prev.filter(p => p.id !== item.id));
      else if (type === 'faq_cat') setFaqCategories(prev => prev.filter(c => c.id !== item.id));
      else if (type === 'faq_item') setFaqItems(prev => prev.filter(i => i.id !== item.id));

      toast.success("Item Deleted", `Successfully removed ${deleteConfirm.name}.`);
    } catch (err) {
      console.error("Delete failure:", err);
      toast.error("Delete Failed", err.data?.detail || err.message || "Failed to delete item.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#FA661C] animate-spin mx-auto" />
        <p className="text-sm text-[#6B6058]">Loading CMS Management Workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-[#FFF3EC] border border-[#FF811A]/40 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-[#D7263D] mx-auto" />
        <h3 className="text-lg font-bold text-[#1A2420]">Unable to Connect to CMS API</h3>
        <p className="text-xs text-[#6B6058]">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#FA661C] text-white rounded-xl text-xs font-bold btn-interactive"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-reveal">
      
      {/* Workspace Header */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF811A] bg-[#FFF3EC] px-2.5 py-0.5 rounded-full">
            CONTENT MANAGEMENT SYSTEM
          </span>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] mt-1">
            CMS & Governance Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6058] mt-0.5">
            Manage canonical pages, hero banners, blog entries, FAQs, and immutable vendor agreement versions.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={fetchData}
            className="p-2.5 bg-[#FFFFFF] border border-[#EAE3DC] rounded-xl hover:bg-[#FFF3EC] text-[#6B6058] transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4 text-[#FA661C]" />
          </button>
          
          {activeTab === 'pages' && (
            <button
              onClick={() => openModal('create_page')}
              className="px-4 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Page</span>
            </button>
          )}

          {activeTab === 'banners' && (
            <button
              onClick={() => openModal('create_banner')}
              className="px-4 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Banner</span>
            </button>
          )}

          {activeTab === 'blog' && (
            <button
              onClick={() => openModal('create_post')}
              className="px-4 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Blog Post</span>
            </button>
          )}

          {activeTab === 'faqs' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openModal('create_faq_cat')}
                className="px-3 py-2.5 bg-white border border-[#EAE3DC] hover:bg-[#FFF3EC] text-[#FA661C] text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
              <button
                onClick={() => openModal('create_faq_item')}
                className="px-4 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add FAQ Item</span>
              </button>
            </div>
          )}

          {activeTab === 'agreements' && (
            <button
              onClick={() => openModal('create_agreement')}
              className="px-4 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Issue New Version</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-[#EAE3DC]">
        {[
          { id: 'pages', label: `Pages (${pages.length})`, icon: FileText },
          { id: 'banners', label: `Banners (${banners.length})`, icon: Image },
          { id: 'blog', label: `Blog Posts (${blogPosts.length})`, icon: BookOpen },
          { id: 'faqs', label: `FAQs (${faqItems.length})`, icon: HelpCircle },
          { id: 'agreements', label: `Agreement Versions (${agreements.length})`, icon: ShieldCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#FA661C] text-white shadow-xs'
                  : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:bg-[#FFF3EC] hover:text-[#FA661C]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PAGES MANAGEMENT */}
      {activeTab === 'pages' && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#6B6058] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages by title or slug..."
                className="w-full pl-9 pr-4 py-2 bg-[#FDFBF7] border border-[#EAE3DC] rounded-xl text-xs outline-none focus:border-[#FA661C]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#EAE3DC]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDFBF7] border-b border-[#EAE3DC] text-[#6B6058] font-bold">
                <tr>
                  <th className="p-3">Page Title</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Publication Status</th>
                  <th className="p-3">Published At</th>
                  <th className="p-3">SEO NoIndex</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {pages
                  .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(page => (
                    <tr key={page.id} className="hover:bg-[#FFF3EC]/30">
                      <td className="p-3 font-bold text-[#1A2420]">
                        <div>{page.title}</div>
                        {page.meta_title && <div className="text-[10px] text-[#6B6058] font-normal font-mono truncate max-w-xs">{page.meta_title}</div>}
                      </td>
                      <td className="p-3 font-mono text-[#FA661C]">/{page.slug}/</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          page.status === 'published'
                            ? 'bg-[#E8F5E9] text-[#2E7D32]'
                            : 'bg-[#FFF3E0] text-[#E65100]'
                        }`}>
                          {page.status}
                        </span>
                      </td>
                      <td className="p-3 text-[#6B6058]">
                        {page.published_at ? new Date(page.published_at).toLocaleString() : 'Not published'}
                      </td>
                      <td className="p-3">
                        {page.noindex ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#FFEBEE] text-[#C62828] font-bold">noindex</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#E8F5E9] text-[#2E7D32] font-bold">indexed</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        {page.status === 'draft' ? (
                          <button
                            onClick={() => handlePublishToggle('pages', page, 'publish')}
                            className="px-2.5 py-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishToggle('pages', page, 'unpublish')}
                            className="px-2.5 py-1 bg-[#E65100] hover:bg-[#BF360C] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => openModal('edit_page', page)}
                          className="p-1.5 bg-[#FFF3EC] hover:bg-[#FA661C] hover:text-white text-[#FA661C] rounded-lg transition-colors cursor-pointer"
                          title="Edit Page"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'page', item: page, name: page.title })}
                          className="p-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                {pages.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-[#6B6058]">No CMS Pages found. Click "Create New Page" to add one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BANNERS MANAGEMENT */}
      {activeTab === 'banners' && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 space-y-4 shadow-xs">
          <div className="overflow-x-auto rounded-xl border border-[#EAE3DC]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDFBF7] border-b border-[#EAE3DC] text-[#6B6058] font-bold">
                <tr>
                  <th className="p-3">Preview</th>
                  <th className="p-3">Title & Link</th>
                  <th className="p-3">Placement</th>
                  <th className="p-3">Active Schedule</th>
                  <th className="p-3">Display Order</th>
                  <th className="p-3">Active</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {banners.map(banner => (
                  <tr key={banner.id} className="hover:bg-[#FFF3EC]/30">
                    <td className="p-3">
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-20 h-10 object-cover rounded-lg border border-[#EAE3DC] bg-gray-100"
                        onError={(e) => { e.target.src = 'https://placehold.co/120x60?text=No+Image'; }}
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#1A2420]">{banner.title}</div>
                      <a href={banner.link_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#FA661C] hover:underline font-mono truncate max-w-xs block">
                        {banner.link_url || 'No link specified'}
                      </a>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E8EAF6] text-[#283593]">
                        {banner.placement}
                      </span>
                    </td>
                    <td className="p-3 text-[#6B6058]">
                      {banner.start_date || banner.end_date ? (
                        <span>{banner.start_date || 'Start'} → {banner.end_date || 'End'}</span>
                      ) : (
                        <span className="text-gray-400">Always Active</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold">{banner.display_order}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        banner.is_active ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => openModal('edit_banner', banner)}
                        className="p-1.5 bg-[#FFF3EC] hover:bg-[#FA661C] hover:text-white text-[#FA661C] rounded-lg transition-colors cursor-pointer"
                        title="Edit Banner"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'banner', item: banner, name: banner.title })}
                        className="p-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {banners.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#6B6058]">No active banners. Click "Add New Banner" to create one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BLOG POSTS */}
      {activeTab === 'blog' && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#6B6058] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full pl-9 pr-4 py-2 bg-[#FDFBF7] border border-[#EAE3DC] rounded-xl text-xs outline-none focus:border-[#FA661C]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#EAE3DC]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDFBF7] border-b border-[#EAE3DC] text-[#6B6058] font-bold">
                <tr>
                  <th className="p-3">Article Title</th>
                  <th className="p-3">Slug & Tags</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Published Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {blogPosts
                  .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.tags?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(post => (
                    <tr key={post.id} className="hover:bg-[#FFF3EC]/30">
                      <td className="p-3 font-bold text-[#1A2420]">
                        <div>{post.title}</div>
                        {post.excerpt && <div className="text-[11px] text-[#6B6058] font-normal truncate max-w-sm">{post.excerpt}</div>}
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-[#FA661C]">/blog/{post.slug}/</div>
                        {post.tags && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {post.tags.split(',').map((tag, idx) => (
                              <span key={idx} className="bg-gray-100 text-gray-700 text-[9px] px-1.5 py-0.2 rounded">
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          post.status === 'published' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#E65100]'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="p-3 text-[#6B6058]">
                        {post.published_at ? new Date(post.published_at).toLocaleString() : 'Not published'}
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        {post.status === 'draft' ? (
                          <button
                            onClick={() => handlePublishToggle('blog-posts', post, 'publish')}
                            className="px-2.5 py-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishToggle('blog-posts', post, 'unpublish')}
                            className="px-2.5 py-1 bg-[#E65100] hover:bg-[#BF360C] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => openModal('edit_post', post)}
                          className="p-1.5 bg-[#FFF3EC] hover:bg-[#FA661C] hover:text-white text-[#FA661C] rounded-lg transition-colors cursor-pointer"
                          title="Edit Article"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'post', item: post, name: post.title })}
                          className="p-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                {blogPosts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-[#6B6058]">No blog articles. Click "Create Blog Post" to add one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FAQS */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          {/* FAQ Categories Grid */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 space-y-4 shadow-xs">
            <h3 className="font-['Outfit'] font-bold text-lg text-[#FA661C]">FAQ Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {faqCategories.map(cat => (
                <div key={cat.id} className="p-4 border border-[#EAE3DC] rounded-xl bg-[#FDFBF7] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#1A2420]">{cat.title}</h4>
                    <span className="text-[10px] text-[#6B6058] font-mono">slug: {cat.slug} (Order: {cat.display_order})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openModal('edit_faq_cat', cat)}
                      className="p-1 bg-[#FFF3EC] hover:bg-[#FA661C] hover:text-white text-[#FA661C] rounded cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'faq_cat', item: cat, name: cat.title })}
                      className="p-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Items List */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 space-y-4 shadow-xs">
            <h3 className="font-['Outfit'] font-bold text-lg text-[#FA661C]">FAQ Questions & Answers</h3>
            <div className="overflow-x-auto rounded-xl border border-[#EAE3DC]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FDFBF7] border-b border-[#EAE3DC] text-[#6B6058] font-bold">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Question</th>
                    <th className="p-3">Answer Excerpt</th>
                    <th className="p-3">Active</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {faqItems.map(item => {
                    const cat = faqCategories.find(c => c.id === item.category);
                    return (
                      <tr key={item.id} className="hover:bg-[#FFF3EC]/30">
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-[#FFF3EC] text-[#FA661C] font-bold text-[10px]">
                            {cat ? cat.title : `Category #${item.category}`}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-[#1A2420]">{item.question}</td>
                        <td className="p-3 text-[#6B6058] max-w-xs truncate">{item.answer}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.is_active ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => openModal('edit_faq_item', item)}
                            className="p-1.5 bg-[#FFF3EC] hover:bg-[#FA661C] hover:text-white text-[#FA661C] rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'faq_item', item: item, name: item.question })}
                            className="p-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {faqItems.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-[#6B6058]">No FAQ items found. Click "Add FAQ Item" to create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VENDOR AGREEMENT VERSIONS (Create + View Only) */}
      {activeTab === 'agreements' && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 space-y-4 shadow-xs">
          
          <div className="p-4 bg-[#FFF3EC] border border-[#FF811A]/40 rounded-xl flex items-start space-x-3">
            <Lock className="w-5 h-5 text-[#FA661C] shrink-0 mt-0.5" />
            <div className="text-xs text-[#1A2420]">
              <span className="font-bold">Immutable Audit Policy:</span> Vendor agreement versions are append-only. Once published, legal contracts cannot be modified or deleted. To publish revised terms, issue a new version tag (e.g. v1.1).
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#EAE3DC]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDFBF7] border-b border-[#EAE3DC] text-[#6B6058] font-bold">
                <tr>
                  <th className="p-3">Agreement Type</th>
                  <th className="p-3">Version Tag</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Published Date</th>
                  <th className="p-3">Created By</th>
                  <th className="p-3 text-right">View Contract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {agreements.map(ag => (
                  <tr key={ag.id} className="hover:bg-[#FFF3EC]/30">
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-md font-bold uppercase text-[10px] bg-[#E1F5FE] text-[#0288D1]">
                        {ag.agreement_type}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#FA661C]">{ag.version}</td>
                    <td className="p-3 font-bold text-[#1A2420]">{ag.title}</td>
                    <td className="p-3 text-[#6B6058]">
                      {ag.published_at ? new Date(ag.published_at).toLocaleString() : new Date(ag.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-[#6B6058]">User #{ag.created_by || 'System'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openModal('view_agreement', ag)}
                        className="px-3 py-1.5 bg-[#FFF3EC] hover:bg-[#FA661C] hover:text-white text-[#FA661C] text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Contract</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {agreements.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-[#6B6058]">No agreement versions recorded. Click "Issue New Version" to publish one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS SECTION */}

      {/* 1. Page Modal (Create / Edit) */}
      {(modalType === 'create_page' || modalType === 'edit_page') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-[#EAE3DC]">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-4">
              <h3 className="font-['Outfit'] text-xl font-bold text-[#FA661C]">
                {modalType === 'create_page' ? 'Create New CMS Page' : `Edit Page: ${selectedItem?.title}`}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none focus:border-[#FA661C]"
                    placeholder="e.g. Terms of Service"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl font-mono outline-none focus:border-[#FA661C]"
                    placeholder="terms-of-service"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1A2420] mb-1">Page Body (Markdown) *</label>
                <textarea
                  required
                  rows="6"
                  value={formData.body || ''}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl font-mono outline-none focus:border-[#FA661C]"
                  placeholder="# Enter Markdown page content here..."
                />
              </div>

              <div className="p-4 bg-[#FDFBF7] border border-[#EAE3DC] rounded-2xl space-y-3">
                <h4 className="font-bold text-[#FA661C] uppercase text-[10px] tracking-wider">SEO Metadata & OpenGraph</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={formData.meta_title || ''}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#EAE3DC] rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Meta Description</label>
                    <input
                      type="text"
                      value={formData.meta_description || ''}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#EAE3DC] rounded-lg outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="noindex"
                    checked={Boolean(formData.noindex)}
                    onChange={(e) => setFormData({ ...formData, noindex: e.target.checked })}
                    className="rounded text-[#FA661C]"
                  />
                  <label htmlFor="noindex" className="font-bold text-gray-700">Add noindex tag (Hide from search engines)</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#EAE3DC]">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-[#EAE3DC] rounded-xl font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-5 py-2 bg-[#FA661C] text-white rounded-xl font-bold hover:bg-[#E0530B] shadow-xs">
                  {formSubmitting ? 'Saving...' : 'Save Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Banner Modal (Create / Edit) */}
      {(modalType === 'create_banner' || modalType === 'edit_banner') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-[#EAE3DC]">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-4">
              <h3 className="font-['Outfit'] text-xl font-bold text-[#FA661C]">
                {modalType === 'create_banner' ? 'Add New Hero Banner' : `Edit Banner: ${selectedItem?.title}`}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1A2420] mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none focus:border-[#FA661C]"
                  placeholder="e.g. Festival Season Sale"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A2420] mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl font-mono outline-none focus:border-[#FA661C]"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A2420] mb-1">Destination Link URL</label>
                <input
                  type="url"
                  value={formData.link_url || ''}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl font-mono outline-none focus:border-[#FA661C]"
                  placeholder="https://example.com/products/sale"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Placement *</label>
                  <select
                    value={formData.placement || 'homepage_hero'}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none focus:border-[#FA661C]"
                  >
                    <option value="homepage_hero">Homepage Hero</option>
                    <option value="category_top">Category Top</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order || 0}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none focus:border-[#FA661C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="banner_active"
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-[#FA661C]"
                />
                <label htmlFor="banner_active" className="font-bold text-[#1A2420]">Is Banner Active</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#EAE3DC]">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-[#EAE3DC] rounded-xl font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-5 py-2 bg-[#FA661C] text-white rounded-xl font-bold hover:bg-[#E0530B] shadow-xs">
                  {formSubmitting ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Blog Post Modal */}
      {(modalType === 'create_post' || modalType === 'edit_post') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-[#EAE3DC]">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-4">
              <h3 className="font-['Outfit'] text-xl font-bold text-[#FA661C]">
                {modalType === 'create_post' ? 'Create Blog Post' : `Edit Post: ${selectedItem?.title}`}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1A2420] mb-1">Excerpt Summary</label>
                <input
                  type="text"
                  value={formData.excerpt || ''}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A2420] mb-1">Article Body (Markdown) *</label>
                <textarea
                  required
                  rows="6"
                  value={formData.body || ''}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Featured Image URL</label>
                  <input
                    type="url"
                    value={formData.featured_image_url || ''}
                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags || ''}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none"
                    placeholder="marketplace, seller, launch"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#EAE3DC]">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-[#EAE3DC] rounded-xl font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-5 py-2 bg-[#FA661C] text-white rounded-xl font-bold hover:bg-[#E0530B] shadow-xs">
                  {formSubmitting ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. FAQ Category Modal */}
      {(modalType === 'create_faq_cat' || modalType === 'edit_faq_cat') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#EAE3DC]">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] text-lg font-bold text-[#FA661C]">
                {modalType === 'create_faq_cat' ? 'New FAQ Category' : 'Edit FAQ Category'}
              </h3>
              <button onClick={closeModal} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-mono">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-[#FA661C] text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. FAQ Item Modal */}
      {(modalType === 'create_faq_item' || modalType === 'edit_faq_item') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#EAE3DC]">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] text-lg font-bold text-[#FA661C]">
                {modalType === 'create_faq_item' ? 'Add FAQ Item' : 'Edit FAQ Item'}
              </h3>
              <button onClick={closeModal} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-mono">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Category *</label>
                <select
                  required
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                >
                  {faqCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Question *</label>
                <input
                  type="text"
                  required
                  value={formData.question || ''}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Answer (Markdown) *</label>
                <textarea
                  required
                  rows="4"
                  value={formData.answer || ''}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono outline-none"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="faq_active"
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="faq_active" className="font-bold">Active</label>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-[#FA661C] text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Agreement Version Modal (Create) */}
      {modalType === 'create_agreement' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-[#EAE3DC]">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] text-lg font-bold text-[#FA661C]">Issue Vendor Agreement Version</h3>
              <button onClick={closeModal} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-mono">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Agreement Type *</label>
                  <select
                    value={formData.agreement_type || 'terms'}
                    onChange={(e) => setFormData({ ...formData, agreement_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none"
                  >
                    <option value="terms">Terms of Service</option>
                    <option value="privacy">Privacy Policy</option>
                    <option value="vendor_agreement">Vendor Agreement</option>
                    <option value="tax_declaration">Tax Declaration</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Version Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="v1.0"
                    value={formData.version || ''}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Master Vendor Marketplace Agreement 2026"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Contract Body (Markdown) *</label>
                <textarea
                  required
                  rows="6"
                  value={formData.body || ''}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono outline-none"
                  placeholder="# Full legal text..."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-[#FA661C] text-white font-bold rounded-xl">Publish Agreement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Agreement Detail View Modal */}
      {modalType === 'view_agreement' && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-[#EAE3DC]">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFF3EC] text-[#FA661C] px-2 py-0.5 rounded">
                  {selectedItem.agreement_type} {selectedItem.version}
                </span>
                <h3 className="font-['Outfit'] text-xl font-bold text-[#1A2420] mt-1">{selectedItem.title}</h3>
              </div>
              <button onClick={closeModal} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 bg-[#FDFBF7] border rounded-xl font-mono text-xs whitespace-pre-wrap">
              {selectedItem.body}
            </div>
            <div className="flex justify-end border-t pt-3">
              <button onClick={closeModal} className="px-4 py-2 bg-[#FA661C] text-white rounded-xl text-xs font-bold">Close View</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#EAE3DC] text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-['Outfit'] text-lg font-bold text-[#1A2420]">Confirm Deletion</h3>
            <p className="text-xs text-[#6B6058]">
              Are you sure you want to permanently delete <strong className="text-[#1A2420]">"{deleteConfirm.name}"</strong>? This operation cannot be undone.
            </p>
            <div className="flex justify-center space-x-3 pt-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={executeDelete} className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
