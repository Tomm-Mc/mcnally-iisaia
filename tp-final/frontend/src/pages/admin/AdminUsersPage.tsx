import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { fetchAdminUsers } from '../../api/admin';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Panel } from '../../components/admin/Panel';
import { RankingBarChart } from '../../components/admin/RankingBarChart';
import { SERIES_COLORS } from '../../components/admin/chartTheme';
import { formatDateTime, formatNumber, formatPercent } from '../../components/admin/format';

export function AdminUsersPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-users'], queryFn: fetchAdminUsers });
  const students = (data?.users ?? []).filter((u) => u.role === 'student');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Panel de administración</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-500">Uso y progreso de cada cuenta. Tocá un estudiante para ver su actividad.</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p role="alert" className="text-sm font-semibold text-brand-error">
          No se pudieron cargar los usuarios. Intentá de nuevo en un rato.
        </p>
      ) : !data || data.users.length === 0 ? (
        <EmptyState emoji="👥" title="Todavía no hay usuarios" />
      ) : (
        <>
          {students.length > 0 && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="Mensajes por estudiante" description="Total de mensajes enviados.">
                <RankingBarChart
                  unit="mensajes"
                  data={students.map((u) => ({ label: u.name, value: u.messages, detail: `${u.messagesToday} hoy` }))}
                />
              </Panel>
              <Panel title="Sesiones por estudiante" description="Conversaciones iniciadas.">
                <RankingBarChart
                  unit="sesiones"
                  color={SERIES_COLORS.tertiary}
                  data={students.map((u) => ({
                    label: u.name,
                    value: u.sessions,
                    detail: `${u.finishedSessions} terminadas · puntaje ${formatNumber(u.averageScore)}`,
                  }))}
                />
              </Panel>
            </div>
          )}

          <Panel title="Todas las cuentas" aside={`${data.users.length} cuentas`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-2 pr-3">Usuario</th>
                    <th className="py-2 pr-3">Nivel</th>
                    <th className="py-2 pr-3 text-right">Sesiones</th>
                    <th className="py-2 pr-3 text-right">Mensajes</th>
                    <th className="py-2 pr-3 text-right">Hoy</th>
                    <th className="py-2 pr-3 text-right">Errores</th>
                    <th className="py-2 pr-3 text-right">Puntaje</th>
                    <th className="py-2 pr-3 text-right">Ejercicios</th>
                    <th className="py-2 pr-3 text-right">XP · Racha</th>
                    <th className="py-2 pr-3">Último login</th>
                    <th className="py-2" aria-label="Ver detalle" />
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                      <td className="py-2 pr-3">
                        <p className="font-semibold text-slate-900">
                          {u.name}
                          {u.role === 'admin' && (
                            <span className="ml-2 rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-slate-900">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-2 pr-3">{u.role === 'admin' ? '—' : u.level}</td>
                      <td className="py-2 pr-3 text-right">
                        {u.sessions}
                        <span className="text-xs text-slate-500"> ({u.finishedSessions} term.)</span>
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold">{u.messages}</td>
                      <td className="py-2 pr-3 text-right">{u.messagesToday}</td>
                      <td className="py-2 pr-3 text-right">{u.corrections}</td>
                      <td className="py-2 pr-3 text-right">{formatNumber(u.averageScore)}</td>
                      <td className="py-2 pr-3 text-right">
                        {u.exercisesAnswered}
                        <span className="text-xs text-slate-500"> ({formatPercent(u.exerciseAccuracy)})</span>
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {u.xp} · 🔥{u.streakDays}
                      </td>
                      <td className="py-2 pr-3 text-xs text-slate-500">{formatDateTime(u.lastLoginAt)}</td>
                      <td className="py-2 text-right">
                        {u.role === 'student' && (
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                            aria-label={`Ver actividad de ${u.name}`}
                          >
                            Actividad <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
