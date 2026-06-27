import { useRef } from 'react';

// 6-box OTP input with auto-advance, backspace, and paste-fill.
export default function OtpInput({ value, onChange, length = 6 }) {
  const refs = useRef([]);
  const chars = value.padEnd(length).slice(0, length).split('');

  const set = (i, ch) => {
    const next = value.split('');
    next[i] = ch;
    onChange(next.join('').slice(0, length).trim());
  };

  const onKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (chars[i]?.trim()) set(i, ' ');
      else if (i > 0) { refs.current[i - 1]?.focus(); set(i - 1, ' '); }
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      set(i, e.key);
      refs.current[Math.min(i + 1, length - 1)]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e) => {
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (digits) { e.preventDefault(); onChange(digits); refs.current[Math.min(digits.length, length - 1)]?.focus(); }
  };

  return (
    <div className="flex justify-center gap-2" onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          value={chars[i]?.trim() || ''}
          onChange={() => {}}
          onKeyDown={(e) => onKey(i, e)}
          className="w-11 h-13 text-center text-xl font-bold text-txt-primary bg-bg-tertiary border border-line rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary-ring/40 py-2.5"
        />
      ))}
    </div>
  );
}
