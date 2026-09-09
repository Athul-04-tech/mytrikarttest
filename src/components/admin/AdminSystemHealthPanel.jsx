import React from 'react';
import { ShieldCheck, Activity, Cpu, Database, Server, Zap, CheckCircle2 } from 'lucide-react';
import { ADMIN_SYSTEM_HEALTH } from '../../data/adminMockData';

export default function AdminSystemHealthPanel() {
  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
            <Activity className="w-4 h-4 text-[#FF811A]" />
          </span>
          <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
            Infrastructure & AI Core Health
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-[#E0530B] animate-pulse" />
          <span className="font-bold text-[#FA661C]">All 5 Core Clusters Operational (100% SLA)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        {ADMIN_SYSTEM_HEALTH.map((node, idx) => (
          <div 
            key={idx}
            className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC]/80 flex flex-col justify-between hover:border-[#FF811A] transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E0530B]" />
                <span className="text-[10px] font-mono font-bold text-[#6B6058] bg-white px-1.5 py-0.2 rounded border border-[#EAE3DC]">
                  {node.latency}
                </span>
              </div>
              <h5 className="font-bold text-xs text-[#FA661C] leading-snug">
                {node.name}
              </h5>
            </div>

            <div className="mt-3 pt-2 border-t border-[#EAE3DC]/60 flex items-center justify-between text-[10px]">
              <span className="text-[#6B6058]">Uptime</span>
              <span className="font-extrabold text-[#FA661C]">{node.uptime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
