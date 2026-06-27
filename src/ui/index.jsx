// Phase 10.2 — shared premium UI primitives (light/blue design system).
// Used across chat, dashboards and admin so everything stays consistent.

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring';
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-base px-5 py-2.5' };
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-soft',
    soft: 'bg-primary-tint text-primary hover:bg-blue-100',
    outline: 'border border-line bg-bg-secondary text-txt-primary hover:border-primary/40 hover:text-primary',
    ghost: 'text-txt-secondary hover:bg-bg-tertiary hover:text-txt-primary',
    danger: 'bg-accent-red text-white hover:opacity-90',
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-bg-secondary border border-line rounded-2xl shadow-soft ${
        hover ? 'transition hover:shadow-lift hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    />
  );
}

const BADGE = {
  gray: 'bg-bg-tertiary text-txt-secondary',
  blue: 'bg-primary-tint text-primary',
  green: 'bg-green-50 text-accent-green',
  red: 'bg-red-50 text-accent-red',
  orange: 'bg-orange-50 text-accent-orange',
  purple: 'bg-purple-50 text-accent-purple',
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
      className={`w-full bg-bg-secondary border border-line rounded-xl px-3 py-2 text-sm text-txt-primary placeholder:text-txt-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary-ring/40 transition ${className}`}
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

// Brand mark — blue gradient shield badge.
export function Logo({ size = 40 }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-400 text-white shadow-soft"
    >
      <span style={{ fontSize: size * 0.5 }}>🛡️</span>
    </span>
  );
}
