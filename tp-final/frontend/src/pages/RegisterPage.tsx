import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { MessageCircleHeart } from 'lucide-react';
import { register } from '../api/auth';
import { ApiError } from '../api/client';
import type { Level } from '../api/types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { HOME_BY_ROLE } from '../components/layout/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

const LEVEL_OPTIONS: { value: Level; label: string }[] = [
  { value: 'A2', label: 'A2 · Básico (frases simples del día a día)' },
  { value: 'B1', label: 'B1 · Intermedio (me defiendo en charlas comunes)' },
  { value: 'B2', label: 'B2 · Intermedio alto (hablo con bastante fluidez)' },
];

const INPUT_CLASSES =
  'rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-normal focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-100';

export function RegisterPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [level, setLevel] = useState<Level>('A2');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      const { user: created } = await register({ name, email, password, level });
      // No se inicia sesión sola: se vuelve al login con el email cargado.
      navigate('/login', { replace: true, state: { registeredEmail: created.email } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta. Intentá de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-8">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <MessageCircleHeart className="h-10 w-10 text-brand-primary" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold text-brand-text">Creá tu cuenta</h1>
          <p className="text-sm text-slate-500">Empezá a practicar inglés charlando con personajes de IA.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Nombre
            <input
              type="text"
              required
              minLength={2}
              maxLength={60}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASSES}
              placeholder="¿Cómo te llamás?"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASSES}
              placeholder="vos@ejemplo.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Contraseña
            <input
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASSES}
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Repetí la contraseña
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={INPUT_CLASSES}
              placeholder="••••••••"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Tu nivel de inglés
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className={INPUT_CLASSES}>
              {LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p role="alert" className="rounded-2xl bg-brand-errorBg px-3 py-2 text-sm font-semibold text-brand-error">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="mt-5 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-primary hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
