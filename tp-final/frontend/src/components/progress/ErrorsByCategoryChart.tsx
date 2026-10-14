import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ProgressSummary } from '../../api/types';

export function ErrorsByCategoryChart({ data }: { data: ProgressSummary['errorsByCategory'] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay errores registrados.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      {/* left amplio: las etiquetas inclinadas del eje X se salen por la izquierda en la primera barra. */}
      <BarChart data={data} margin={{ top: 8, right: 8, left: 24, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#64748B' }}
          axisLine={{ stroke: '#E2E8F0' }}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: '#F1F5F9' }}
          contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13 }}
          formatter={(value: number) => [`${value} errores`, undefined]}
        />
        <Bar dataKey="count" fill="#6D28D9" radius={[8, 8, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
