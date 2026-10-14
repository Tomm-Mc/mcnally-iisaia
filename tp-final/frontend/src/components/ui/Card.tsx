import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...rest }: CardProps) {
  // Si la página pasa su propio fondo (ej. bg-brand-primary), no se suma bg-white: con las dos
  // clases juntas gana la que Tailwind genere última, no la del className, y el fondo se pierde.
  const hasCustomBackground = /(^|\s)bg-/.test(className);
  const surface = hasCustomBackground ? '' : 'border border-slate-200 bg-white';

  return (
    <div className={`rounded-xl p-5 ${surface} ${className}`} {...rest}>
      {children}
    </div>
  );
}
