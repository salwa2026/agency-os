'use client';

import { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StatusBadge } from '@/components/ui/Badge';
import TaskDetailPanel from './TaskDetailPanel';

export interface KanbanTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  orderIndex: number;
  assignedType: string;
  description?: string | null;
  tags?: string[];
  subtasks?: unknown[];
  assignedUser: { id: string; name: string | null; image: string | null } | null;
  assignedAgent: { id: string; name: string; emoji: string; type: string } | null;
  _count: { comments: number; attachments: number };
  agentOutputs?: { id: string; version: number }[];
}

const STATUS_ORDER = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const;
type Status = (typeof STATUS_ORDER)[number];

const COLUMN_META: Record<Status, { label: string; color: string; accentLine: string }> = {
  backlog:     { label: 'Backlog',      color: 'text-zinc-500',    accentLine: 'bg-zinc-700' },
  todo:        { label: 'To Do',        color: 'text-blue-400',    accentLine: 'bg-blue-500' },
  in_progress: { label: 'In Progress',  color: 'text-[#A3E635]',   accentLine: 'bg-[#A3E635]' },
  review:      { label: 'Review',       color: 'text-amber-400',   accentLine: 'bg-amber-500' },
  done:        { label: 'Done',         color: 'text-emerald-400', accentLine: 'bg-emerald-500' },
};

const PRIORITY_BORDER: Record<string, string> = {
  low:    'border-l-zinc-700',
  medium: 'border-l-blue-500/60',
  high:   'border-l-amber-500/70',
  urgent: 'border-l-red-500/70',
};

const PRIORITY_DOT: Record<string, string> = {
  low:    'bg-zinc-600',
  medium: 'bg-yellow-400',
  high:   'bg-red-500',
  urgent: 'bg-red-600',
};

const TAG_COLORS: Record<string, string> = {
  SEO:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Branding: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Content:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Ads:      'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Design:   'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Dev:      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Research: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

interface KanbanBoardProps {
  tasks: KanbanTask[];
  projectId: string;
  onTasksChange?: (tasks: KanbanTask[]) => void;
}

export default function KanbanBoard({ tasks: initialTasks, projectId, onTasksChange }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const tasksByStatus = STATUS_ORDER.reduce<Record<string, KanbanTask[]>>((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).sort((a, b) => a.orderIndex - b.orderIndex);
    return acc;
  }, {});

  function handleTaskClick(task: KanbanTask) {
    setSelectedTask(task);
  }

  function handlePanelClose() {
    setSelectedTask(null);
  }

  function handlePanelUpdated(updated: KanbanTask) {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  }

  function handleTaskAdded(task: KanbanTask) {
    setTasks((prev) => [...prev, task]);
    onTasksChange?.([...tasks, task]);
  }

  function handleDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task ?? null);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const dragged = tasks.find((t) => t.id === activeId);
    if (!dragged) return;

    if (STATUS_ORDER.includes(overId as Status)) {
      if (dragged.status !== overId) {
        setTasks((prev) => prev.map((t) => t.id === activeId ? { ...t, status: overId } : t));
      }
      return;
    }

    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return;

    if (dragged.status !== overTask.status) {
      setTasks((prev) => prev.map((t) => t.id === activeId ? { ...t, status: overTask.status } : t));
    }
  }

  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      setActiveTask(null);
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;
      const dragged = tasks.find((t) => t.id === activeId);
      if (!dragged) return;

      let toStatus = dragged.status;
      let toIndex = 0;

      if (STATUS_ORDER.includes(overId as Status)) {
        toStatus = overId;
        toIndex = tasksByStatus[toStatus]?.length ?? 0;
      } else {
        const overTask = tasks.find((t) => t.id === overId);
        if (overTask) {
          toStatus = overTask.status;
          const colTasks = tasksByStatus[toStatus];
          toIndex = colTasks.findIndex((t) => t.id === overId);
        }
      }

      setTasks((prev) =>
        prev.map((t) => t.id === activeId ? { ...t, status: toStatus, orderIndex: toIndex } : t),
      );

      onTasksChange?.(tasks);

      try {
        await fetch(`/api/tasks/${projectId}/${activeId}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toStatus, toIndex }),
        });
      } catch {
        setTasks(initialTasks);
      }
    },
    [tasks, tasksByStatus, projectId, initialTasks, onTasksChange],
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 h-full overflow-x-auto px-4 py-4 pb-6">
          {STATUS_ORDER.map((status) => (
            <Column
              key={status}
              id={status}
              meta={COLUMN_META[status]}
              tasks={tasksByStatus[status] ?? []}
              projectId={projectId}
              onTaskClick={handleTaskClick}
              onTaskAdded={handleTaskAdded}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          projectId={projectId}
          onClose={handlePanelClose}
          onUpdated={handlePanelUpdated}
        />
      )}
    </>
  );
}

/* ─── Column ──────────────────────────────────────────────────────────────── */

interface ColumnMeta { label: string; color: string; accentLine: string; }

function Column({
  id,
  meta,
  tasks,
  projectId,
  onTaskClick,
  onTaskAdded,
}: {
  id: string;
  meta: ColumnMeta;
  tasks: KanbanTask[];
  projectId: string;
  onTaskClick: (task: KanbanTask) => void;
  onTaskAdded: (task: KanbanTask) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function openAdd() {
    setAdding(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function cancelAdd() {
    setAdding(false);
    setInputVal('');
  }

  async function submitAdd() {
    const title = inputVal.trim();
    if (!title) { cancelAdd(); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status: id, priority: 'medium' }),
      });
      if (res.ok) {
        const created = await res.json();
        onTaskAdded({ ...created, _count: { comments: 0, attachments: 0 }, agentOutputs: [] });
      }
    } finally {
      setLoading(false);
      cancelAdd();
    }
  }

  return (
    <div id={id} data-droppable className="flex flex-col w-[272px] shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className={`h-2 w-2 rounded-full ${meta.accentLine}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
        <span className="ml-auto text-[10px] text-zinc-600 bg-[#252525] rounded-full px-1.5 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto min-h-[60px] rounded-xl">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
          {tasks.length === 0 && !adding && (
            <div className="rounded-xl border border-dashed border-[#252525] py-6 text-center text-xs text-zinc-700">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>

      {/* Quick add */}
      {adding ? (
        <div className="mt-2 space-y-1.5">
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitAdd();
              if (e.key === 'Escape') cancelAdd();
            }}
            placeholder="Task title…"
            className="w-full rounded-xl border border-[#A3E635]/30 bg-[#1E1E1E] px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-700"
          />
          <div className="flex gap-1.5">
            <button
              onClick={submitAdd}
              disabled={loading || !inputVal.trim()}
              className="flex-1 rounded-lg bg-[#A3E635]/10 border border-[#A3E635]/20 text-[#A3E635] text-xs py-1 hover:bg-[#A3E635]/20 disabled:opacity-40 transition-all"
            >
              {loading ? '…' : 'Add'}
            </button>
            <button
              onClick={cancelAdd}
              className="px-2 rounded-lg border border-[#2E2E2E] text-zinc-500 text-xs hover:text-zinc-300 hover:border-zinc-500 transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={openAdd}
          className="mt-2 w-full flex items-center gap-1 px-2 py-1.5 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-[#1E1E1E] text-xs transition-all"
        >
          <span className="text-base leading-none">+</span>
          <span>Add task</span>
        </button>
      )}
    </div>
  );
}

/* ─── Sortable Card wrapper ───────────────────────────────────────────────── */

function SortableTaskCard({ task, onClick }: { task: KanbanTask; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
}

/* ─── Task Card ───────────────────────────────────────────────────────────── */

function TaskCard({ task, onClick, isDragging = false }: { task: KanbanTask; onClick?: () => void; isDragging?: boolean }) {
  const hasPendingOutput = task.agentOutputs && task.agentOutputs.length > 0;
  const subtasks = Array.isArray(task.subtasks) ? (task.subtasks as { id: string; title: string; done: boolean }[]) : [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : -1;
  const tags = task.tags ?? [];

  return (
    <div
      onClick={onClick}
      className={`group rounded-xl border bg-[#1E1E1E] p-3 border-l-2 cursor-pointer select-none transition-all ${
        PRIORITY_BORDER[task.priority]
      } ${
        isDragging
          ? 'border-[#A3E635]/50 shadow-xl shadow-black/40'
          : hasPendingOutput
          ? 'border-amber-500/30 hover:border-amber-500/50'
          : 'border-[#2E2E2E] hover:border-[#3A3A3A] hover:bg-[#252525]'
      }`}
    >
      {/* Pending review badge */}
      {hasPendingOutput && (
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded animate-pulse">
            ⚡ Review needed
          </span>
        </div>
      )}

      {/* Priority dot + title row */}
      <div className="flex items-start gap-1.5">
        <div className={`h-1.5 w-1.5 rounded-full shrink-0 mt-1 ${PRIORITY_DOT[task.priority] ?? 'bg-zinc-600'}`} />
        <p className="text-xs text-zinc-300 leading-snug group-hover:text-white flex-1">{task.title}</p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${TAG_COLORS[tag] ?? 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtask progress bar */}
      {subtaskProgress >= 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-zinc-600">{doneCount}/{subtasks.length}</span>
            <span className="text-[10px] text-zinc-600">{subtaskProgress}%</span>
          </div>
          <div className="h-1 bg-[#2E2E2E] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#A3E635] rounded-full transition-all duration-300"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5">
          {task.assignedAgent && (
            <span title={task.assignedAgent.name} className="text-[11px] text-[#A3E635] bg-[#A3E635]/10 border border-[#A3E635]/20 px-1.5 py-0.5 rounded">
              {task.assignedAgent.emoji} ⚡
            </span>
          )}
          {task.assignedUser && !task.assignedAgent && (
            <div
              className="h-5 w-5 rounded-full bg-zinc-700 overflow-hidden flex items-center justify-center text-[9px] text-zinc-400"
              title={task.assignedUser.name ?? ''}
            >
              {task.assignedUser.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={task.assignedUser.image} alt="" className="h-full w-full object-cover" />
              ) : (
                task.assignedUser.name?.[0]?.toUpperCase() ?? 'U'
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
          {task._count.comments > 0 && <span>💬 {task._count.comments}</span>}
          {task._count.attachments > 0 && <span>📎 {task._count.attachments}</span>}
        </div>
      </div>
    </div>
  );
}
