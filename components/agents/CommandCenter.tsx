'use client';

import { useState, useCallback } from 'react';
import AgentSelector from './AgentSelector';
import AgentOutputViewer from './AgentOutputViewer';
import { AgentType } from '@/lib/agents/systemPrompts';

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
}

interface CommandCenterProps {
  task: Task;
  onClose?: () => void;
  onTaskUpdated?: () => void;
}

type PanelState = 'select_agent' | 'write_command' | 'streaming' | 'review';

interface ActiveSession {
  commandId: string;
  outputId?: string;
  agentType: AgentType;
  status?: string;
  version?: number;
  existingContent?: string;
}

export default function CommandCenter({ task, onClose, onTaskUpdated }: CommandCenterProps) {
  const [panel, setPanel] = useState<PanelState>('select_agent');
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [command, setCommand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);

  function buildDefaultCommand(agentType: AgentType): string {
    const base = task.description ? `\n\nTask context: ${task.description}` : '';
    return `Task: ${task.title}${base}`;
  }

  function handleAgentSelect(agentType: AgentType) {
    setSelectedAgent(agentType);
    setCommand(buildDefaultCommand(agentType));
    setPanel('write_command');
  }

  async function handleCommandSubmit() {
    if (!selectedAgent || !command.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/agents/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          agentType: selectedAgent,
          command: command.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to submit command');
      }

      const data = await res.json() as { commandId: string };

      setSession({
        commandId: data.commandId,
        agentType: selectedAgent,
        status: 'pending_review',
        version: 1,
      });
      setPanel('streaming');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleApprove = useCallback(async () => {
    if (!session?.outputId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agents/output/${session.outputId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      setSession((prev) => prev ? { ...prev, status: 'approved' } : null);
      onTaskUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setIsSubmitting(false);
    }
  }, [session, onTaskUpdated]);

  const handleRevise = useCallback(async (note: string) => {
    if (!session?.outputId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agents/output/${session.outputId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revise', revisionNote: note }),
      });
      if (!res.ok) throw new Error('Failed to request revision');
      const data = await res.json() as { newCommandId: string; version: number };
      setSession((prev) =>
        prev
          ? {
              commandId: data.newCommandId,
              agentType: prev.agentType,
              version: data.version,
              status: 'pending_review',
              outputId: undefined,
            }
          : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request revision');
    } finally {
      setIsSubmitting(false);
    }
  }, [session]);

  const handleReject = useCallback(async () => {
    if (!session?.outputId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agents/output/${session.outputId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      setSession((prev) => prev ? { ...prev, status: 'rejected' } : null);
      onTaskUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setIsSubmitting(false);
    }
  }, [session, onTaskUpdated]);

  return (
    <div className="flex h-full flex-col bg-[#141414] rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#A3E635] text-sm font-mono">⚡</span>
            <h2 className="text-sm font-semibold text-zinc-200">Command Center</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-sm">{task.title}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Step indicator */}
          <div className="flex items-center gap-1 mr-3">
            {(['select_agent', 'write_command', 'streaming'] as const).map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                <div
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    panel === step
                      ? 'bg-[#A3E635]'
                      : ['write_command', 'streaming', 'review'].indexOf(panel) > i
                      ? 'bg-[#A3E635]/40'
                      : 'bg-zinc-700'
                  }`}
                />
              </div>
            ))}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-2 opacity-60 hover:opacity-100">×</button>
          </div>
        )}

        {/* Step 1: Select Agent */}
        {panel === 'select_agent' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-200 mb-1">Select an AI Agent</h3>
              <p className="text-xs text-zinc-500">Choose the specialist that fits this task best</p>
            </div>
            <AgentSelector selectedAgent={selectedAgent} onSelect={handleAgentSelect} />
          </div>
        )}

        {/* Step 2: Write Command */}
        {panel === 'write_command' && selectedAgent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPanel('select_agent')}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                ← Change agent
              </button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-200 mb-1">Write your command</h3>
              <p className="text-xs text-zinc-500">
                Be specific about what you need. Include context, tone, format requirements, and any constraints.
              </p>
            </div>
            <div className="space-y-2">
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Describe exactly what you need the agent to produce..."
                className="w-full rounded-lg bg-[#1E1E1E] border border-zinc-700 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#A3E635]/50 focus:outline-none resize-none"
                rows={10}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">{command.length} characters</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPanel('select_agent')}
                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCommandSubmit}
                    disabled={!command.trim() || isSubmitting}
                    className="px-5 py-1.5 text-sm rounded-lg bg-[#A3E635] text-black font-semibold hover:bg-[#b5f03d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Sending...' : 'Deploy Agent ⚡'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Streaming + Review */}
        {(panel === 'streaming' || panel === 'review') && session && (
          <AgentOutputViewer
            commandId={session.commandId}
            taskId={task.id}
            outputId={session.outputId}
            existingOutput={session.existingContent}
            status={session.status}
            version={session.version}
            maxVersions={5}
            onApprove={handleApprove}
            onRevise={handleRevise}
            onReject={handleReject}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
