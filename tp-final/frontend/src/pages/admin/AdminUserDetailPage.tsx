import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MessageSquare, Mic } from 'lucide-react';
import { fetchAdminUserDetail } from '../../api/admin';
import { ApiError } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { StatCard } from '../../components/admin/StatCard';
import { Panel } from '../../components/admin/Panel';
import { MessagesByDayChart } from '../../components/admin/MessagesByDayChart';
import { DailyLineChart } from '../../components/admin/DailyLineChart';
import { SERIES_COLORS } from '../../components/admin/chartTheme';
import { ErrorsByCategoryChart } from '../../components/progress/ErrorsByCategoryChart';
import { formatPercent, percentage } from '../../components/admin/format';

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-user-detail', userId, 30],
    queryFn: () => fetchAdminUserDetail(userId!, 30),
    enabled: !!userId,
  });

  const activity = data?.activity ?? [];
  const messages = activity.reduce((sum, d) => sum + d.messages, 0);
  const voiceMessages = activity.reduce((sum, d) => sum + d.voiceMessages, 0);
  const activeDays = activity.filter((d) => d.messages > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/admin/users"
        className="flex w-fit items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a usuarios
      </Link>

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <p role="alert" className="text-sm font-semibold text-brand-error">
          {error instanceof ApiError && error.status === 404
            ? 'Ese usuario no existe.'
            : 'No se pudo cargar la actividad del usuario. Intentá de nuevo en un rato.'}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Actividad de estudiante</p>
            <h1 className="text-2xl font-extrabold text-slate-900">{data.user.name}</h1>
            <p className="text-sm text-slate-500">
              {data.user.email} · Nivel {data.user.level} · Últimos 30 días (UTC)
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard icon={MessageSquare} label="Mensajes (30 días)" value={messages} />
            <StatCard
              icon={CalendarDays}
              iconClassName="bg-amber-100 text-amber-700"
              label="Días activos"
              value={`${activeDays} / 30`}
              hint="Días con al menos un mensaje"
            />
            <StatCard
              icon={Mic}
              iconClassName="bg-teal-100 text-teal-700"
              label="Uso del modo voz"
              value={formatPercent(percentage(voiceMessages, messages))}
              hint={`${voiceMessages} mensajes dictados`}
            />
          </div>

          <Panel title="Mensajes por día" description="Escritos y por voz.">
            <MessagesByDayChart data={activity} />
          </Panel>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Sesiones iniciadas por día">
              <DailyLineChart data={activity} metric="sessionsStarted" unit="sesiones" color={SERIES_COLORS.tertiary} />
            </Panel>
            <Panel title="Errores por categoría" description="Todas sus correcciones, desde que usa la app.">
              <ErrorsByCategoryChart data={data.errorsByCategory} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
