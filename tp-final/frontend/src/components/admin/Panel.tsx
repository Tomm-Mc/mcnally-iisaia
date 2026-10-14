import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  description?: string;
  /** Contenido a la derecha del título (ej. un total o un link). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Tarjeta del panel de administración: borde fino en vez de sombra, para distinguirse de la app del estudiante. */
export function Panel({ title, description, aside, children, className = '' }: PanelProps) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        {aside && <div className="text-xs text-slate-500">{aside}</div>}
      </div>
      {children}
    </section>
  );
}
