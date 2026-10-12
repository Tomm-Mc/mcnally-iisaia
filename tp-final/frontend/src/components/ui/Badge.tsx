import type { ReactNode } from 'react';

type Tone = 'primary' | 'secondary' | 'accent' | 'error' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const TONE_CLASSES: Record<Tone, string> = {
  primary: 'bg-violet-100 text-brand-primary',
  secondary: 'bg-teal-100 text-teal-700',
  accent: 'bg-amber-100 text-amber-700',
  error: 'bg-brand-errorBg text-brand-error',
  neutral: 'bg-slate-100 text-slate-600',
};

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </span>
  );
}
