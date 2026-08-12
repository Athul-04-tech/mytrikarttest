import React, { useState } from 'react';
import { Bell, Smartphone, MessageSquare, Mail, MessageCircle, CheckCircle2 } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '../../data/profileMockData';

export default function NotificationsSection() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [toastMessage, setToastMessage] = useState('');

  const toggleChannel = (notifId, channelKey) => {
    setNotifications(prev => prev.map(item => {
      if (item.id === notifId) {
        const updatedChannels = {
          ...item.channels,
          [channelKey]: !item.channels[channelKey]
        };
        return { ...item, channels: updatedChannels };
      }
      return item;
    }));

    setToastMessage(`Updated notification channels for ${notifId.replace('notif-', '')}`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#D8E0DC]">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Notifications & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Customize which order updates, price drop alerts, and promotional announcements you receive on each device
        </p>
      </div>

      {toastMessage && (
        <div className="mt-4 p-3 bg-[#E8F2EE] text-[#0F3D2E] text-xs font-bold rounded-xl border border-[#0F3D2E]/20 flex items-center space-x-2 animate-dropdown">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Channel Key Guide */}
      <div className="mt-6 p-4 rounded-2xl bg-[#FBF8F1] border border-[#D8E0DC] flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#0F3D2E] uppercase tracking-wider text-[10px]">
          Available Dispatch Channels:
        </span>
        <div className="flex flex-wrap items-center gap-4 text-[#5C6B63]">
          <span className="flex items-center space-x-1"><Smartphone className="w-3.5 h-3.5 text-[#0F3D2E]" /><span>Push App Alert</span></span>
          <span className="flex items-center space-x-1"><MessageSquare className="w-3.5 h-3.5 text-[#0F3D2E]" /><span>SMS Text</span></span>
          <span className="flex items-center space-x-1"><Mail className="w-3.5 h-3.5 text-[#0F3D2E]" /><span>Email Digest</span></span>
          <span className="flex items-center space-x-1"><MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /><span>WhatsApp</span></span>
        </div>
      </div>

      {/* Notification Categories List */}
      <div className="mt-6 divide-y divide-[#D8E0DC]/60 border border-[#D8E0DC] rounded-2xl overflow-hidden bg-white">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FBF8F1]/40 transition-colors"
          >
            {/* Title & Description */}
            <div className="max-w-md">
              <h4 className="font-bold text-xs sm:text-sm text-[#0F3D2E]">
                {notif.title}
              </h4>
              <p className="text-xs text-[#5C6B63] mt-0.5">
                {notif.description}
              </p>
            </div>

            {/* Tactile Channel Icon Toggles with Global Micro-Interactions */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Push Toggle */}
              <button
                type="button"
                onClick={() => toggleChannel(notif.id, 'push')}
                className={`p-2 rounded-xl border btn-interactive flex items-center space-x-1 text-xs font-bold cursor-pointer ${
                  notif.channels.push
                    ? 'bg-[#0F3D2E] text-[#FBF8F1] border-[#0F3D2E] shadow-2xs'
                    : 'bg-white text-[#5C6B63]/60 border-[#D8E0DC] hover:border-[#5C6B63]'
                }`}
                title="Toggle App Push Alert"
                aria-label="Toggle App Push Alert"
              >
                <Smartphone className="w-4 h-4 icon-interactive" />
                <span className="text-[10px] hidden md:inline">Push</span>
              </button>

              {/* SMS Toggle */}
              <button
                type="button"
                onClick={() => toggleChannel(notif.id, 'sms')}
                className={`p-2 rounded-xl border btn-interactive flex items-center space-x-1 text-xs font-bold cursor-pointer ${
                  notif.channels.sms
                    ? 'bg-[#0F3D2E] text-[#FBF8F1] border-[#0F3D2E] shadow-2xs'
                    : 'bg-white text-[#5C6B63]/60 border-[#D8E0DC] hover:border-[#5C6B63]'
                }`}
                title="Toggle SMS Text"
                aria-label="Toggle SMS Text"
              >
                <MessageSquare className="w-4 h-4 icon-interactive" />
                <span className="text-[10px] hidden md:inline">SMS</span>
              </button>

              {/* Email Toggle */}
              <button
                type="button"
                onClick={() => toggleChannel(notif.id, 'email')}
                className={`p-2 rounded-xl border btn-interactive flex items-center space-x-1 text-xs font-bold cursor-pointer ${
                  notif.channels.email
                    ? 'bg-[#0F3D2E] text-[#FBF8F1] border-[#0F3D2E] shadow-2xs'
                    : 'bg-white text-[#5C6B63]/60 border-[#D8E0DC] hover:border-[#5C6B63]'
                }`}
                title="Toggle Email Digest"
                aria-label="Toggle Email Digest"
              >
                <Mail className="w-4 h-4 icon-interactive" />
                <span className="text-[10px] hidden md:inline">Email</span>
              </button>

              {/* WhatsApp Toggle */}
              <button
                type="button"
                onClick={() => toggleChannel(notif.id, 'whatsapp')}
                className={`p-2 rounded-xl border btn-interactive flex items-center space-x-1 text-xs font-bold cursor-pointer ${
                  notif.channels.whatsapp
                    ? 'bg-[#128C7E] text-white border-[#128C7E] shadow-2xs'
                    : 'bg-white text-[#5C6B63]/60 border-[#D8E0DC] hover:border-[#5C6B63]'
                }`}
                title="Toggle WhatsApp Updates"
                aria-label="Toggle WhatsApp Updates"
              >
                <MessageCircle className="w-4 h-4 icon-interactive" />
                <span className="text-[10px] hidden md:inline">WA</span>
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
