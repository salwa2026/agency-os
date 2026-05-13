'use client';

import { useEffect, useState } from 'react';
import { getAllAgents, AgentDefinition } from '@/lib/agents/systemPrompts';

interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

interface ActiveCommand {
  id: string;
  agentType: string;
  status: string;
  command: string;
  createdAt: string;
  task: { title: string; projectId: string };
  output: Array<{ id: string; status: string; version: number; createdAt: string }>;
}

export default function AgentsPage() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [commands, setCommands] = useState<ActiveCommand[]>([]);
  const agents = getAllAgents();

  useEffect(() => {
    async function load() {
      const [qRes, cRes] = await Promise.all([
        fetch('/api/agents/queue-status'),
        fetch('/api/agents/commands'),
      ]);
      if (qRes.ok) setQueueStatus(await qRes.json());
      if (cRes.ok) setCommands(await cRes.json());
    }
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const statusColor: Record<string, string> = {
    queued: 'text-yellow-400 bg-yellow-400/10',
    processing: 'text-[#A3E635] bg-[#A3E635]/10',
    completed: 'text-zinc-400 bg-zinc-700/30',
    failed: 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">AI Agent Engine</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Deploy specialized AI agents to handle marketing tasks autonomously
        </p>
      </div>

      {/* Queue status */}
      {queueStatus && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Queued', value: queueStatus.waiting, color: 'text-yellow-400' },
            { label: 'Active', value: queueStatus.active, color: 'text-[#A3E635]' },
            { label: 'Completed', value: queueStatus.completed, color: 'text-zinc-400' },
            { label: 'Failed', value: queueStatus.failed, color: 'text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-800 bg-[#1E1E1E] p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Agent grid */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4">
          Available Agents
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {agents.map((agent) => (
            <AgentCard key={agent.type} agent={agent} />
          ))}
        </div>
      </div>

      {/* Recent commands */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4">
          Recent Commands
        </h2>
        {commands.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-[#1E1E1E] p-8 text-center">
            <p className="text-zinc-600 text-sm">No agent commands yet</p>
            <p className="text-zinc-700 text-xs mt-1">
              Deploy an agent from any task to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {commands.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-[#1E1E1E] px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{cmd.task.title}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{cmd.command.slice(0, 80)}...</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-zinc-500 capitalize">
                    {cmd.agentType.replace('_', ' ')}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded capitalize ${
                      statusColor[cmd.status] ?? 'text-zinc-400 bg-zinc-700/30'
                    }`}
                  >
                    {cmd.status}
                  </span>
                  {cmd.output?.[0]?.status === 'pending_review' && (
                    <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded animate-pulse">
                      Needs Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentDefinition }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#1E1E1E] p-4 space-y-2 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{agent.emoji}</span>
        <span className="text-xs font-medium text-zinc-300 leading-tight">
          {agent.name.replace(' Agent', '')}
        </span>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">{agent.description.split(',')[0]}</p>
      <div className="flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 2).map((cap) => (
          <span
            key={cap}
            className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded"
          >
            {cap.split('(')[0].trim()}
          </span>
        ))}
      </div>
    </div>
  );
}
