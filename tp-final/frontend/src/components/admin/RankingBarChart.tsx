import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, GRID_STROKE, SERIES_COLORS, TOOLTIP_STYLE } from './chartTheme';

export interface RankingItem {
  label: string;
  value: number;
  /** Texto extra para el tooltip (ej. "3 terminadas · puntaje 80"). */
  detail?: string;
}

interface RankingBarChartProps {
  data: RankingItem[];
  unit: string;
  color?: string;
}

/** Barras horizontales ordenadas de mayor a menor, con el valor escrito al final de cada barra. */
export function RankingBarChart({ data, unit, color = SERIES_COLORS.primary }: RankingBarChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  // Alto proporcional a la cantidad de barras, para que las etiquetas no se pisen.
  const height = Math.max(120, sorted.length * 36 + 24);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap={8}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tick={{ ...AXIS_TICK, fill: '#334155' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value: number, _name, item) => {
            const detail = (item.payload as RankingItem).detail;
            return [`${value} ${unit}${detail ? ` · ${detail}` : ''}`, undefined];
          }}
        />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={24}>
          <LabelList dataKey="value" position="right" style={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
