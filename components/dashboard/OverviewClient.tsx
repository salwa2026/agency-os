'use client';

import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';
import Card, { CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  _count: { tasks: number };
  tasks: { id: string }[];
}

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  user: { name: string | null; image: string | null } | null;
  project: { name: string };
  metadata: Record<string, unknown>;
}

interface DashboardData {
  projects: Project[];
  recentActivity: ActivityEntry[];
  stats: {
    totalTasks: number;
    doneTasks: number;
    pendingReviews: number;
    deliverables: number;
    activeProjects: number;
  };
}

const ACTION_LABELS: Record<string, string> = {
  project_created: 'created project',
  project_status_changed: 'changed project status',
  task_created: 'created task',
  task_moved: 'moved task',
  task_completed: 'completed task',
  agent_assigned: 'deployed agent to task',
  agent_output_ready: 'agent output ready for review',
  output_approved: 'approved agent output',
  output_revision_requested: 'requested revision',
  output_rejected: 'rejected agent output',
  deliverable_created: 'created deliverable',
};

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function OverviewClient({ data }: { data: DashboardData }) {
  const { stats, projects, recentActivity } = data;
  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.doneTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Active Projects" value={stats.activeProjects} icon="◈" accent />
        <StatCard label="Tasks Done" value={`${completionRate}%`} change={5} icon="✓" />
        <StatCard label="Pending Reviews" value={stats.pendingReviews} icon="⚡" />
        <StatCard label="Deliverables" value={stats.deliverables} icon="◇" />
        <StatCard label="Total Tasks" value={stats.totalTasks} icon="☰" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Projects column */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Active Projects</h2>
            <Link href="/projects" className="text-xs text-[#A3E635] hover:opacity-80">
              View all →
            </Link>
          </div>

          {projects.length === 0 ? (
            <Card>
              <div className="py-8 text-center text-sm text-zinc-600">
                No active projects.{' '}
                <Link href="/projects" className="text-[#A3E635] hover:opacity-80">Create one →</Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Activity feed column */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Recent Activity</h2>
          <Card padding="none">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-600">No activity yet</div>
            ) : (
              <ul className="divide-y divide-[#2E2E2E]">
                {recentActivity.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: '/projects?new=1', icon: '◈', label: 'New Project', sub: 'Start from scratch' },
            { href: '/agents', icon: '⚡', label: 'Deploy Agent', sub: 'Assign AI to task' },
            { href: '/deliverables', icon: '◇', label: 'View Deliverables', sub: 'Approved outputs' },
            { href: '/analytics', icon: '▲', label: 'Analytics', sub: 'KPIs & performance' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] px-4 py-3 hover:border-[#3A3A3A] hover:bg-[#252525] transition-all group"
            >
              <span className="text-xl text-zinc-500 group-hover:text-[#A3E635] transition-colors">{action.icon}</span>
              <div>
                <p className="text-sm font-medium text-zinc-300">{action.label}</p>
                <p className="text-xs text-zinc-600">{action.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const done = project.tasks.length;
  const total = project._count.tasks;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="flex items-center gap-4 rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] px-4 py-3 hover:border-[#3A3A3A] hover:bg-[#252525] transition-all group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white">{project.name}</p>
            <StatusBadge status={project.status} />
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-[#2A2A2A] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#A3E635] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 shrink-0">{pct}%</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-500">{done}/{total} tasks</p>
        </div>
      </div>
    </Link>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const isAgent = !entry.user;
  const label = ACTION_LABELS[entry.action] ?? entry.action.replace(/_/g, ' ');

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      {/* Avatar */}
      <div className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 text-xs overflow-hidden">
        {isAgent ? (
          <div className="h-full w-full flex items-center justify-center bg-[#A3E635]/15 text-[#A3E635]">⚡</div>
        ) : entry.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.user.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-700 text-zinc-400">
            {entry.user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-400 leading-relaxed">
          <span className="text-zinc-300 font-medium">
            {isAgent ? 'AI Agent' : entry.user?.name ?? 'User'}
          </span>{' '}
          {label} in{' '}
          <span className="text-zinc-300">{entry.project.name}</span>
        </p>
        <p className="text-[10px] text-zinc-600 mt-0.5">{formatRelativeTime(entry.createdAt)}</p>
      </div>
    </li>
  );
}
