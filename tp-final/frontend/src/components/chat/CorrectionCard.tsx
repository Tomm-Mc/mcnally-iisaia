import type { CorrectionError } from '../../api/types';
import { CATEGORY_LABELS_ES } from '../../api/types';
import { Badge } from '../ui/Badge';

export function CorrectionCard({ correction }: { correction: CorrectionError }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-brand-errorBg p-3 text-sm">
      <div className="mb-1 flex items-center justify-between gap-2">
        <Badge tone="error">{CATEGORY_LABELS_ES[correction.category]}</Badge>
      </div>
      <p className="text-slate-600">
        <span className="text-brand-error line-through">{correction.original}</span>{' '}
        <span aria-hidden="true">→</span> <span className="font-semibold text-brand-text">{correction.corrected}</span>
      </p>
      <p className="mt-1 text-slate-500">{correction.explanation}</p>
    </div>
  );
}
