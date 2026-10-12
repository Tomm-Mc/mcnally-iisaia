import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-primary text-white hover:bg-violet-700 focus-visible:ring-brand-primary',
  secondary: 'bg-brand-secondary text-white hover:bg-teal-600 focus-visible:ring-brand-secondary',
  ghost: 'bg-transparent text-brand-text hover:bg-slate-100 focus-visible:ring-slate-300',
  danger: 'bg-brand-error text-white hover:bg-red-500 focus-visible:ring-brand-error',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-6 py-3',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold shadow-sm transition-colors
        disabled:cursor-not-allowed disabled:opacity-50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
