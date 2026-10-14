import type { ReactNode } from 'react';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center">
      <span className="text-5xl" role="img" aria-hidden="true">
        {emoji}
      </span>
      <p className="text-lg font-bold text-brand-text">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}
