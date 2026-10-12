import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircleHeart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ApiError } from '../api/client';

const DEMO_USERS = [
  { label: 'Entrar como Ana (demo)', email: 'ana@charla.dev', password: 'charla123' },
  { label: 'Entrar como Tomás (demo)', email: 'tomas@charla.dev', password: 'charla123' },
];

export function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function doLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    doLogin(email, password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <MessageCircleHeart className="h-10 w-10 text-brand-primary" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold text-brand-text">Charla</h1>
          <p className="text-sm text-slate-500">Practicá inglés charlando con personajes de IA.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-normal focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-100"
              placeholder="vos@ejemplo.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Contraseña
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-normal focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-100"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-2xl bg-brand-errorBg px-3 py-2 text-sm font-semibold text-brand-error">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            O probá con un usuario demo
          </p>
          {DEMO_USERS.map((demo) => (
            <Button
              key={demo.email}
              type="button"
              variant="ghost"
              disabled={submitting}
              onClick={() => {
                setEmail(demo.email);
                setPassword(demo.password);
                doLogin(demo.email, demo.password);
              }}
              className="w-full border border-slate-200"
            >
              {demo.label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
