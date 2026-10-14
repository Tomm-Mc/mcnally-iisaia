import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Eye, KeyRound, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/*
 * Layout del administrador. Comparte el estilo del AppLayout del estudiante,
 * pero se identifica con la etiqueta "ADMIN", el aviso de sólo lectura y la
 * pill "Administrador", para que nunca se confunda con la app de práctica.
 */
const NAV_ITEMS = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Usuarios', icon: Users, end: false },
  { to: '/admin/logins', label: 'Accesos', icon: KeyRound, end: false },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <ShieldCheck className={`${compact ? 'h-6 w-6' : 'h-7 w-7'} text-amber-400`} aria-hidden="true" />
      <span className={`${compact ? 'text-lg' : 'text-xl'} font-extrabold text-white`}>Charla</span>
      <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-900">
        Admin
      </span>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:justify-between md:bg-slate-900 md:px-4 md:py-6">
        <div>
          <div className="mb-8 px-2">
            <Brand />
            <p className="mt-1 text-xs text-slate-400">Panel del dueño de la app</p>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Navegación del panel">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-800 pt-4">
          <p className="truncate px-3 text-xs text-slate-500" title={user?.email}>
            {user?.email}
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3 md:border-b md:border-slate-200 md:bg-white md:px-8">
          <div className="md:hidden">
            <Brand compact />
          </div>
          <p className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
            <Eye className="h-4 w-4" aria-hidden="true" />
            Modo administrador · sólo lectura. Con esta cuenta no se puede practicar.
          </p>
          <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Administrador
          </span>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8 md:pt-6">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around bg-slate-900 py-2 md:hidden"
        aria-label="Navegación del panel"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold ${
                isActive ? 'text-amber-400' : 'text-slate-400'
              }`
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold text-slate-400"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Salir
        </button>
      </nav>
    </div>
  );
}
