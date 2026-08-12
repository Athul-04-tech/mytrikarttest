import React from 'react';

/**
 * Lightweight, instant page transition wrapper
 */
export default function PageTransitionWrapper({ children }) {
  return (
    <div className="min-h-full flex flex-col flex-1 animate-reveal">
      {children}
    </div>
  );
}
