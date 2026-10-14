import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyActivity } from '../../api/types';
import { AXIS_TICK, GRID_STROKE, SERIES_COLORS, TOOLTIP_STYLE } from './chartTheme';
import { formatDayLabel } from './format';

interface DailyLineChartProps {
  data: DailyActivity[];
  /** Métrica de la serie diaria a graficar (una sola: el título de la tarjeta la nombra). */
  metric: 'activeStudents' | 'sessionsStarted';
  unit: string;
  color?: string;
  height?: number;
}

export function DailyLineChart({ data, metric, unit, color = SERIES_COLORS.secondary, height = 220 }: DailyLineChartProps) {
  const chartData = data.map((d) => ({ label: formatDayLabel(d.date), value: d[metric] }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} interval={4} />
        <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ stroke: GRID_STROKE }}
          labelFormatter={(label) => `Día ${label}`}
          formatter={(value: number) => [`${value} ${unit}`, undefined]}
        />
        {/* Trazo recto: con conteos diarios, una curva suavizada inventa valores entre días. */}
        <Line type="linear" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
