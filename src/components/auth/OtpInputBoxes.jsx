import React, { useRef, useEffect } from 'react';

export default function OtpInputBoxes({ length = 6, value = [], onChange, hasError = false }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first empty input box on mount
    const firstEmptyIndex = value.findIndex(v => !v);
    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    if (inputRefs.current[targetIndex]) {
      inputRefs.current[targetIndex].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const rawVal = e.target.value;
    const digit = rawVal.replace(/\D/g, '').slice(-1); // Only take last typed digit

    const newOtp = [...value];
    newOtp[index] = digit;
    onChange(newOtp);

    // Auto-advance to next input if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move back and clear previous
        const newOtp = [...value];
        newOtp[index - 1] = '';
        onChange(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...value];
        newOtp[index] = '';
        onChange(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    const newOtp = [...value];
    for (let i = 0; i < length; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    onChange(newOtp);

    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 my-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          aria-label={`Digit ${index + 1}`}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl transition-all duration-150 bg-white border input-interactive ${
            hasError
              ? 'border-[#D7263D] ring-2 ring-[#D7263D]/20 text-[#D7263D]'
              : value[index]
              ? 'border-[#FA661C] text-[#FA661C] ring-1 ring-[#FF811A]/40 bg-[#FFF8F2]/40'
              : 'border-[#EAE3DC] text-[#FA661C] hover:border-[#6B6058]/60'
          } shadow-xs`}
        />
      ))}
    </div>
  );
}
