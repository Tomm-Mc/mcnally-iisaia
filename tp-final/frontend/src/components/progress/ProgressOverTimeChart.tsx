import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimelineEntry } from '../../api/types';

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

export function ProgressOverTimeChart({ data }: { data: TimelineEntry[] }) {
  const chartData = data.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={{ stroke: '#E2E8F0' }}
          tickLine={false}
          interval={4}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13 }}
          labelFormatter={(label) => `Día ${label}`}
          formatter={(value: number) => [`${value} errores`, undefined]}
        />
        <Line type="monotone" dataKey="errorCount" stroke="#6D28D9" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
