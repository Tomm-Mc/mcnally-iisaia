import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Dumbbell, History, LayoutDashboard, LogOut, MessageCircleHeart, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/*
 * Layout del estudiante. Comparte el estilo visual del AdminLayout (barra
 * oscura, fondo slate-100, acentos ámbar) pero no su contenido: el admin se
 * distingue por la etiqueta "ADMIN", el aviso de sólo lectura y su navegación.
 */
const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/scenarios', label: 'Escenarios', icon: MessageCircleHeart },
  { to: '/exercises', label: 'Práctica', icon: Dumbbell },
  { to: '/progress', label: 'Progreso', icon: BarChart3 },
  { to: '/history', label: 'Historial', icon: History },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className={`${compact ? 'h-6 w-6' : 'h-7 w-7'} text-amber-400`} aria-hidden="true" />
      <span className={`${compact ? 'text-lg' : 'text-xl'} font-extrabold text-white`}>Charla</span>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-brand-bg md:flex">
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:justify-between md:bg-slate-900 md:px-4 md:py-6">
        <div>
          <div className="mb-8 px-2">
            <Brand />
            <p className="mt-1 text-xs text-slate-400">Practicá inglés charlando</p>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Navegación principal">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
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
          <div className="ml-auto flex items-center gap-2">
            <span
              className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800"
              title="Tu racha de días consecutivos"
            >
              🔥 {user?.streakDays ?? 0}
            </span>
            <span
              className="flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1.5 text-xs font-bold text-teal-800"
              title="Tu experiencia acumulada"
            >
              ⭐ {user?.xp ?? 0} XP
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8 md:pt-6">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around bg-slate-900 py-2 md:hidden"
        aria-label="Navegación principal"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
