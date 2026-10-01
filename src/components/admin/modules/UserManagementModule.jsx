import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Shield, AlertTriangle, Trash2, Edit, Plus, 
  Search, RefreshCw, X, CheckCircle2, Lock, Eye, Mail, Phone, Globe, AlertCircle, Ban, ChevronLeft, ChevronRight
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import AuthContext from '../../../context/AuthContext';

export default function UserManagementModule({ defaultTab = 'all' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'customers', 'staff', 'all'
  const toast = useToast();
  const auth = React.useContext(AuthContext);
  const currentUser = auth?.currentUser;

  // Superuser Gating Check (read from /me/ via AuthContext)
  const isSuperuser = Boolean(currentUser?.is_superuser);

  // Data & Pagination State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pagination parameters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);

  // Modal States
  const [modalType, setModalType] = useState(null); // 'create', 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Destructive Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState(null); // user object
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const extractErrorMessage = (err) => {
    if (err?.data?.detail) return err.data.detail;
    if (err?.data?.non_field_errors) {
      return Array.isArray(err.data.non_field_errors)
        ? err.data.non_field_errors.join(' ')
        : err.data.non_field_errors;
    }
    if (err?.data && typeof err.data === 'object') {
      return Object.entries(err.data)
        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
        .join(' | ');
    }
    return err?.message || "An unexpected error occurred.";
  };

  const fetchUsers = async (page = currentPage, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/accounts/users/?page=${page}&page_size=${size}`;
      const data = await apiRequest(url);

      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setUsers(data.results);
        setTotalCount(data.count || data.results.length);
        setNextPageUrl(data.next);
        setPrevPageUrl(data.previous);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotalCount(data.length);
        setNextPageUrl(null);
        setPrevPageUrl(null);
      } else {
        setUsers([]);
        setTotalCount(0);
        setNextPageUrl(null);
        setPrevPageUrl(null);
      }
    } catch (err) {
      console.error("Failed to fetch user accounts:", err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
      setCurrentPage(1);
    }
  }, [defaultTab]);

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    setFormError(null);

    if (type === 'create') {
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: activeTab === 'staff' ? 'admin' : 'customer',
        phone_number: '',
        country: 'IN',
        is_phone_verified: false,
        is_email_verified: false,
        is_active: true
      });
    } else if (type === 'edit') {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Write-only password field for resets; password hashes are NEVER displayed!
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role || 'customer',
        phone_number: user.phone_number || '',
        country: user.country || 'IN',
        is_phone_verified: Boolean(user.is_phone_verified),
        is_email_verified: Boolean(user.is_email_verified),
        is_active: user.is_active !== undefined ? user.is_active : true
      });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setFormData({});
    setFormError(null);
  };

  // Submit User Create / Edit (PATCH used for edits)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (modalType === 'create') {
        const payload = { ...formData };
        if (!payload.password) {
          delete payload.password;
        }
        const created = await apiRequest('/api/accounts/users/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success("User Created", `Account for "${created.username}" created successfully.`);
        closeModal();
        fetchUsers(currentPage, pageSize);
      } else if (modalType === 'edit') {
        const payload = { ...formData };
        if (!payload.password) {
          delete payload.password;
        }
        const updated = await apiRequest(`/api/accounts/users/${selectedUser.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        toast.success("User Profile Updated", `Updated details for "${updated.username}".`);
        closeModal();
      }
    } catch (err) {
      console.error("Failed to save user:", err);
      setFormError(extractErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Soft Deactivate / Activate Quick Action via PATCH
  const handleToggleActive = async (user) => {
    try {
      const newStatus = !user.is_active;
      const updated = await apiRequest(`/api/accounts/users/${user.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: newStatus })
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      toast.success(
        newStatus ? "Account Activated" : "Account Deactivated",
        `User ${user.username} is now ${newStatus ? 'Active' : 'Deactivated'}.`
      );
    } catch (err) {
      console.error("Failed to toggle user status:", err);
      toast.error("Status Update Failed", extractErrorMessage(err));
    }
  };

  // Hard Delete User Action
  const executeHardDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/accounts/users/${deleteConfirm.id}/`, { method: 'DELETE' });
      toast.success("User Permanently Deleted", `Account #${deleteConfirm.id} (@${deleteConfirm.username}) removed.`);
      setDeleteConfirm(null);
      fetchUsers(currentPage, pageSize);
    } catch (err) {
      console.error("Delete user failed:", err);
      const errMsg = extractErrorMessage(err);
      setDeleteError(errMsg);
      toast.error("Delete Refused", errMsg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Filtering Logic
  const filteredUsers = users.filter(user => {
    // 1. Tab Filter: Use read-only is_staff field (role === 'admin' || is_staff)
    if (activeTab === 'customers' && user.role !== 'customer') return false;
    if (activeTab === 'staff' && !(user.role === 'admin' || Boolean(user.is_staff))) return false;

    // 2. Dropdown Role Filter
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;

    // 3. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchUsername = user.username?.toLowerCase().includes(q);
      const matchEmail = user.email?.toLowerCase().includes(q);
      const matchName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(q);
      const matchPhone = user.phone_number?.toLowerCase().includes(q);
      return matchUsername || matchEmail || matchName || matchPhone;
    }

    return true;
  });

  const customerCount = users.filter(u => u.role === 'customer').length;
  const staffCount = users.filter(u => u.role === 'admin' || Boolean(u.is_staff)).length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Determine if editing an admin/staff row that is restricted for non-superusers
  const isTargetAdminOrStaff = (u) => Boolean(u?.is_staff || u?.is_superuser || u?.role === 'admin');

  if (loading && users.length === 0) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#FA661C] animate-spin mx-auto" />
        <p className="text-sm text-[#6B6058]">Loading Account Directory...</p>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="p-8 bg-[#FFF3EC] border border-[#FF811A]/40 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-[#D7263D] mx-auto" />
        <h3 className="text-lg font-bold text-[#1A2420]">User Accounts API Error</h3>
        <p className="text-xs text-[#6B6058]">{error}</p>
        <button
          onClick={() => fetchUsers(currentPage, pageSize)}
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
            ACCOUNT & IDENTITY MANAGEMENT
          </span>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] mt-1">
            {activeTab === 'customers' ? 'Customer Directory' : activeTab === 'staff' ? 'Staff & Administrator Hub' : 'User Accounts Central'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6058] mt-0.5">
            Real-time management of account profiles, roles, email/phone verification, and security controls.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => fetchUsers(currentPage, pageSize)}
            className="p-2.5 bg-[#FFFFFF] border border-[#EAE3DC] rounded-xl hover:bg-[#FFF3EC] text-[#6B6058] transition-colors cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className="w-4 h-4 text-[#FA661C]" />
          </button>
          
          <button
            onClick={() => openModal('create')}
            className="px-4 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Security & Privilege Security Banner */}
      <div className="p-4 bg-[#FDFBF7] border border-[#EAE3DC] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-[#FFF3EC] text-[#FA661C] shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-[#1A2420]">Password Protection & Privilege Security:</span>
            <p className="text-[#6B6058] text-[11px] mt-0.5">
              Password hashes are write-only (<code className="bg-[#FFF3EC] text-[#FA661C] px-1 py-0.5 rounded">write_only=True</code>) and strictly omitted from all responses.
            </p>
          </div>
        </div>

        {/* Superuser Status Pill */}
        <div className="flex items-center space-x-2 shrink-0 bg-white px-3 py-1.5 rounded-xl border border-[#EAE3DC]">
          <Shield className={`w-4 h-4 ${isSuperuser ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className="text-[11px] font-bold text-[#1A2420]">
            {isSuperuser ? 'Superuser Privileges Active' : 'Standard Admin Privileges'}
          </span>
        </div>
      </div>

      {/* Segment Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#EAE3DC] pb-1">
        {[
          { id: 'customers', label: `Customers (${customerCount})`, icon: Users },
          { id: 'staff', label: `Staff & Admins (${staffCount})`, icon: Shield },
          { id: 'all', label: `All Accounts (${totalCount || users.length})`, icon: UserCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setCurrentPage(1); }}
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

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 space-y-4 shadow-xs">
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-[#6B6058] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, email, name, or phone..."
              className="w-full pl-9 pr-4 py-2 bg-[#FDFBF7] border border-[#EAE3DC] rounded-xl text-xs outline-none focus:border-[#FA661C]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-[#FDFBF7] border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-2 bg-[#FDFBF7] border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] outline-none cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl border border-[#EAE3DC]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDFBF7] border-b border-[#EAE3DC] text-[#6B6058] font-bold">
              <tr>
                <th className="p-3">User & Contact</th>
                <th className="p-3">Role & Access</th>
                <th className="p-3">Verifications</th>
                <th className="p-3">Account Status</th>
                <th className="p-3">Joined Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3DC]">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-[#FFF3EC]/30">
                  <td className="p-3">
                    <div className="font-bold text-[#1A2420] flex items-center space-x-1.5">
                      <span>{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</span>
                      <span className="text-[10px] text-gray-400 font-mono">(@{user.username})</span>
                    </div>
                    <div className="text-[11px] text-[#6B6058] flex items-center space-x-3 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{user.email || 'No email'}</span>
                      </span>
                      {user.phone_number && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{user.phone_number}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : user.role === 'vendor'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {user.role}
                      </span>
                      {user.is_staff && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold">
                          Staff Access
                        </span>
                      )}
                      {user.is_superuser && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[9px] font-bold">
                          Superuser
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        user.is_email_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        Email: {user.is_email_verified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        user.is_phone_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        Phone: {user.is_phone_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-[#6B6058] font-mono text-[11px]">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        user.is_active
                          ? 'bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-700'
                          : 'bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700'
                      }`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openModal('edit', user)}
                      className="p-1.5 bg-[#FFF3EC] hover:bg-[#FA661C] hover:text-white text-[#FA661C] rounded-lg transition-colors cursor-pointer"
                      title="Edit User"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setDeleteError(null); setDeleteConfirm(user); }}
                      className="p-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[#6B6058]">No users found matching current page or filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Real Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-[#6B6058]">
          <div>
            Showing <strong className="text-[#1A2420]">{totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong className="text-[#1A2420]">{Math.min(currentPage * pageSize, totalCount)}</strong> of <strong className="text-[#1A2420]">{totalCount}</strong> Accounts
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={!prevPageUrl && currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3 py-1.5 border border-[#EAE3DC] rounded-xl font-bold flex items-center space-x-1 hover:bg-[#FFF3EC] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1.5 font-bold bg-[#FDFBF7] border border-[#EAE3DC] rounded-xl text-[#FA661C]">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={!nextPageUrl && currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-3 py-1.5 border border-[#EAE3DC] rounded-xl font-bold flex items-center space-x-1 hover:bg-[#FFF3EC] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* CREATE / EDIT USER MODAL */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-[#EAE3DC]">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-4">
              <h3 className="font-['Outfit'] text-xl font-bold text-[#FA661C]">
                {modalType === 'create' ? 'Create New User Account' : `Edit User: ${selectedUser?.username}`}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-mono leading-relaxed space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Action Refused by Backend API:</span>
                </div>
                <div>{formError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none focus:border-[#FA661C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none focus:border-[#FA661C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Password Input: Gated for non-superusers on admin/staff accounts */}
              {(!isSuperuser && isTargetAdminOrStaff(selectedUser)) ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500">
                  <span className="font-bold text-[11px] block">Password Reset Disabled</span>
                  <span className="text-[10px]">Only Superusers may change passwords for administrative or staff accounts.</span>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">
                    {modalType === 'create' ? 'Password *' : 'Reset Password (Leave blank to keep existing)'}
                  </label>
                  <input
                    type="password"
                    required={modalType === 'create'}
                    minLength={8}
                    placeholder={modalType === 'edit' ? '••••••••' : 'Min 8 characters'}
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none font-mono focus:border-[#FA661C]"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Password hashes are write-only and never exposed.
                  </p>
                </div>
              )}

              {/* Role & Access Controls: Gated for non-superusers on admin/staff rows */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Platform Role *</label>
                  {(!isSuperuser && (modalType === 'create' || isTargetAdminOrStaff(selectedUser))) ? (
                    <div className="px-3 py-2 border border-gray-200 bg-gray-100 rounded-xl text-gray-600 font-bold uppercase text-[11px]">
                      {formData.role || 'customer'}
                    </div>
                  ) : (
                    <select
                      value={formData.role || 'customer'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none font-bold"
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number || ''}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none font-mono"
                    placeholder="+919876543210"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A2420] mb-1">Country</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.country || 'IN'}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-[#EAE3DC] rounded-xl outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <p className="col-span-3 text-[10px] text-[#6B6058]">Staff access is derived from platform role and cannot be edited separately.</p>

              {!isSuperuser && isTargetAdminOrStaff(selectedUser) && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium">
                  Role and administrative privilege modifications are reserved for Superusers.
                </div>
              )}

              <div className="p-3 bg-[#FDFBF7] border border-[#EAE3DC] rounded-xl space-y-2">
                <h4 className="font-bold text-[#FA661C] uppercase text-[10px]">Verification Flags & Active Status</h4>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center space-x-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_email_verified)}
                      onChange={(e) => setFormData({ ...formData, is_email_verified: e.target.checked })}
                    />
                    <span>Email Verified</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_phone_verified)}
                      onChange={(e) => setFormData({ ...formData, is_phone_verified: e.target.checked })}
                    />
                    <span>Phone Verified</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_active)}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span>Account Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#EAE3DC]">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-[#EAE3DC] rounded-xl font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-5 py-2 bg-[#FA661C] text-white rounded-xl font-bold hover:bg-[#E0530B] shadow-xs">
                  {formSubmitting ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESTRUCTIVE DELETE CONFIRMATION MODAL WITH 409 REAL ERROR SURFACING */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#EAE3DC]">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="font-['Outfit'] text-xl font-bold text-[#1A2420]">Destructive User Deletion</h3>
              <p className="text-xs text-[#6B6058]">
                You are performing a destructive action on user account <strong className="text-[#1A2420]">@{deleteConfirm.username}</strong> (ID: {deleteConfirm.id}).
              </p>
            </div>

            {/* Display Verbatim Backend Error Message if Refused */}
            {deleteError ? (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl space-y-2 text-xs text-red-900 animate-reveal">
                <div className="font-bold flex items-center space-x-1.5 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Deletion Refused by Backend API:</span>
                </div>
                <p className="font-mono text-[11px] leading-relaxed bg-white p-2.5 rounded-lg border border-red-200">
                  {deleteError}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-[#FFF3EC] border border-[#FF811A]/40 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-[#FA661C] flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Soft-Deactivation Recommendation:</span>
                </span>
                <p className="text-[#1A2420]">
                  Soft-deactivating setting <code className="bg-white px-1 py-0.5 rounded font-mono text-[10px]">is_active = false</code> is safer than hard DELETE. Deleting permanently removes the user and may fail if associated with orders, reviews, or seller entities.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={async () => {
                  await handleToggleActive(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-xs ${
                  deleteError
                    ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white ring-2 ring-emerald-500 animate-pulse'
                    : 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Soft-Deactivate User (Recommended)</span>
              </button>

              <button
                onClick={executeHardDelete}
                disabled={deleteSubmitting}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteSubmitting ? 'Deleting...' : 'Permanently DELETE User Account'}</span>
              </button>

              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
