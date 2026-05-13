'use client';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  description?: string;
  xKey?: string;
  yKey?: string;
  dataKey?: string;
  data: Record<string, unknown>[];
}

const COLORS = [
  '#A3E635', '#34D399', '#60A5FA', '#F59E0B',
  '#F87171', '#A78BFA', '#FB923C', '#38BDF8',
];

const AXIS_STYLE = { fill: '#71717A', fontSize: 11 };
const TOOLTIP_STYLE = {
  backgroundColor: '#1E1E1E',
  border: '1px solid #3A3A3A',
  borderRadius: 8,
  color: '#E4E4E7',
  fontSize: 12,
};

interface Props {
  chart: ChartConfig;
}

export default function ChartRenderer({ chart }: Props) {
  const { type, data, xKey, yKey, dataKey } = chart;
  if (!data?.length) return null;

  const effectiveXKey = xKey ?? Object.keys(data[0])[0];
  const effectiveYKey = yKey ?? dataKey ?? Object.keys(data[0])[1];

  return (
    <div className="rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] p-4">
      <p className="text-sm font-semibold text-zinc-200 mb-0.5">{chart.title}</p>
      {chart.description && (
        <p className="text-xs text-zinc-500 mb-4">{chart.description}</p>
      )}

      <ResponsiveContainer width="100%" height={220}>
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey={effectiveXKey} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#2A2A2A' }} />
            <Bar dataKey={effectiveYKey} fill="#A3E635" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey={effectiveXKey} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey={effectiveYKey}
              stroke="#A3E635"
              strokeWidth={2}
              dot={{ fill: '#A3E635', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        ) : type === 'area' ? (
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey={effectiveXKey} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area
              type="monotone"
              dataKey={effectiveYKey}
              stroke="#A3E635"
              fill="#A3E635"
              fillOpacity={0.12}
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              dataKey={effectiveYKey}
              nameKey={effectiveXKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              paddingAngle={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend
              formatter={(v) => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
