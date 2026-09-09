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
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#EAE3DC]">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Notifications & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Customize which order updates, price drop alerts, and promotional announcements you receive on each device
        </p>
      </div>

      {toastMessage && (
        <div className="mt-4 p-3 bg-[#FFF3EC] text-[#FA661C] text-xs font-bold rounded-xl border border-[#FA661C]/20 flex items-center space-x-2 animate-dropdown">
          <CheckCircle2 className="w-4 h-4 text-[#FF811A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Channel Key Guide */}
      <div className="mt-6 p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC] flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#FA661C] uppercase tracking-wider text-[10px]">
          Available Dispatch Channels:
        </span>
        <div className="flex flex-wrap items-center gap-4 text-[#6B6058]">
          <span className="flex items-center space-x-1"><Smartphone className="w-3.5 h-3.5 text-[#FA661C]" /><span>Push App Alert</span></span>
          <span className="flex items-center space-x-1"><MessageSquare className="w-3.5 h-3.5 text-[#FA661C]" /><span>SMS Text</span></span>
          <span className="flex items-center space-x-1"><Mail className="w-3.5 h-3.5 text-[#FA661C]" /><span>Email Digest</span></span>
          <span className="flex items-center space-x-1"><MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /><span>WhatsApp</span></span>
        </div>
      </div>

      {/* Notification Categories List */}
      <div className="mt-6 divide-y divide-[#EAE3DC]/60 border border-[#EAE3DC] rounded-2xl overflow-hidden bg-white">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FFFFFF]/40 transition-colors"
          >
            {/* Title & Description */}
            <div className="max-w-md">
              <h4 className="font-bold text-xs sm:text-sm text-[#FA661C]">
                {notif.title}
              </h4>
              <p className="text-xs text-[#6B6058] mt-0.5">
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
                    ? 'bg-[#FA661C] text-[#FFFFFF] border-[#FA661C] shadow-2xs'
                    : 'bg-white text-[#6B6058]/60 border-[#EAE3DC] hover:border-[#6B6058]'
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
                    ? 'bg-[#FA661C] text-[#FFFFFF] border-[#FA661C] shadow-2xs'
                    : 'bg-white text-[#6B6058]/60 border-[#EAE3DC] hover:border-[#6B6058]'
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
                    ? 'bg-[#FA661C] text-[#FFFFFF] border-[#FA661C] shadow-2xs'
                    : 'bg-white text-[#6B6058]/60 border-[#EAE3DC] hover:border-[#6B6058]'
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
                    : 'bg-white text-[#6B6058]/60 border-[#EAE3DC] hover:border-[#6B6058]'
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
