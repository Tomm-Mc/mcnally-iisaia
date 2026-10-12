import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Dumbbell, History, LayoutDashboard, LogOut, MessageCircleHeart, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/scenarios', label: 'Escenarios', icon: MessageCircleHeart },
  { to: '/exercises', label: 'Práctica', icon: Dumbbell },
  { to: '/progress', label: 'Progreso', icon: BarChart3 },
  { to: '/history', label: 'Historial', icon: History },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-brand-bg md:flex">
      <aside className="hidden md:flex md:w-64 md:flex-col md:justify-between md:border-r md:border-slate-200 md:bg-white md:px-4 md:py-6">
        <div>
          <div className="mb-8 flex items-center gap-2 px-2">
            <Sparkles className="h-7 w-7 text-brand-primary" aria-hidden="true" />
            <span className="text-xl font-extrabold text-brand-primary">Charla</span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-violet-100 text-brand-primary' : 'text-slate-500 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Cerrar sesión
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <Sparkles className="h-6 w-6 text-brand-primary" aria-hidden="true" />
            <span className="text-lg font-extrabold text-brand-primary">Charla</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-700"
              title="Tu racha de días consecutivos"
            >
              🔥 {user?.streakDays ?? 0}
            </span>
            <span
              className="flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1.5 text-sm font-bold text-teal-700"
              title="Tu experiencia acumulada"
            >
              ⭐ {user?.xp ?? 0} XP
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8 md:pt-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-slate-200 bg-white py-2 md:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold ${
                isActive ? 'text-brand-primary' : 'text-slate-400'
              }`
            }
            aria-label={label}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        <button onClick={handleLogout} aria-label="Cerrar sesión" className="flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold text-slate-400">
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Salir
        </button>
      </nav>
    </div>
  );
}
