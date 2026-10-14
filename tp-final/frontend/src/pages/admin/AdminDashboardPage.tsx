import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Dumbbell,
  GraduationCap,
  KeyRound,
  MessageSquare,
  Mic,
  Target,
  Users,
} from 'lucide-react';
import { fetchAdminActivity, fetchAdminOverview, fetchAdminUsers } from '../../api/admin';
import { Spinner } from '../../components/ui/Spinner';
import { StatCard } from '../../components/admin/StatCard';
import { Panel } from '../../components/admin/Panel';
import { MessagesByDayChart } from '../../components/admin/MessagesByDayChart';
import { DailyLineChart } from '../../components/admin/DailyLineChart';
import { RankingBarChart } from '../../components/admin/RankingBarChart';
import { SERIES_COLORS } from '../../components/admin/chartTheme';
import { ErrorsByCategoryChart } from '../../components/progress/ErrorsByCategoryChart';
import { formatNumber, formatPercent } from '../../components/admin/format';

export function AdminDashboardPage() {
  const { data: overview, isLoading, isError } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: fetchAdminOverview,
  });
  const { data: activityData } = useQuery({
    queryKey: ['admin-activity', 30],
    queryFn: () => fetchAdminActivity(30),
  });
  const { data: usersData } = useQuery({ queryKey: ['admin-users'], queryFn: fetchAdminUsers });

  const activity = activityData?.activity ?? [];
  const messagesLast30 = activity.reduce((sum, d) => sum + d.messages, 0);
  const students = (usersData?.users ?? []).filter((u) => u.role === 'student');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Panel de administración</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Uso de Charla</h1>
        <p className="text-sm text-slate-500">Cómo usan la app los estudiantes. Los días se cuentan en UTC.</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError || !overview ? (
        <p role="alert" className="text-sm font-semibold text-brand-error">
          No se pudieron cargar las estadísticas. Intentá de nuevo en un rato.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-xl bg-slate-900 p-4 text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-amber-400" aria-hidden="true" />
              <div>
                <p className="font-bold text-white">Motor de IA</p>
                <p className="text-xs">
                  Chat {overview.ai.chatModel} · STT {overview.ai.sttModel} · TTS {overview.ai.ttsModel} · Límite{' '}
                  {overview.ai.dailyMessageLimit} mensajes/día por estudiante
                </p>
              </div>
            </div>
            <span
              className={`self-start rounded-full px-3 py-1 text-xs font-bold sm:self-auto ${
                overview.ai.mode === 'real' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {overview.ai.mode === 'real' ? 'Modo real (OpenAI, con costo)' : 'Modo mock (sin costo)'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Estudiantes"
              value={overview.students.total}
              hint={overview.students.byLevel.map((l) => `${l.level}: ${l.count}`).join(' · ') || 'Sin estudiantes'}
            />
            <StatCard
              icon={Activity}
              iconClassName="bg-teal-100 text-teal-700"
              label="Activos 7 / 30 días"
              value={`${overview.students.active7d} / ${overview.students.active30d}`}
              hint="Mandaron al menos un mensaje"
            />
            <StatCard
              icon={MessageSquare}
              label="Mensajes"
              value={formatNumber(overview.usage.messages)}
              hint={`${messagesLast30} en los últimos 30 días`}
            />
            <StatCard
              icon={Mic}
              iconClassName="bg-teal-100 text-teal-700"
              label="Uso del modo voz"
              value={formatPercent(overview.usage.voiceShare)}
              hint={`${overview.usage.voiceMessages} mensajes dictados`}
            />
            <StatCard
              icon={GraduationCap}
              iconClassName="bg-amber-100 text-amber-700"
              label="Sesiones"
              value={overview.usage.sessionsStarted}
              hint={`${formatPercent(overview.usage.completionRate)} terminadas`}
            />
            <StatCard
              icon={Target}
              iconClassName="bg-amber-100 text-amber-700"
              label="Puntaje promedio"
              value={formatNumber(overview.usage.averageScore)}
              hint={`${formatNumber(overview.usage.errorsPerMessage)} errores por mensaje`}
            />
            <StatCard
              icon={Dumbbell}
              label="Ejercicios"
              value={overview.usage.exercisesAnswered}
              hint={`respondidos · ${formatPercent(overview.usage.exerciseAccuracy)} correctos`}
            />
            <StatCard
              icon={overview.usage.limitHits30d > 0 ? AlertTriangle : CheckCircle2}
              iconClassName={overview.usage.limitHits30d > 0 ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'}
              label="Topes del límite diario"
              value={overview.usage.limitHits30d}
              hint="Estudiante-días al límite (30 días)"
            />
          </div>

          <Panel
            title="Mensajes por día"
            description="Mensajes enviados por los estudiantes en los últimos 30 días, escritos y por voz."
            aside={`${messagesLast30} mensajes`}
          >
            <MessagesByDayChart data={activity} />
          </Panel>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Estudiantes activos por día" description="Estudiantes distintos que mandaron al menos un mensaje.">
              <DailyLineChart data={activity} metric="activeStudents" unit="estudiantes" color={SERIES_COLORS.secondary} />
            </Panel>
            <Panel title="Sesiones iniciadas por día" description="Conversaciones nuevas con un personaje.">
              <DailyLineChart data={activity} metric="sessionsStarted" unit="sesiones" color={SERIES_COLORS.tertiary} />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              title="Uso por estudiante"
              description="Mensajes enviados en total."
              aside={
                <Link to="/admin/users" className="flex items-center gap-1 font-semibold text-violet-700 hover:underline">
                  Ver usuarios <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
            >
              {students.length === 0 ? (
                <p className="text-sm text-slate-500">Todavía no hay estudiantes.</p>
              ) : (
                <RankingBarChart
                  unit="mensajes"
                  data={students.map((u) => ({
                    label: u.name,
                    value: u.messages,
                    detail: `${u.sessions} sesiones · ${u.corrections} errores`,
                  }))}
                />
              )}
            </Panel>

            <Panel title="Escenarios más usados" description="Sesiones iniciadas por escenario.">
              <RankingBarChart
                unit="sesiones"
                color={SERIES_COLORS.tertiary}
                data={overview.scenarios.map((s) => ({
                  label: s.title,
                  value: s.sessions,
                  detail: `${s.finished} terminadas · puntaje ${formatNumber(s.averageScore)}`,
                }))}
              />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Errores más comunes" description="Correcciones de todos los estudiantes, por categoría.">
              <ErrorsByCategoryChart data={overview.errorsByCategory} />
            </Panel>
            <Panel
              title="Accesos (7 días)"
              aside={
                <Link to="/admin/logins" className="flex items-center gap-1 font-semibold text-violet-700 hover:underline">
                  Ver accesos <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
            >
              <dl className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Exitosos', value: overview.logins7d.success },
                  { label: 'Fallidos', value: overview.logins7d.invalidCredentials },
                  { label: 'Bloqueados', value: overview.logins7d.blocked },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-slate-50 p-3">
                    <dt className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500">
                      <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                      {item.label}
                    </dt>
                    <dd className="text-2xl font-extrabold text-slate-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
