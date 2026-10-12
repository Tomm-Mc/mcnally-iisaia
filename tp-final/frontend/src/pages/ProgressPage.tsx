import { useQuery } from '@tanstack/react-query';
import { fetchProgressSummary, fetchProgressTimeline } from '../api/progress';
import { CATEGORY_LABELS_ES } from '../api/types';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorsByCategoryChart } from '../components/progress/ErrorsByCategoryChart';
import { ProgressOverTimeChart } from '../components/progress/ProgressOverTimeChart';

export function ProgressPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: fetchProgressSummary,
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ['progress-timeline'],
    queryFn: fetchProgressTimeline,
  });

  const isLoading = loadingSummary || loadingTimeline;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-text">Tu progreso</h1>
        <p className="text-sm text-slate-500">Así viene evolucionando tu inglés.</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !summary || summary.totals.totalMessages === 0 ? (
        <EmptyState emoji="📈" title="Todavía no hay datos" description="Charlá con un personaje para empezar a ver tu progreso." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="text-center">
              <p className="text-xs font-semibold uppercase text-slate-400">Sesiones completadas</p>
              <p className="text-2xl font-extrabold">{summary.totals.totalSessions}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs font-semibold uppercase text-slate-400">Mensajes enviados</p>
              <p className="text-2xl font-extrabold">{summary.totals.totalMessages}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs font-semibold uppercase text-slate-400">Errores detectados</p>
              <p className="text-2xl font-extrabold">{summary.totals.totalErrors}</p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 font-bold text-brand-text">Errores por categoría</h2>
            <ErrorsByCategoryChart data={summary.errorsByCategory} />
          </Card>

          <Card>
            <h2 className="mb-3 font-bold text-brand-text">Errores en el tiempo (últimos 30 días)</h2>
            <ProgressOverTimeChart data={timeline?.timeline ?? []} />
          </Card>

          <Card>
            <h2 className="mb-3 font-bold text-brand-text">Errores recientes</h2>
            {summary.recentErrors.length === 0 ? (
              <p className="text-sm text-slate-500">No hay errores recientes.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                      <th className="py-2 pr-3">Original</th>
                      <th className="py-2 pr-3">Corrección</th>
                      <th className="py-2 pr-3">Categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentErrors.map((err) => (
                      <tr key={err.id} className="border-b border-slate-50">
                        <td className="py-2 pr-3 text-brand-error line-through">{err.original}</td>
                        <td className="py-2 pr-3 font-semibold">{err.corrected}</td>
                        <td className="py-2 pr-3 text-slate-500">{CATEGORY_LABELS_ES[err.category]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
