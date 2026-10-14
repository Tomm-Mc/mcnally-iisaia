import type { ReactNode } from 'react';
import type { Role } from './api/types';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { ChatPage } from './pages/ChatPage';
import { SessionSummaryPage } from './pages/SessionSummaryPage';
import { ProgressPage } from './pages/ProgressPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { HistoryPage } from './pages/HistoryPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminLoginsPage } from './pages/admin/AdminLoginsPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';

function Protected({ children, role = 'student' }: { children: ReactNode; role?: Role }) {
  return (
    <ProtectedRoute role={role}>
      {role === 'admin' ? <AdminLayout>{children}</AdminLayout> : <AppLayout>{children}</AppLayout>}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/scenarios"
        element={
          <Protected>
            <ScenariosPage />
          </Protected>
        }
      />
      <Route
        path="/chat/:sessionId"
        element={
          <Protected>
            <ChatPage />
          </Protected>
        }
      />
      <Route
        path="/sessions/:sessionId/summary"
        element={
          <Protected>
            <SessionSummaryPage />
          </Protected>
        }
      />
      <Route
        path="/progress"
        element={
          <Protected>
            <ProgressPage />
          </Protected>
        }
      />
      <Route
        path="/exercises"
        element={
          <Protected>
            <ExercisesPage />
          </Protected>
        }
      />
      <Route
        path="/history"
        element={
          <Protected>
            <HistoryPage />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminDashboardPage />
          </Protected>
        }
      />
      <Route
        path="/admin/users"
        element={
          <Protected role="admin">
            <AdminUsersPage />
          </Protected>
        }
      />
      <Route
        path="/admin/users/:userId"
        element={
          <Protected role="admin">
            <AdminUserDetailPage />
          </Protected>
        }
      />
      <Route
        path="/admin/logins"
        element={
          <Protected role="admin">
            <AdminLoginsPage />
          </Protected>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
