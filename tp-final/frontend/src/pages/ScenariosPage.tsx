import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchScenarios } from '../api/scenarios';
import { createSession } from '../api/sessions';
import type { Level } from '../api/types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

const LEVELS: Level[] = ['A2', 'B1', 'B2'];

export function ScenariosPage() {
  const [levelFilter, setLevelFilter] = useState<Level | null>(null);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['scenarios', levelFilter],
    queryFn: () => fetchScenarios(levelFilter ?? undefined),
  });

  const startSession = useMutation({
    mutationFn: (scenarioId: string) => createSession(scenarioId),
    onSuccess: ({ session }) => navigate(`/chat/${session.id}`),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-text">Elegí un escenario</h1>
        <p className="text-sm text-slate-500">Cada escenario es una conversación distinta con un personaje de IA.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip label="Todos" active={levelFilter === null} onClick={() => setLevelFilter(null)} />
        {LEVELS.map((level) => (
          <FilterChip key={level} label={level} active={levelFilter === level} onClick={() => setLevelFilter(level)} />
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data || data.scenarios.length === 0 ? (
        <EmptyState emoji="🔍" title="No hay escenarios para este nivel" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.scenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className="flex cursor-pointer flex-col gap-2 transition-colors hover:border-slate-300 hover:bg-slate-50"
              onClick={() => !startSession.isPending && startSession.mutate(scenario.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl" aria-hidden="true">
                  {scenario.emoji}
                </span>
                <Badge tone="primary">{scenario.level}</Badge>
              </div>
              <h2 className="text-lg font-bold text-brand-text">{scenario.title}</h2>
              <p className="text-sm text-slate-500">{scenario.description}</p>
            </Card>
          ))}
        </div>
      )}

      {startSession.isPending && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/20">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-lg">
            <Spinner />
            <span className="font-semibold">Empezando la conversación...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        active ? 'bg-brand-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}
