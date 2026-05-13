'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatCard from '@/components/ui/StatCard';
import Card, { CardHeader } from '@/components/ui/Card';

interface TaskStat {
  status: string;
  _count: { id: number };
}

interface AgentStat {
  agentType: string;
  _count: { id: number };
}

interface AnalyticsData {
  taskStats: TaskStat[];
  agentStats: AgentStat[];
  deliverableCount: number;
  projectCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: '#3f3f46',
  todo: '#3b82f6',
  in_progress: '#A3E635',
  review: '#f59e0b',
  done: '#10b981',
};

const AGENT_EMOJIS: Record<string, string> = {
  social_media: '📱',
  paid_ads: '📊',
  copywriter: '✍️',
  seo: '🔍',
  data_analyst: '📈',
  branding: '🎨',
  strategist: '🧭',
  presentation: '🖥️',
  designer: '🎭',
  developer: '💻',
  excel: '📋',
};

const CustomTooltipStyle = {
  contentStyle: {
    background: '#1E1E1E',
    border: '1px solid #2E2E2E',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#d4d4d8',
  },
  cursor: { fill: 'rgba(163,230,53,0.05)' },
};

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const { taskStats, agentStats, deliverableCount, projectCount } = data;

  const totalTasks = taskStats.reduce((s, t) => s + t._count.id, 0);
  const doneTasks = taskStats.find((t) => t.status === 'done')?._count.id ?? 0;
  const totalAgentJobs = agentStats.reduce((s, a) => s + a._count.id, 0);

  const taskChartData = taskStats.map((t) => ({
    name: t.status.replace('_', ' '),
    count: t._count.id,
    fill: STATUS_COLORS[t.status] ?? '#52525b',
  }));

  const agentChartData = agentStats.map((a) => ({
    name: `${AGENT_EMOJIS[a.agentType] ?? ''} ${a.agentType.replace('_', ' ')}`,
    count: a._count.id,
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Projects" value={projectCount} icon="◈" />
        <StatCard label="Total Tasks" value={totalTasks} icon="☰" />
        <StatCard label="Tasks Completed" value={doneTasks} icon="✓" accent />
        <StatCard label="Deliverables" value={deliverableCount} icon="◇" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Task status distribution */}
        <Card>
          <CardHeader title="Tasks by Status" icon="☰" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {taskChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CustomTooltipStyle.contentStyle}
                  formatter={(value: number) => [value, 'tasks']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-2">
            {taskChartData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: d.fill }}
                />
                <span className="text-[10px] text-zinc-500 capitalize">{d.name}</span>
                <span className="text-[10px] text-zinc-400 font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Agent usage */}
        <Card>
          <CardHeader title="Agent Deployments" icon="⚡" subtitle={`${totalAgentJobs} total jobs`} />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentChartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={CustomTooltipStyle.contentStyle}
                  cursor={CustomTooltipStyle.cursor}
                  formatter={(value: number) => [value, 'jobs']}
                />
                <Bar dataKey="count" fill="#A3E635" radius={[0, 4, 4, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Completion rate */}
      <Card>
        <CardHeader title="Overall Completion Rate" subtitle="Tasks completed across all projects" />
        <div className="flex items-center gap-6">
          <div className="text-4xl font-bold text-white">
            {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}
            <span className="text-xl text-zinc-500">%</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#A3E635] transition-all duration-700"
                style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">
              {doneTasks} of {totalTasks} tasks completed
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
