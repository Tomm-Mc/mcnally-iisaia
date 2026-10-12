import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchSessions } from '../api/sessions';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

export function HistoryPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['sessions'], queryFn: fetchSessions });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-text">Historial de conversaciones</h1>
        <p className="text-sm text-slate-500">Todas tus sesiones de práctica, pasadas y en curso.</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data || data.sessions.length === 0 ? (
        <EmptyState
          emoji="🕘"
          title="Todavía no tenés sesiones"
          description="Empezá una conversación para verla acá."
          action={<Button onClick={() => navigate('/scenarios')}>Ver escenarios</Button>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {data.sessions.map((session) => (
            <Card key={session.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {session.scenario?.emoji}
                </span>
                <div>
                  <p className="font-semibold">{session.scenario?.title}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(session.startedAt).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={session.status === 'active' ? 'accent' : 'secondary'}>
                  {session.status === 'active' ? 'En curso' : `Puntaje ${session.score ?? '-'}`}
                </Badge>
                <Button variant="ghost" size="sm" className="border border-slate-200" onClick={() => navigate(`/chat/${session.id}`)}>
                  {session.status === 'active' ? 'Continuar' : 'Releer'}
                </Button>
                {session.status === 'finished' && (
                  <Button variant="ghost" size="sm" className="border border-slate-200" onClick={() => navigate(`/sessions/${session.id}/summary`)}>
                    Resumen
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
