import { useQuery } from '@tanstack/react-query';
import { fetchAdminActivity, fetchAdminLogins } from '../../api/admin';
import type { LoginOutcome } from '../../api/types';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Panel } from '../../components/admin/Panel';
import { LoginsChart } from '../../components/admin/LoginsChart';
import { describeUserAgent, formatDateTime } from '../../components/admin/format';

// El resultado siempre va como texto (no sólo color) para que sea legible sin distinguir colores.
const OUTCOME_BADGES: Record<LoginOutcome, { label: string; className: string }> = {
  success: { label: 'Exitoso', className: 'bg-teal-100 text-teal-800' },
  invalid_credentials: { label: 'Credenciales inválidas', className: 'bg-amber-100 text-amber-800' },
  blocked: { label: 'Bloqueado', className: 'bg-red-100 text-red-800' },
};

export function AdminLoginsPage() {
  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ['admin-activity', 30],
    queryFn: () => fetchAdminActivity(30),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-logins', 50],
    queryFn: () => fetchAdminLogins(50),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Panel de administración</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Accesos</h1>
        <p className="text-sm text-slate-500">
          Intentos de login, exitosos y fallidos. Tras 5 fallos en 15 minutos, el email queda bloqueado.
        </p>
      </div>

      <Panel title="Logins por día" description="Últimos 30 días (UTC).">
        {loadingActivity ? <Spinner /> : <LoginsChart data={activityData?.activity ?? []} />}
      </Panel>

      <Panel title="Últimos 50 intentos">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p role="alert" className="text-sm font-semibold text-brand-error">
            No se pudieron cargar los accesos. Intentá de nuevo en un rato.
          </p>
        ) : !data || data.logins.length === 0 ? (
          <EmptyState emoji="🔑" title="Todavía no hay accesos registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Resultado</th>
                  <th className="py-2 pr-3">IP</th>
                  <th className="py-2">Dispositivo</th>
                </tr>
              </thead>
              <tbody>
                {data.logins.map((event) => {
                  const badge = OUTCOME_BADGES[event.outcome];
                  return (
                    <tr key={event.id} className="border-b border-slate-100">
                      <td className="whitespace-nowrap py-2 pr-3 text-xs text-slate-500">{formatDateTime(event.createdAt)}</td>
                      <td className="py-2 pr-3">
                        <p className="font-semibold text-slate-900">{event.email}</p>
                        <p className="text-xs text-slate-500">{event.user ? event.user.name : 'Cuenta inexistente'}</p>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-slate-500">{event.ip ?? '—'}</td>
                      <td className="py-2 text-xs text-slate-500" title={event.userAgent ?? undefined}>
                        {describeUserAgent(event.userAgent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
