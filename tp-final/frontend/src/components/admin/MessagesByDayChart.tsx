import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyActivity } from '../../api/types';
import { AXIS_TICK, GRID_STROKE, LEGEND_STYLE, SERIES_COLORS, TOOLTIP_STYLE } from './chartTheme';
import { formatDayLabel } from './format';

/** Mensajes de estudiantes por día, apilados por modo (escritos / por voz). */
export function MessagesByDayChart({ data, height = 260 }: { data: DailyActivity[]; height?: number }) {
  const chartData = data.map((d) => ({
    label: formatDayLabel(d.date),
    text: d.messages - d.voiceMessages,
    voice: d.voiceMessages,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} interval={4} />
        <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} labelFormatter={(label) => `Día ${label}`} />
        <Legend wrapperStyle={LEGEND_STYLE} />
        <Bar dataKey="text" name="Escritos" stackId="messages" fill={SERIES_COLORS.primary} stroke="#fff" strokeWidth={1} maxBarSize={22} />
        <Bar
          dataKey="voice"
          name="Por voz"
          stackId="messages"
          fill={SERIES_COLORS.secondary}
          stroke="#fff"
          strokeWidth={1}
          radius={[4, 4, 0, 0]}
          maxBarSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
