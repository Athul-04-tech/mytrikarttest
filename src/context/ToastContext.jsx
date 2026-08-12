import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastItem from '../components/toast/ToastItem';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ 
    title, 
    message, 
    variant = 'success', // 'success' | 'info' | 'error'
    thumbnail = null, 
    duration = 3500 
  }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, title, message, variant, thumbnail, duration };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep at most 5 toasts stacked
    return id;
  }, []);

  // Helper quick methods
  const toast = {
    show: addToast,
    success: (title, message, options = {}) => addToast({ title, message, variant: 'success', ...options }),
    info: (title, message, options = {}) => addToast({ title, message, variant: 'info', ...options }),
    error: (title, message, options = {}) => addToast({ title, message, variant: 'error', ...options }),
    cart: (title, message, thumbnail, options = {}) => addToast({ title, message, variant: 'success', thumbnail, ...options }),
    dismiss: removeToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Toast Render Stack Container */}
      <div 
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0 sm:right-6 sm:bottom-6"
      >
        {toasts.map((item) => (
          <ToastItem 
            key={item.id} 
            toast={item} 
            onDismiss={() => removeToast(item.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
