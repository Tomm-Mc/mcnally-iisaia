import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Flame, Sparkles, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchProgressSummary } from '../api/progress';
import { fetchSessions } from '../api/sessions';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { CATEGORY_LABELS_ES } from '../api/types';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: fetchProgressSummary,
  });

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  });

  const recentSessions = (sessionsData?.sessions ?? []).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-text">
          {user ? `¡Hola, ${user.name}! 👋` : 'Hola 👋'}
        </h1>
        <p className="text-sm text-slate-500">Nivel {user?.level}. Vamos a seguir practicando tu inglés.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-brand-accent" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Tu racha</p>
            <p className="text-xl font-extrabold">{user?.streakDays ?? 0} días</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-brand-secondary" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">XP total</p>
            <p className="text-xl font-extrabold">{user?.xp ?? 0} XP</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Target className="h-8 w-8 text-brand-primary" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Nivel</p>
            <p className="text-xl font-extrabold">{user?.level}</p>
          </div>
        </Card>
      </div>

      <Card className="flex flex-col items-start gap-3 bg-brand-primary text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold">¿Lista para practicar?</h2>
          <p className="text-sm text-violet-100">Elegí un escenario y empezá a charlar en inglés.</p>
        </div>
        <Button variant="secondary" size="lg" onClick={() => navigate('/scenarios')}>
          Empezar a charlar <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Button>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-bold text-brand-text">Tus 3 puntos débiles</h2>
        {loadingProgress ? (
          <Spinner />
        ) : progress && progress.topWeaknesses.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {progress.topWeaknesses.map((category) => (
              <Badge key={category} tone="error">
                {CATEGORY_LABELS_ES[category]}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Todavía no tenés suficientes datos. ¡Empezá a charlar!</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-brand-text">Últimas sesiones</h2>
        {loadingSessions ? (
          <Spinner />
        ) : recentSessions.length === 0 ? (
          <EmptyState
            emoji="🗨️"
            title="Todavía no charlaste con nadie"
            description="Elegí un escenario para tener tu primera conversación en inglés."
            action={<Button onClick={() => navigate('/scenarios')}>Ver escenarios</Button>}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {recentSessions.map((session) => (
              <Card
                key={session.id}
                className="flex cursor-pointer items-center justify-between transition-colors hover:border-slate-300 hover:bg-slate-50"
                onClick={() =>
                  navigate(
                    session.status === 'active' ? `/chat/${session.id}` : `/sessions/${session.id}/summary`
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {session.scenario?.emoji}
                  </span>
                  <div>
                    <p className="font-semibold">{session.scenario?.title}</p>
                    <p className="text-xs text-slate-400">{new Date(session.startedAt).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>
                <Badge tone={session.status === 'active' ? 'accent' : 'secondary'}>
                  {session.status === 'active' ? 'En curso' : `Puntaje ${session.score ?? '-'}`}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
