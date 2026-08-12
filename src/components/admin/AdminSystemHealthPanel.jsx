import React from 'react';
import { ShieldCheck, Activity, Cpu, Database, Server, Zap, CheckCircle2 } from 'lucide-react';
import { ADMIN_SYSTEM_HEALTH } from '../../data/adminMockData';

export default function AdminSystemHealthPanel() {
  return (
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D8E0DC]">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
          </span>
          <h3 className="font-['Outfit'] font-extrabold text-base text-[#0F3D2E]">
            Infrastructure & AI Core Health
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-[#155440] animate-pulse" />
          <span className="font-bold text-[#0F3D2E]">All 5 Core Clusters Operational (100% SLA)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        {ADMIN_SYSTEM_HEALTH.map((node, idx) => (
          <div 
            key={idx}
            className="p-3 rounded-2xl bg-[#FBF8F1] border border-[#D8E0DC]/80 flex flex-col justify-between hover:border-[#D4AF37] transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#155440]" />
                <span className="text-[10px] font-mono font-bold text-[#5C6B63] bg-white px-1.5 py-0.2 rounded border border-[#D8E0DC]">
                  {node.latency}
                </span>
              </div>
              <h5 className="font-bold text-xs text-[#0F3D2E] leading-snug">
                {node.name}
              </h5>
            </div>

            <div className="mt-3 pt-2 border-t border-[#D8E0DC]/60 flex items-center justify-between text-[10px]">
              <span className="text-[#5C6B63]">Uptime</span>
              <span className="font-extrabold text-[#0F3D2E]">{node.uptime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
