'use client';

import { useState, useRef, useEffect } from 'react';
import type { KanbanTask } from './KanbanBoard';

interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

interface Props {
  task: KanbanTask;
  projectId: string;
  onClose: () => void;
  onUpdated: (updated: KanbanTask) => void;
}

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;
const STATUS_OPTIONS = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const;
const TAG_OPTIONS = ['SEO', 'Branding', 'Content', 'Ads', 'Design', 'Dev', 'Research'];

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-zinc-500',
  medium: 'bg-yellow-400',
  high: 'bg-red-500',
  urgent: 'bg-red-600',
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TaskDetailPanel({ task, projectId, onClose, onUpdated }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [tags, setTags] = useState<string[]>(task.tags ?? []);
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => {
    if (!Array.isArray(task.subtasks)) return [];
    return (task.subtasks as Subtask[]).map((s) => ({
      id: s.id ?? uid(),
      title: s.title ?? '',
      done: !!s.done,
    }));
  });
  const [newSubtask, setNewSubtask] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (overlayRef.current === e.target) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function patch(fields: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${projectId}/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdated({ ...task, ...fields, ...updated });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleTitleBlur() {
    if (title.trim() && title !== task.title) patch({ title: title.trim() });
  }

  function handleDescriptionBlur() {
    if (description !== (task.description ?? '')) patch({ description });
  }

  async function handleStatusChange(val: string) {
    setStatus(val);
    await patch({ status: val });
  }

  async function handlePriorityChange(val: string) {
    setPriority(val);
    await patch({ priority: val });
  }

  async function toggleTag(tag: string) {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    setTags(next);
    await patch({ tags: next });
  }

  async function toggleSubtask(id: string) {
    const next = subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s);
    setSubtasks(next);
    await patch({ subtasks: next });
  }

  async function addSubtask(title: string) {
    if (!title.trim()) return;
    const next = [...subtasks, { id: uid(), title: title.trim(), done: false }];
    setSubtasks(next);
    setNewSubtask('');
    await patch({ subtasks: next });
  }

  async function removeSubtask(id: string) {
    const next = subtasks.filter((s) => s.id !== id);
    setSubtasks(next);
    await patch({ subtasks: next });
  }

  async function suggestSubtasks() {
    setSuggesting(true);
    try {
      const res = await fetch('/api/tasks/suggest-subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        const { suggestions } = await res.json() as { suggestions: string[] };
        const newOnes = suggestions
          .filter((s) => !subtasks.some((x) => x.title.toLowerCase() === s.toLowerCase()))
          .map((s) => ({ id: uid(), title: s, done: false }));
        if (newOnes.length > 0) {
          const next = [...subtasks, ...newOnes];
          setSubtasks(next);
          await patch({ subtasks: next });
        }
      }
    } finally {
      setSuggesting(false);
    }
  }

  const doneCount = subtasks.filter((s) => s.done).length;
  const progress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/50 flex justify-end"
    >
      <div className="animate-slide-in-right w-full max-w-md h-full bg-[#141414] border-l border-[#2E2E2E] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E2E2E] shrink-0">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${PRIORITY_DOT[priority]}`} />
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Task Detail</span>
          </div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-[10px] text-zinc-600 animate-pulse">saving…</span>}
            <button
              onClick={onClose}
              className="text-zinc-600 hover:text-zinc-300 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Title */}
          <div>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              rows={2}
              className="w-full bg-transparent text-zinc-100 font-medium text-base resize-none outline-none placeholder:text-zinc-700 leading-snug"
              placeholder="Task title…"
            />
          </div>

          {/* Status + Priority row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={3}
              className="w-full bg-[#1E1E1E] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-zinc-300 resize-none outline-none focus:border-[#A3E635]/40 placeholder:text-zinc-700"
              placeholder="Add a description…"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-2">Labels</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
                      active
                        ? 'bg-[#A3E635]/15 border-[#A3E635]/40 text-[#A3E635]'
                        : 'bg-transparent border-[#2E2E2E] text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-zinc-600 uppercase tracking-wider">
                Subtasks {subtasks.length > 0 && <span className="text-zinc-700">({doneCount}/{subtasks.length})</span>}
              </label>
              <button
                onClick={suggestSubtasks}
                disabled={suggesting}
                className="text-[10px] text-[#A3E635]/70 hover:text-[#A3E635] disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                {suggesting ? '⏳ thinking…' : '✦ AI suggest'}
              </button>
            </div>

            {/* Progress bar */}
            {subtasks.length > 0 && (
              <div className="mb-3 h-1 bg-[#2E2E2E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#A3E635] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              {subtasks.map((s) => (
                <div key={s.id} className="flex items-start gap-2 group/sub">
                  <button
                    onClick={() => toggleSubtask(s.id)}
                    className={`mt-0.5 h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                      s.done
                        ? 'bg-[#A3E635] border-[#A3E635]'
                        : 'bg-transparent border-[#3A3A3A] hover:border-[#A3E635]/50'
                    }`}
                  >
                    {s.done && <span className="text-black text-[9px] font-bold leading-none">✓</span>}
                  </button>
                  <span className={`text-xs flex-1 leading-snug ${s.done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                    {s.title}
                  </span>
                  <button
                    onClick={() => removeSubtask(s.id)}
                    className="opacity-0 group-hover/sub:opacity-100 text-zinc-700 hover:text-zinc-400 text-xs transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask input */}
            <div className="flex gap-2 mt-2">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addSubtask(newSubtask); }
                }}
                placeholder="Add a subtask…"
                className="flex-1 bg-[#1E1E1E] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40 placeholder:text-zinc-700"
              />
              <button
                onClick={() => addSubtask(newSubtask)}
                disabled={!newSubtask.trim()}
                className="px-2.5 py-1.5 bg-[#A3E635]/10 border border-[#A3E635]/20 text-[#A3E635] text-xs rounded-lg hover:bg-[#A3E635]/20 disabled:opacity-30 transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {/* Assignee */}
          {(task.assignedUser || task.assignedAgent) && (
            <div>
              <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-2">Assigned to</label>
              {task.assignedAgent && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">{task.assignedAgent.emoji}</span>
                  <div>
                    <p className="text-xs text-zinc-300">{task.assignedAgent.name}</p>
                    <p className="text-[10px] text-zinc-600">{task.assignedAgent.type}</p>
                  </div>
                </div>
              )}
              {task.assignedUser && !task.assignedAgent && (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-zinc-700 overflow-hidden flex items-center justify-center text-[10px] text-zinc-400">
                    {task.assignedUser.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={task.assignedUser.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      task.assignedUser.name?.[0]?.toUpperCase() ?? 'U'
                    )}
                  </div>
                  <p className="text-xs text-zinc-300">{task.assignedUser.name ?? task.assignedUser.id}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2E2E2E] shrink-0">
          <div className="flex items-center gap-3 text-[10px] text-zinc-600">
            {task._count.comments > 0 && <span>💬 {task._count.comments} comment{task._count.comments !== 1 ? 's' : ''}</span>}
            {task._count.attachments > 0 && <span>📎 {task._count.attachments} attachment{task._count.attachments !== 1 ? 's' : ''}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
