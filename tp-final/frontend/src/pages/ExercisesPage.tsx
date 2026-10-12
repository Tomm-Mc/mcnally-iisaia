import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dumbbell } from 'lucide-react';
import { generateExercises } from '../api/exercises';
import type { Exercise } from '../api/types';
import { ExerciseCard } from '../components/exercises/ExerciseCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';

export function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const { refreshUser } = useAuth();

  const generate = useMutation({
    mutationFn: generateExercises,
    onSuccess: ({ exercises: created }) => {
      setExercises(created);
      setCurrentIndex(0);
      setTotalXp(0);
      setFinished(false);
    },
  });

  function handleAnswered(xpEarned: number) {
    setTotalXp((prev) => prev + xpEarned);
  }

  async function handleNext() {
    if (!exercises) return;
    if (currentIndex + 1 >= exercises.length) {
      setFinished(true);
      await refreshUser();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-text">Práctica personalizada</h1>
        <p className="text-sm text-slate-500">Ejercicios generados según tus categorías de error más frecuentes.</p>
      </div>

      {!exercises && (
        <EmptyState
          emoji="🏋️"
          title="Generá tu práctica de hoy"
          description="Creamos 5 ejercicios enfocados en lo que más te cuesta."
          action={
            <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
              <Dumbbell className="h-4 w-4" aria-hidden="true" />
              {generate.isPending ? 'Generando...' : 'Generar práctica'}
            </Button>
          }
        />
      )}

      {exercises && !finished && (
        <>
          <p className="text-center text-sm font-semibold text-slate-400">
            Ejercicio {currentIndex + 1} de {exercises.length}
          </p>
          <ExerciseCard
            key={exercises[currentIndex].id}
            exercise={exercises[currentIndex]}
            onAnswered={handleAnswered}
            onNext={handleNext}
            isLast={currentIndex + 1 === exercises.length}
          />
        </>
      )}

      {exercises && finished && (
        <Card className="flex flex-col items-center gap-3 text-center">
          <span className="text-4xl" aria-hidden="true">
            🎉
          </span>
          <h2 className="text-xl font-extrabold">¡Práctica terminada!</h2>
          <p className="text-sm text-slate-500">Ganaste {totalXp} XP en esta ronda.</p>
          <Button
            onClick={() => {
              setExercises(null);
              setFinished(false);
            }}
          >
            Generar otra práctica
          </Button>
        </Card>
      )}
    </div>
  );
}
