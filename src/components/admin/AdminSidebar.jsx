import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Boxes, 
  Users2, 
  Truck, 
  Landmark, 
  TrendingUp, 
  Headphones, 
  BarChart3, 
  ShieldAlert, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  LogOut,
  X
} from 'lucide-react';
import { ADMIN_NAV_GROUPS } from '../../data/adminMockData';

const ICON_MAP = {
  LayoutDashboard,
  Boxes,
  Users2,
  Truck,
  Landmark,
  TrendingUp,
  Headphones,
  BarChart3,
  ShieldAlert
};

export default function AdminSidebar({ 
  searchQuery, 
  setSearchQuery,
  isMobileOpen,
  onCloseMobile
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState(['catalog', 'orders', 'finance']);

  const activeSection = location.pathname === '/admin' ? 'dashboard' : location.pathname.replace('/admin/', '');

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const filteredGroups = ADMIN_NAV_GROUPS.map(group => {
    if (group.isSingle) {
      const matches = group.label.toLowerCase().includes(searchQuery.toLowerCase());
      return matches ? group : null;
    }

    const filteredItems = group.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (searchQuery && filteredItems.length === 0) return null;

    return {
      ...group,
      items: searchQuery ? filteredItems : group.items
    };
  }).filter(Boolean);

  const handleItemClick = (id) => {
    if (id === 'dashboard') {
      navigate('/admin');
    } else {
      navigate(`/admin/${id}`);
    }
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Sheet */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-[#0F3D2E]/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside 
        aria-label="Admin Operations Navigation"
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 shrink-0 bg-[#0F3D2E] text-[#FBF8F1] border-r border-[#D4AF37]/30 flex flex-col justify-between z-50 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Top Brand Wordmark + Environment Header */}
          <div className="p-4 sm:p-5 border-b border-[#FBF8F1]/15 flex items-center justify-between">
            <div>
              <Link to="/admin" className="flex items-center space-x-2">
                <span className="font-['Outfit'] font-black text-2xl tracking-tight text-[#FBF8F1]">
                  Mytri<span className="text-[#D4AF37]">Kart</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#D4AF37] text-[#0F3D2E] px-1.5 py-0.5 rounded shadow-2xs">
                  OPS
                </span>
              </Link>
              <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-[#D8E0DC]">
                <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse" />
                <span>Production Console v2.6.4</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-[#FBF8F1]/80 hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Module Quick Filter Search */}
          <div className="p-3 border-b border-[#FBF8F1]/10">
            <div className="flex items-center space-x-2 bg-[#155440] px-3 py-1.5 rounded-xl border border-[#FBF8F1]/20">
              <Search className="w-3.5 h-3.5 text-[#D4AF37]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter 30 Admin Modules..."
                className="bg-transparent text-xs text-[#FBF8F1] placeholder-[#FBF8F1]/50 outline-none w-full"
              />
            </div>
          </div>

          {/* 30-Module Accordion Navigation Tree */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs">
            {filteredGroups.map((group) => {
              const Icon = ICON_MAP[group.iconName] || Boxes;
              const isOpen = openGroups.includes(group.id);

              if (group.isSingle) {
                const isCurrent = activeSection === group.id;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleItemClick(group.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all cursor-pointer btn-interactive ${
                      isCurrent
                        ? 'bg-[#D4AF37] text-[#0F3D2E] shadow-sm'
                        : 'text-[#FBF8F1]/80 hover:bg-[#155440] hover:text-[#FBF8F1]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 icon-interactive" />
                      <span>{group.label}</span>
                    </div>
                  </button>
                );
              }

              return (
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#FBF8F1]/90 hover:bg-[#155440] font-bold text-xs transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 text-[#D4AF37]" />
                      <span>{group.label}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#FBF8F1]/60 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#D4AF37]' : ''
                    }`} />
                  </button>

                  {isOpen && (
                    <div className="pl-6 pr-1 space-y-1 border-l-2 border-[#D4AF37]/30 ml-4 py-1">
                      {group.items.map((item) => {
                        const isCurrent = activeSection === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleItemClick(item.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-[#D4AF37] text-[#0F3D2E] font-black shadow-xs'
                                : 'text-[#FBF8F1]/70 hover:bg-[#155440] hover:text-[#FBF8F1]'
                            }`}
                          >
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ml-1 shrink-0 ${
                                item.badge.includes('Alert') || item.badge.includes('Action')
                                  ? 'bg-[#C0392B] text-white'
                                  : isCurrent
                                  ? 'bg-[#0F3D2E] text-[#FBF8F1]'
                                  : 'bg-[#155440] text-[#D4AF37]'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom Marketplace Link */}
          <div className="p-3 border-t border-[#FBF8F1]/15 bg-[#0A2A1F]">
            <Link
              to="/"
              className="w-full py-2 px-3 rounded-xl bg-[#155440] hover:bg-[#1A624B] text-[#FBF8F1] border border-[#D4AF37]/30 text-xs font-bold btn-interactive flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Exit to Marketplace Home</span>
            </Link>
          </div>

        </div>
      </aside>
    </>
  );
}
