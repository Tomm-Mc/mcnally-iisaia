/** Formatos compartidos por las pantallas del panel de administración. */

export function formatDayLabel(dateStr: string): string {
  // Las claves de día vienen en UTC (YYYY-MM-DD); se muestran tal cual, sin correr de zona.
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(value: number | null): string {
  return value === null ? '—' : `${value}%`;
}

/** Porcentaje entero (0-100), o null si no hay base. Igual que `percentage` del backend (lib/adminStats.ts). */
export function percentage(part: number, total: number): number | null {
  return total === 0 ? null : Math.round((part / total) * 100);
}

export function formatNumber(value: number | null): string {
  return value === null ? '—' : value.toLocaleString('es-AR');
}

/** Resume un user agent al navegador y sistema, para que la tabla de accesos sea legible. */
export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return '—';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : /curl\//.test(userAgent)
            ? 'curl'
            : 'Otro';
  const os = /Android/.test(userAgent)
    ? 'Android'
    : /iPhone|iPad/.test(userAgent)
      ? 'iOS'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS X/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : '';
  return os ? `${browser} · ${os}` : browser;
}
