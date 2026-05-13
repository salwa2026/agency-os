'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignedType: string;
  dueDate: string | null;
  project: { id: string; name: string };
  assignedUser: { id: string; name: string | null; image: string | null } | null;
  assignedAgent: { id: string; name: string; emoji: string } | null;
  agentOutputs: { id: string }[];
}

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'project', label: 'Project' },
];

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<string, number> = { in_progress: 0, review: 1, todo: 2, backlog: 3, done: 4 };

export default function TasksClient({ tasks }: { tasks: Task[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');

  const filtered = tasks
    .filter((t) => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      if (sortBy === 'status') return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      if (sortBy === 'project') return a.project.name.localeCompare(b.project.name);
      return 0;
    });

  const pendingReview = filtered.filter((t) => t.agentOutputs.length > 0);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Pending review banner */}
      {pendingReview.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
          <span className="text-amber-400 text-sm">⚡</span>
          <p className="text-sm text-amber-300 font-medium">
            {pendingReview.length} agent output{pendingReview.length > 1 ? 's' : ''} pending your review
          </p>
          <div className="ml-auto flex gap-2">
            {pendingReview.slice(0, 3).map((t) => (
              <Link
                key={t.id}
                href={`/projects/${t.project.id}`}
                className="text-xs text-amber-400 hover:text-amber-300 underline"
              >
                {t.title.slice(0, 30)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40 sm:w-64"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'backlog', 'todo', 'in_progress', 'review', 'done'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25'
                  : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-zinc-600">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-2 py-1 text-xs text-zinc-400 outline-none"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState icon="☰" title="No tasks found" description="Create tasks within a project" />
      ) : (
        <div className="space-y-1.5">
          {filtered.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const hasOutput = task.agentOutputs.length > 0;

  return (
    <Link href={`/projects/${task.project.id}`}>
      <div className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-all hover:bg-[#252525] ${
        hasOutput
          ? 'border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40'
          : 'border-[#2E2E2E] bg-[#1E1E1E]'
      }`}>
        {/* Priority dot */}
        <span className={`h-2 w-2 rounded-full shrink-0 ${
          task.priority === 'urgent' ? 'bg-red-500' :
          task.priority === 'high' ? 'bg-amber-500' :
          task.priority === 'medium' ? 'bg-blue-500' :
          'bg-zinc-600'
        }`} />

        {/* Title */}
        <p className="flex-1 min-w-0 text-sm text-zinc-300 truncate">{task.title}</p>

        {/* Agent output indicator */}
        {hasOutput && (
          <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded shrink-0 animate-pulse">
            ⚡ Review
          </span>
        )}

        {/* Status */}
        <StatusBadge status={task.status} />

        {/* Project link */}
        <span className="text-xs text-zinc-600 hidden md:block truncate max-w-[140px]">
          {task.project.name}
        </span>

        {/* Assignee */}
        <div className="shrink-0">
          {task.assignedAgent ? (
            <span className="text-sm" title={task.assignedAgent.name}>{task.assignedAgent.emoji}</span>
          ) : task.assignedUser ? (
            <div
              className="h-5 w-5 rounded-full bg-zinc-700 text-[9px] flex items-center justify-center text-zinc-400 overflow-hidden"
              title={task.assignedUser.name ?? ''}
            >
              {task.assignedUser.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={task.assignedUser.image} alt="" className="h-full w-full object-cover" />
              ) : (
                task.assignedUser.name?.[0] ?? 'U'
              )}
            </div>
          ) : (
            <div className="h-5 w-5 rounded-full border border-dashed border-zinc-700" />
          )}
        </div>
      </div>
    </Link>
  );
}
