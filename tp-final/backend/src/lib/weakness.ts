import { prisma } from './prisma';
import type { ErrorCategory } from '../schemas/enums';

export interface CategoryCount {
  category: ErrorCategory;
  count: number;
}

/** Cuenta los errores del usuario agrupados por categoría, ordenados de mayor a menor. */
export async function getErrorCountsByCategory(userId: string): Promise<CategoryCount[]> {
  const corrections = await prisma.correction.findMany({
    where: { message: { session: { userId } } },
    select: { category: true },
  });

  const counts = new Map<string, number>();
  for (const c of corrections) {
    counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([category, count]) => ({ category: category as ErrorCategory, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getTopWeakCategories(userId: string, limit = 3): Promise<ErrorCategory[]> {
  const counts = await getErrorCountsByCategory(userId);
  return counts.slice(0, limit).map((c) => c.category);
}

export async function getExampleErrorsForCategories(userId: string, categories: ErrorCategory[], perCategory = 2) {
  const corrections = await prisma.correction.findMany({
    where: { message: { session: { userId } }, category: { in: categories } },
    orderBy: { createdAt: 'desc' },
    take: categories.length * perCategory * 3,
    select: { original: true, corrected: true, category: true },
  });

  const grouped = new Map<string, typeof corrections>();
  for (const c of corrections) {
    const list = grouped.get(c.category) ?? [];
    if (list.length < perCategory) {
      list.push(c);
      grouped.set(c.category, list);
    }
  }

  return [...grouped.values()].flat().map((c) => ({ ...c, category: c.category as ErrorCategory }));
}
