// Shared UI primitives — Jarvis / hacker dark theme.
import { ShieldCheck } from 'lucide-react';

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring';
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-base px-5 py-2.5' };
  const variants = {
    primary: 'bg-primary text-bg-primary hover:bg-primary-hover shadow-glow font-semibold',
    soft: 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20',
    outline: 'border border-line bg-bg-secondary text-txt-primary hover:border-primary/50 hover:text-primary',
    ghost: 'text-txt-secondary hover:bg-bg-tertiary hover:text-txt-primary',
    danger: 'bg-accent-red text-white hover:opacity-90',
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-bg-secondary border border-line rounded-2xl shadow-soft ${
        hover ? 'transition hover:shadow-lift hover:-translate-y-0.5 hover:border-primary/30' : ''
      } ${className}`}
      {...props}
    />
  );
}

const BADGE = {
  gray: 'bg-bg-tertiary text-txt-secondary',
  blue: 'bg-primary/12 text-primary border border-primary/25',
  green: 'bg-accent-green/12 text-accent-green border border-accent-green/25',
  red: 'bg-accent-red/12 text-accent-red border border-accent-red/25',
  orange: 'bg-accent-orange/12 text-accent-orange border border-accent-orange/25',
  purple: 'bg-accent-purple/12 text-accent-purple border border-accent-purple/25',
};
export function Badge({ color = 'gray', className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${BADGE[color]} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-bg-tertiary border border-line rounded-xl px-3 py-2 text-sm text-txt-primary placeholder:text-txt-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary-ring/40 transition ${className}`}
      {...props}
    />
  );
}

export function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin ${className}`}
    />
  );
}

// Brand mark — glowing cyan shield.
export function Logo({ size = 40 }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent-blue/15 text-primary border border-primary/30 shadow-glow"
    >
      <ShieldCheck size={size * 0.55} />
    </span>
  );
}
