'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import KanbanBoard, { KanbanTask } from '@/components/kanban/KanbanBoard';

type TabId = 'kanban' | 'activity' | 'deliverables' | 'kpis';

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number | null;
  unit: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  industry: string | null;
  _count: { tasks: number; deliverables: number };
  kpis: KPI[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignedType: string;
  orderIndex: number;
  description?: string | null;
  tags?: string[];
  subtasks?: unknown[];
  assignedUser: { id: string; name: string | null; image: string | null } | null;
  assignedAgent: { id: string; name: string; emoji: string; type: string } | null;
  _count: { comments: number; attachments: number };
}

interface ProjectDetailClientProps {
  project: Project;
  initialTasks: Task[];
  currentUserId: string;
}

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'kanban', label: 'Kanban Board', icon: '☰' },
  { id: 'activity', label: 'Activity', icon: '◎' },
  { id: 'deliverables', label: 'Deliverables', icon: '◇' },
  { id: 'kpis', label: 'KPIs', icon: '▲' },
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const;

export default function ProjectDetailClient({
  project,
  initialTasks,
  currentUserId,
}: ProjectDetailClientProps) {
  const [tab, setTab] = useState<TabId>('kanban');
  const [tasks, setTasks] = useState(initialTasks);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', status: 'backlog' });
  const [saving, setSaving] = useState(false);

  const tasksByStatus = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    if (!acc[t.status]) acc[t.status] = [];
    acc[t.status].push(t);
    return acc;
  }, {});

  const done = tasks.filter((t) => t.status === 'done').length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  async function changeStatus(newStatus: string) {
    setStatusMenuOpen(false);
    const res = await fetch(`/api/projects/${project.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) window.location.reload();
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${project.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [
          ...prev,
          { ...created, _count: { comments: 0, attachments: 0 } },
        ]);
        setNewTask({ title: '', priority: 'medium', status: 'backlog' });
        setAddTaskOpen(false);
        setTab('kanban');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project sub-header */}
      <div className="border-b border-[#2E2E2E] bg-[#141414] px-6 py-3 space-y-3">
        {/* Meta row */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen((v) => !v)}
              className="flex items-center gap-1"
            >
              <StatusBadge status={project.status} />
              <span className="text-zinc-600 text-xs">▾</span>
            </button>
            {statusMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setStatusMenuOpen(false)} />
                <div className="absolute left-0 top-7 z-40 w-40 rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] shadow-xl py-1">
                  {['draft', 'active', 'paused', 'completed', 'cancelled'].map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(s)}
                      className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-[#2A2A2A] hover:text-zinc-200 capitalize"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {project.industry && (
            <span className="text-xs text-zinc-500">{project.industry}</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddTaskOpen(true)}>+ Add Task</Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Progress" value={`${pct}%`} accent />
          <StatCard label="Total Tasks" value={tasks.length} />
          <StatCard label="In Review" value={tasksByStatus['review']?.length ?? 0} />
          <StatCard label="Deliverables" value={project._count.deliverables} />
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#A3E635] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#2E2E2E] px-6 bg-[#141414]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[#A3E635] text-[#A3E635]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'kanban' && (
          <KanbanBoard
            tasks={tasks as KanbanTask[]}
            projectId={project.id}
            onTasksChange={(updated) => setTasks(updated as typeof tasks)}
          />
        )}
        {tab === 'activity' && <ActivityView projectId={project.id} />}
        {tab === 'deliverables' && <DeliverablesView projectId={project.id} />}
        {tab === 'kpis' && <KpisView kpis={project.kpis} projectId={project.id} />}
      </div>

      {/* Add Task Modal */}
      <Modal
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        title="New Task"
        subtitle={`Adding to ${project.name}`}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAddTaskOpen(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-task-form"
              disabled={saving || !newTask.title.trim()}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </>
        }
      >
        <form id="new-task-form" onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Task Title *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
                className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-zinc-300 outline-none focus:border-[#A3E635]/40"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Column</label>
              <select
                value={newTask.status}
                onChange={(e) => setNewTask((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-zinc-300 outline-none focus:border-[#A3E635]/40"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─── Activity View ───────────────────────────────────────────────────────── */

function ActivityView({ projectId }: { projectId: string }) {
  return (
    <div className="p-6 text-sm text-zinc-500">
      Activity feed for project {projectId} — loads dynamically
    </div>
  );
}

/* ─── Deliverables View ───────────────────────────────────────────────────── */

function DeliverablesView({ projectId }: { projectId: string }) {
  return (
    <div className="p-6 text-sm text-zinc-500">
      Deliverables for project {projectId} — loads dynamically
    </div>
  );
}

/* ─── KPIs View ───────────────────────────────────────────────────────────── */

function KpisView({ kpis, projectId }: { kpis: KPI[]; projectId: string }) {
  if (kpis.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-dashed border-[#2E2E2E] py-12 text-center text-sm text-zinc-600">
          No KPIs configured for this project
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const pct = kpi.target ? Math.round((kpi.value / kpi.target) * 100) : null;
        return (
          <div key={kpi.id} className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-4 space-y-2">
            <p className="text-xs text-zinc-500 font-medium">{kpi.name}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-white">{kpi.value.toLocaleString()}</p>
              {kpi.unit && <span className="text-xs text-zinc-500">{kpi.unit}</span>}
            </div>
            {kpi.target && (
              <>
                <div className="h-1 w-full rounded-full bg-[#2A2A2A]">
                  <div
                    className="h-full rounded-full bg-[#A3E635]"
                    style={{ width: `${Math.min(pct ?? 0, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-600">
                  {pct}% of {kpi.target.toLocaleString()} {kpi.unit} target
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
