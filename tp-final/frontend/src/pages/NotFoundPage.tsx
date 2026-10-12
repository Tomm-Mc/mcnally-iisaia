import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-bg px-4 text-center">
      <span className="text-6xl" aria-hidden="true">
        🧭
      </span>
      <h1 className="text-3xl font-extrabold text-brand-text">Página no encontrada</h1>
      <p className="text-sm text-slate-500">Parece que este camino no existe. Volvamos al inicio.</p>
      <Link to="/">
        <Button>Ir al inicio</Button>
      </Link>
    </div>
  );
}
