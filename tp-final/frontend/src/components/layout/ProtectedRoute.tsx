import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../api/types';
import { Spinner } from '../ui/Spinner';

/** Pantalla de inicio de cada rol: a dónde se redirige si entra a una ruta que no le corresponde. */
export const HOME_BY_ROLE: Record<Role, string> = {
  student: '/',
  admin: '/admin',
};

interface ProtectedRouteProps {
  children: ReactNode;
  /** Rol requerido. El admin no puede practicar y el estudiante no ve el panel. */
  role: Role;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  }

  return <>{children}</>;
}
