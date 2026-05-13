'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface AgentTask {
  id: string;
  agentType: string;
  phase: number;
  phaseName: string | null;
  orderIndex: number;
  task: {
    id: string;
    title: string;
    status: string;
    assignedAgent: { emoji: string; name: string } | null;
    agentOutputs: Array<{ id: string; status: string; version: number; createdAt: string }>;
    _count: { comments: number };
  };
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  brief: Record<string, unknown>;
  totalTasks: number;
  doneTasks: number;
  launchedAt: string | null;
  project: { id: string; name: string };
  agentTasks: AgentTask[];
}

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

const TASK_STATUS_COLOR: Record<string, string> = {
  backlog: 'text-zinc-500',
  todo: 'text-blue-400',
  in_progress: 'text-[#A3E635] animate-pulse-dot',
  review: 'text-amber-400',
  done: 'text-emerald-400',
};

export default function AgentOrchestrator({ campaign }: { campaign: Campaign }) {
  const [launchingPhase, setLaunchingPhase] = useState<number | null>(null);

  const phases = Array.from(
    campaign.agentTasks.reduce((acc, t) => {
      if (!acc.has(t.phase)) acc.set(t.phase, { phase: t.phase, name: t.phaseName ?? `Phase ${t.phase}`, tasks: [] });
      acc.get(t.phase)!.tasks.push(t);
      return acc;
    }, new Map<number, { phase: number; name: string; tasks: AgentTask[] }>()),
    ([, v]) => v,
  ).sort((a, b) => a.phase - b.phase);

  const pct = campaign.totalTasks > 0
    ? Math.round((campaign.doneTasks / campaign.totalTasks) * 100)
    : 0;

  async function launchPhase(phase: number) {
    setLaunchingPhase(phase);
    try {
      await fetch(`/api/campaigns/${campaign.id}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase }),
      });
      window.location.reload();
    } finally {
      setLaunchingPhase(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Campaign progress */}
      <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-zinc-200">{campaign.name}</p>
            <p className="text-xs text-zinc-500">{campaign.project.name}</p>
          </div>
          <StatusBadge status={campaign.status} />
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 rounded-full bg-[#2A2A2A] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#A3E635] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm font-bold text-[#A3E635] shrink-0">{pct}%</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>{campaign.doneTasks}/{campaign.totalTasks} tasks complete</span>
          {campaign.launchedAt && (
            <span>Launched {new Date(campaign.launchedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Phase boards */}
      {phases.map((phase) => {
        const phaseDone = phase.tasks.filter((t) => t.task.status === 'done').length;
        const phaseActive = phase.tasks.some((t) =>
          ['in_progress', 'review'].includes(t.task.status),
        );
        const phaseWaiting = phase.tasks.every((t) => t.task.status === 'backlog');
        const phaseComplete = phase.tasks.every((t) => t.task.status === 'done');
        const pendingReview = phase.tasks.filter(
          (t) => t.task.agentOutputs.some((o) => o.status === 'pending_review'),
        );

        return (
          <div key={phase.phase} className="space-y-2">
            {/* Phase header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    phaseComplete
                      ? 'text-emerald-400 bg-emerald-400/10'
                      : phaseActive
                      ? 'text-[#A3E635] bg-[#A3E635]/10'
                      : 'text-zinc-500 bg-zinc-800'
                  }`}
                >
                  Phase {phase.phase}
                </span>
                <span className="text-sm font-medium text-zinc-300">{phase.name}</span>
                <span className="text-xs text-zinc-600">
                  {phaseDone}/{phase.tasks.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {pendingReview.length > 0 && (
                  <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded animate-pulse">
                    {pendingReview.length} need review
                  </span>
                )}
                {phaseWaiting && campaign.status !== 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={launchingPhase === phase.phase}
                    onClick={() => launchPhase(phase.phase)}
                  >
                    Launch Phase {phase.phase}
                  </Button>
                )}
                {phaseComplete && (
                  <span className="text-xs text-emerald-400">✓ Complete</span>
                )}
              </div>
            </div>

            {/* Agent task cards */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {phase.tasks.map((agentTask) => (
                <AgentTaskCard
                  key={agentTask.id}
                  agentTask={agentTask}
                  projectId={campaign.project.id}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgentTaskCard({
  agentTask,
  projectId,
}: {
  agentTask: AgentTask;
  projectId: string;
}) {
  const { task } = agentTask;
  const emoji = AGENT_EMOJIS[agentTask.agentType] ?? '⚡';
  const latestOutput = task.agentOutputs[0];
  const pendingReview = latestOutput?.status === 'pending_review';
  const isRunning = task.status === 'in_progress';

  return (
    <Link href={`/projects/${projectId}`}>
      <div
        className={`rounded-xl border p-3 transition-all hover:bg-[#252525] ${
          pendingReview
            ? 'border-amber-500/30 bg-amber-500/5'
            : isRunning
            ? 'border-[#A3E635]/25 bg-[#A3E635]/5'
            : 'border-[#2E2E2E] bg-[#1E1E1E]'
        }`}
      >
        {/* Header */}
        <div className="flex items-start gap-2">
          <span className="text-lg shrink-0 mt-0.5">{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-200 leading-snug">{task.title}</p>
            <p className="text-[10px] text-zinc-600 capitalize mt-0.5">
              {agentTask.agentType.replace('_', ' ')} agent
            </p>
          </div>
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#2A2A2A]">
          <span
            className={`text-[10px] font-medium capitalize ${TASK_STATUS_COLOR[task.status] ?? 'text-zinc-500'}`}
          >
            {isRunning && '● '}
            {task.status.replace('_', ' ')}
          </span>

          {pendingReview && (
            <span className="text-[10px] text-amber-400 animate-pulse">Review →</span>
          )}
          {latestOutput && !pendingReview && (
            <span className="text-[10px] text-zinc-600">
              v{latestOutput.version} · {latestOutput.status.replace('_', ' ')}
            </span>
          )}
          {!latestOutput && task.status === 'backlog' && (
            <span className="text-[10px] text-zinc-700">Waiting</span>
          )}
        </div>
      </div>
    </Link>
  );
}
