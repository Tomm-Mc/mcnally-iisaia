import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { ChatPage } from './pages/ChatPage';
import { SessionSummaryPage } from './pages/SessionSummaryPage';
import { ProgressPage } from './pages/ProgressPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { HistoryPage } from './pages/HistoryPage';
import { NotFoundPage } from './pages/NotFoundPage';

function Protected({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
