import React from 'react';
import { ShieldCheck, Clock, PlusCircle, ArrowUpRight, HelpCircle } from 'lucide-react';
import { useSellerProducts } from '../../context/SellerProductsContext';

export default function PendingRequestsSidebarWidget({ onOpenGenericRequest }) {
  const { pendingRequests } = useSellerProducts();

  return (
    <aside 
      aria-label="Attribute Governance Status"
      className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-2 text-[#FA661C]">
          <ShieldCheck className="w-4 h-4 text-[#FF811A]" />
          <h3 className="font-['Outfit'] font-extrabold text-sm text-[#FA661C]">
            Governance Queue ({pendingRequests.length})
          </h3>
        </div>
        <span className="text-[9px] font-bold bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A] px-2 py-0.5 rounded-full uppercase tracking-wider">
          Admin Controlled
        </span>
      </div>

      <p className="text-[11px] text-[#6B6058] leading-relaxed">
        Requested attribute options are submitted to the Central Catalog Desk for taxonomy compliance before appearing in live customer filters.
      </p>

      {/* List of Pending Requests */}
      <div className="space-y-2.5">
        {pendingRequests.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FF811A]/20 text-center space-y-1">
            <p className="text-xs font-bold text-[#FA661C]">No Pending Requests</p>
            <p className="text-[10px] text-[#6B6058]">
              You have no custom attribute value requests currently pending catalog desk review.
            </p>
          </div>
        ) : (
          pendingRequests.map((req) => {
            const valName = req.requested_value || req.requestedValue || 'Custom Value';
            const attrName = req.category_attribute_name || req.attributeName || `Attr #${req.category_attribute}`;
            const catName = req.category_name || req.categoryName || 'Catalog';
            const reqStatus = req.status === 'pending' ? 'Pending Review' : (req.status || 'Pending Review');

            return (
              <div 
                key={req.id}
                className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#FA661C] truncate max-w-[170px]">
                    {valName}
                  </span>
                  <span className="text-[9px] font-bold bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20 px-1.5 py-0.2 rounded-full flex items-center space-x-1 shrink-0">
                    <Clock className="w-2.5 h-2.5 text-[#FF811A]" />
                    <span className="capitalize">{reqStatus}</span>
                  </span>
                </div>
                
                <p className="text-[10px] text-[#6B6058]">
                  Attribute: <strong className="text-[#FA661C]">{attrName}</strong> • {catName}
                </p>
                
                {req.reason && (
                  <p className="text-[9px] text-[#6B6058]/80 italic line-clamp-1">
                    "{req.reason}"
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
