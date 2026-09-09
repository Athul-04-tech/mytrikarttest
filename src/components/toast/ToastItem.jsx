import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, ShoppingBag, Heart } from 'lucide-react';

export default function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);

      if (elapsed >= toast.duration) {
        clearInterval(interval);
        onDismiss();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [toast.duration, onDismiss]);

  const variantStyles = {
    success: {
      border: 'border-[#FA661C]/40',
      iconBg: 'bg-[#FFF3EC] text-[#FA661C]',
      icon: CheckCircle2,
      progressColor: 'bg-[#FA661C]'
    },
    info: {
      border: 'border-[#FF811A]/60',
      iconBg: 'bg-[#FFF8F2] text-[#FA661C]',
      icon: Info,
      progressColor: 'bg-[#FF811A]'
    },
    error: {
      border: 'border-[#D7263D]/40',
      iconBg: 'bg-[#FDE8EA] text-[#D7263D]',
      icon: AlertCircle,
      progressColor: 'bg-[#D7263D]'
    }
  };

  const style = variantStyles[toast.variant] || variantStyles.success;
  const IconComponent = style.icon;

  return (
    <div 
      className={`pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border ${style.border} overflow-hidden transform transition-all duration-200 animate-dropdown text-xs`}
    >
      <div className="p-3.5 flex items-start space-x-3">
        
        {/* Optional Thumbnail or Icon Badge */}
        {toast.thumbnail ? (
          <img 
            src={toast.thumbnail} 
            alt="Thumbnail" 
            className="w-10 h-10 rounded-xl object-cover border border-[#EAE3DC] shrink-0"
          />
        ) : (
          <div className={`p-1.5 rounded-xl ${style.iconBg} shrink-0 mt-0.5`}>
            <IconComponent className="w-4 h-4" />
          </div>
        )}

        {/* Text Details */}
        <div className="flex-1 min-w-0 pr-1">
          {toast.title && (
            <h4 className="font-extrabold text-[#FA661C] text-xs leading-snug truncate">
              {toast.title}
            </h4>
          )}
          <p className="text-[11px] text-[#6B6058] mt-0.5 leading-tight">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg text-[#6B6058] hover:text-[#FA661C] hover:bg-[#FFFFFF] transition-colors shrink-0 icon-interactive cursor-pointer"
          aria-label="Dismiss Notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Animated Auto-Dismiss Progress Sliver */}
      {toast.duration > 0 && (
        <div className="w-full h-1 bg-[#FFF3EC] overflow-hidden">
          <div 
            className={`h-full ${style.progressColor} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
