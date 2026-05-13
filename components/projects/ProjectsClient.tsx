'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';

type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived' | 'cancelled';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  industry: string | null;
  createdAt: string;
  _count: { tasks: number; members: number; deliverables: number };
  tasks: { id: string }[];
  members: Array<{
    user: { name: string | null; image: string | null };
  }>;
}

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

export default function ProjectsClient({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', industry: '', status: 'draft' as ProjectStatus });
  const [error, setError] = useState('');

  const filtered = projects.filter((p) => {
    const matchStatus = filter === 'all' || p.status === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  async function handleCreate() {
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create');
      const project = await res.json();
      setNewOpen(false);
      setForm({ name: '', description: '', industry: '', status: 'draft' });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25'
                  : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300 hover:border-[#3A3A3A]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40 w-48"
          />
          <Button variant="primary" size="sm" onClick={() => setNewOpen(true)}>
            + New Project
          </Button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="◈"
          title="No projects found"
          description={search ? 'Try a different search term' : 'Create your first project to get started'}
          action={{ label: '+ New Project', onClick: () => setNewOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={newOpen}
        onClose={() => { setNewOpen(false); setError(''); }}
        title="New Project"
        subtitle="Set up your project workspace"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={creating}>
              Create Project
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}
          <Input
            label="Project Name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Q1 Campaign for Acme Corp"
            autoFocus
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What are the goals for this project?"
            rows={3}
          />
          <Input
            label="Industry"
            value={form.industry}
            onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
            placeholder="e.g. E-commerce, SaaS, Healthcare"
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Initial Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
              className="w-full rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-2 text-sm text-zinc-300 outline-none focus:border-[#A3E635]/40"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const done = project.tasks.length;
  const total = project._count.tasks;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <div className="h-full rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-4 hover:border-[#3A3A3A] hover:bg-[#252525] transition-all flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white leading-snug">
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed flex-1">
            {project.description}
          </p>
        )}

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>{done} of {total} tasks done</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#A3E635] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-[#2A2A2A]">
          {/* Member avatars */}
          <div className="flex -space-x-1.5">
            {project.members.slice(0, 4).map((m, i) => (
              <div
                key={i}
                className="h-5 w-5 rounded-full border border-[#1E1E1E] bg-zinc-700 overflow-hidden text-[8px] flex items-center justify-center text-zinc-400"
                title={m.user.name ?? ''}
              >
                {m.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  m.user.name?.[0]?.toUpperCase() ?? 'U'
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-zinc-600">
            <span>{project._count.deliverables} deliverables</span>
            <span>{project._count.members} members</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
