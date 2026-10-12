import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { answerExercise } from '../../api/exercises';
import type { Exercise } from '../../api/types';
import { CATEGORY_LABELS_ES } from '../../api/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const TYPE_LABELS: Record<Exercise['type'], string> = {
  fill_blank: 'Completá el espacio',
  fix_sentence: 'Corregí la oración',
  translate: 'Traducí al inglés',
};

interface ExerciseCardProps {
  exercise: Exercise;
  onAnswered: (xpEarned: number) => void;
  onNext: () => void;
  isLast: boolean;
}

export function ExerciseCard({ exercise, onAnswered, onNext, isLast }: ExerciseCardProps) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);

  const submit = useMutation({
    mutationFn: () => answerExercise(exercise.id, answer),
    onSuccess: ({ exercise: updated, xpEarned }) => {
      setResult({ isCorrect: !!updated.isCorrect, feedback: updated.feedback ?? '' });
      onAnswered(xpEarned);
    },
  });

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Badge tone="primary">{TYPE_LABELS[exercise.type]}</Badge>
        <Badge tone="neutral">{CATEGORY_LABELS_ES[exercise.category]}</Badge>
      </div>

      <p className="text-sm font-semibold text-slate-500">{exercise.prompt}</p>
      <p className="rounded-2xl bg-brand-bg px-4 py-3 text-base font-semibold text-brand-text">{exercise.sentence}</p>

      {!result ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (answer.trim()) submit.mutate();
          }}
          className="flex gap-2"
        >
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Escribí tu respuesta..."
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-100"
            disabled={submit.isPending}
          />
          <Button type="submit" disabled={submit.isPending || !answer.trim()}>
            {submit.isPending ? 'Revisando...' : 'Responder'}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <div
            className={`flex items-start gap-2 rounded-2xl p-3 text-sm ${
              result.isCorrect ? 'bg-teal-50 text-teal-700' : 'bg-brand-errorBg text-brand-error'
            }`}
          >
            {result.isCorrect ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{result.feedback}</span>
          </div>
          <Button onClick={onNext} variant={isLast ? 'primary' : 'secondary'}>
            {isLast ? 'Ver resultados' : 'Siguiente ejercicio'}
          </Button>
        </div>
      )}
    </Card>
  );
}
