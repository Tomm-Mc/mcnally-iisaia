import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Star, TrendingUp } from 'lucide-react';
import { fetchSession } from '../api/sessions';
import { CATEGORY_LABELS_ES, type SessionSummary } from '../api/types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export function SessionSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSession(sessionId!),
    enabled: !!sessionId,
  });

  const summary: SessionSummary | null = useMemo(() => {
    if (!data?.session.summary) return null;
    try {
      return JSON.parse(data.session.summary) as SessionSummary;
    } catch {
      return null;
    }
  }, [data]);

  const errorsByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const message of data?.session.messages ?? []) {
      for (const correction of message.corrections ?? []) {
        counts.set(correction.category, (counts.get(correction.category) ?? 0) + 1);
      }
    }
    return [...counts.entries()];
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const { session } = data;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="text-center">
        <span className="text-4xl" aria-hidden="true">
          {session.scenario?.emoji}
        </span>
        <h1 className="mt-2 text-2xl font-extrabold text-brand-text">¡Sesión terminada!</h1>
        <p className="text-sm text-slate-500">{session.scenario?.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center gap-1 text-center">
          <Star className="h-7 w-7 text-brand-accent" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase text-slate-400">Puntaje</p>
          <p className="text-3xl font-extrabold">{summary?.score ?? session.score ?? '-'}</p>
        </Card>
        <Card className="flex flex-col items-center gap-1 text-center">
          <Sparkles className="h-7 w-7 text-brand-secondary" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase text-slate-400">XP ganado</p>
          <p className="text-3xl font-extrabold">+{session.xpEarned}</p>
        </Card>
      </div>

      {summary && (
        <>
          <Card>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-brand-text">
              <TrendingUp className="h-5 w-5 text-brand-secondary" aria-hidden="true" /> Puntos fuertes
            </h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
              {summary.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-2 font-bold text-brand-text">Para mejorar</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
              {summary.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Card>

          <Card className="bg-violet-50">
            <h2 className="mb-1 font-bold text-brand-primary">💡 Consejo</h2>
            <p className="text-sm text-slate-700">{summary.tip}</p>
          </Card>
        </>
      )}

      {errorsByCategory.length > 0 && (
        <Card>
          <h2 className="mb-2 font-bold text-brand-text">Errores por categoría</h2>
          <div className="flex flex-wrap gap-2">
            {errorsByCategory.map(([category, count]) => (
              <Badge key={category} tone="error">
                {CATEGORY_LABELS_ES[category as keyof typeof CATEGORY_LABELS_ES]} ({count})
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-center gap-3">
        <Button variant="ghost" className="border border-slate-200" onClick={() => navigate('/scenarios')}>
          Otra conversación
        </Button>
        <Button onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    </div>
  );
}
