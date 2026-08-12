import React, { useState } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  HelpCircle, 
  FileText, 
  Plus, 
  X, 
  CheckCircle2, 
  ChevronRight, 
  Clock 
} from 'lucide-react';
import { MOCK_TICKETS } from '../../data/profileMockData';

export default function SupportSection() {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Order & Delivery');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const handleCreateTicket = (e) => {
    e.preventDefault();
    const newT = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      date: "Today",
      subject: ticketSubject,
      category: ticketCategory,
      status: "In Progress",
      lastReply: "Ticket assigned to Senior Specialist. Response expected within 2 hours."
    };
    setTickets([newT, ...tickets]);
    setTicketSuccess(true);
    setTimeout(() => {
      setTicketSuccess(false);
      setIsTicketModalOpen(false);
      setTicketSubject('');
      setTicketDesc('');
    }, 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D8E0DC]">
        <div>
          <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
            Help & Support Desk
          </h2>
          <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
            24x7 customer assistance, live chat escalations, and dedicated ticket management
          </p>
        </div>

        {/* Primary Support Actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => alert("Launching 24x7 Live Concierge Chatbot...")}
            className="px-3.5 py-2 bg-[#FCF7E8] hover:bg-[#D4AF37]/25 text-[#0F3D2E] border border-[#D4AF37] rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#0F3D2E]" />
            <span>Live Chat (Instant)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTicketModalOpen(true)}
            className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Raise Ticket</span>
          </button>
        </div>
      </div>

      {/* Quick Help Category Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Order Issues & Tracking", desc: "Missing items, delays, damaged packaging", icon: HelpCircle },
          { title: "Refunds & Payments", desc: "Failed UPI, wallet reconciliations, invoice GST", icon: FileText },
          { title: "Seller Inquiries & Claims", desc: "Warranty documentation, artisan verification", icon: Headphones }
        ].map((cat, idx) => (
          <div
            key={idx}
            onClick={() => setIsTicketModalOpen(true)}
            className="p-4 rounded-2xl bg-[#FBF8F1]/60 border border-[#D8E0DC] hover:border-[#D4AF37] transition-all cursor-pointer group"
          >
            <cat.icon className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform mb-2" />
            <h4 className="font-bold text-xs sm:text-sm text-[#0F3D2E]">
              {cat.title}
            </h4>
            <p className="text-[11px] text-[#5C6B63] mt-0.5">
              {cat.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Support Tickets Table */}
      <div className="mt-10">
        <h3 className="font-['Outfit'] font-extrabold text-lg text-[#0F3D2E] mb-4">
          Recent Support Tickets
        </h3>

        <div className="border border-[#D8E0DC] rounded-2xl overflow-hidden divide-y divide-[#D8E0DC]/60 bg-[#FBF8F1]/30">
          {tickets.map((t) => (
            <div key={t.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-[#0F3D2E]">
                    {t.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    t.status === 'Resolved' || t.status === 'Closed'
                      ? 'bg-[#E8F2EE] text-[#0F3D2E] border border-[#0F3D2E]/20'
                      : 'bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]'
                  }`}>
                    {t.status}
                  </span>
                  <span className="text-[10px] text-[#5C6B63]">
                    {t.category}
                  </span>
                </div>
                <h5 className="font-bold text-xs sm:text-sm text-[#0F3D2E] mt-1">
                  {t.subject}
                </h5>
                <p className="text-[11px] text-[#5C6B63] mt-0.5">
                  Latest: {t.lastReply}
                </p>
              </div>

              <span className="text-[11px] text-[#5C6B63] shrink-0">
                Created: {t.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Raise Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FBF8F1] border border-[#D4AF37]/40 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-dropdown">
            
            <div className="bg-gradient-to-r from-[#0F3D2E] to-[#155440] p-4 text-[#FBF8F1] flex items-center justify-between">
              <h3 className="font-['Outfit'] font-bold text-base text-[#FBF8F1] flex items-center space-x-2">
                <Headphones className="w-5 h-5 text-[#D4AF37]" />
                <span>Raise Support Ticket</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {ticketSuccess ? (
                <div className="text-center py-6 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-[#0F3D2E] mx-auto" />
                  <h4 className="font-bold text-base text-[#0F3D2E]">Support Ticket Created!</h4>
                  <p className="text-xs text-[#5C6B63]">
                    Our support team has received your query and will reply via email and push notification.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#0F3D2E] mb-1">Issue Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full py-2.5 px-3 bg-white border border-[#D8E0DC] rounded-xl text-[#0F3D2E] focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20"
                    >
                      <option value="Order & Delivery">Order & Delivery Query</option>
                      <option value="Refund & Payment">Refund & Payment Processing</option>
                      <option value="Product Defect / Warranty">Product Defect / Warranty</option>
                      <option value="Account & Security">Account & Security</option>
                      <option value="Other">Other Query</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F3D2E] mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief summary of the issue"
                      className="w-full py-2.5 px-3 bg-white border border-[#D8E0DC] rounded-xl text-[#0F3D2E] focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F3D2E] mb-1">Detailed Description</label>
                    <textarea
                      rows={3}
                      required
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      placeholder="Include relevant order IDs, dates, or specific errors..."
                      className="w-full p-3 bg-white border border-[#D8E0DC] rounded-xl text-[#0F3D2E] focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20"
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsTicketModalOpen(false)}
                      className="flex-1 py-2.5 bg-white border border-[#D8E0DC] text-[#5C6B63] rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl font-bold"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
