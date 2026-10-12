import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { fetchSession, finishSession } from '../api/sessions';
import { ChatWindow } from '../components/chat/ChatWindow';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';

export function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [finishError, setFinishError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSession(sessionId!),
    enabled: !!sessionId,
  });

  const finish = useMutation({
    mutationFn: () => finishSession(sessionId!),
    onSuccess: async () => {
      await refreshUser();
      navigate(`/sessions/${sessionId}/summary`);
    },
    onError: () => setFinishError('No se pudo terminar la sesión. Intentá de nuevo.'),
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const { session } = data;
  const scenario = session.scenario!;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden="true">
            {scenario.emoji}
          </span>
          <div>
            <h1 className="text-lg font-bold text-brand-text">{scenario.title}</h1>
            <p className="text-xs text-slate-400">Charlando con {scenario.characterName}</p>
          </div>
        </div>
        {session.status === 'active' && (
          <Button variant="danger" size="sm" onClick={() => finish.mutate()} disabled={finish.isPending}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {finish.isPending ? 'Terminando...' : 'Terminar sesión'}
          </Button>
        )}
      </div>

      {finishError && <p className="text-sm font-semibold text-brand-error">{finishError}</p>}

      <ChatWindow
        sessionId={session.id}
        scenario={scenario}
        initialMessages={session.messages ?? []}
        disabled={session.status !== 'active'}
      />
    </div>
  );
}
