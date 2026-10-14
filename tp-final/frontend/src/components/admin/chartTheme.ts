/*
 * Paleta y estilos de los gráficos del panel. Los tres colores de serie son los
 * tonos -600 de la marca (violeta, teal, ámbar): validados juntos para
 * daltonismo (ΔE ≥ 12 entre pares) y contraste ≥ 3:1 sobre blanco. Se asignan
 * siempre en este orden; no agregues un cuarto color sin volver a validar.
 */
export const SERIES_COLORS = {
  primary: '#6D28D9', // violet-700 (brand-primary)
  secondary: '#0D9488', // teal-600
  tertiary: '#D97706', // amber-600
} as const;

export const GRID_STROKE = '#E2E8F0';
export const AXIS_TICK = { fontSize: 11, fill: '#64748B' };

export const TOOLTIP_STYLE = {
  contentStyle: { borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13, color: '#0F172A' },
  cursor: { fill: '#F1F5F9' },
} as const;

export const LEGEND_STYLE = { fontSize: 12, color: '#475569' };
