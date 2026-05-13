'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAgentStream, StreamStatus } from '@/hooks/useAgentStream';

interface AgentOutputViewerProps {
  commandId: string;
  taskId: string;
  outputId?: string;
  existingOutput?: string;
  status?: string;
  version?: number;
  maxVersions?: number;
  onApprove: () => void;
  onRevise: (note: string) => void;
  onReject: () => void;
  isSubmitting?: boolean;
}

const STATUS_ICON: Record<StreamStatus, string> = {
  idle: '○',
  connecting: '◌',
  streaming: '●',
  complete: '✓',
  error: '✕',
};

const STATUS_COLOR: Record<StreamStatus, string> = {
  idle: 'text-zinc-500',
  connecting: 'text-yellow-400',
  streaming: 'text-[#A3E635]',
  complete: 'text-[#A3E635]',
  error: 'text-red-400',
};

export default function AgentOutputViewer({
  commandId,
  outputId,
  existingOutput,
  status: outputStatus,
  version = 1,
  maxVersions = 5,
  onApprove,
  onRevise,
  onReject,
  isSubmitting = false,
}: AgentOutputViewerProps) {
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');

  const isAlreadyReviewed = outputStatus && outputStatus !== 'pending_review';
  const shouldStream = !existingOutput && !isAlreadyReviewed;

  const { output, status: streamStatus, error } = useAgentStream({
    commandId: shouldStream ? commandId : null,
    autoStart: shouldStream,
  });

  const displayContent = existingOutput ?? output;
  const revisionsUsed = version - 1;
  const revisionsRemaining = maxVersions - version;

  function handleRevisionSubmit() {
    if (!revisionNote.trim()) return;
    onRevise(revisionNote);
    setRevisionNote('');
    setShowRevisionForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono ${STATUS_COLOR[streamStatus]}`}>
            {STATUS_ICON[streamStatus]}
          </span>
          <span className="text-sm text-zinc-400">
            {streamStatus === 'streaming' && 'Agent is writing...'}
            {streamStatus === 'complete' && 'Output ready for review'}
            {streamStatus === 'connecting' && 'Connecting to agent...'}
            {streamStatus === 'idle' && 'Waiting'}
            {streamStatus === 'error' && 'Stream error'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Version dots */}
          <div className="flex items-center gap-1" title={`Version ${version} of ${maxVersions}`}>
            {Array.from({ length: maxVersions }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < version ? 'bg-[#A3E635]' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-zinc-500">v{version}/{maxVersions}</span>

          {/* View toggle */}
          <div className="flex rounded border border-zinc-700 text-xs overflow-hidden">
            <button
              onClick={() => setViewMode('rendered')}
              className={`px-2 py-1 ${viewMode === 'rendered' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2 py-1 ${viewMode === 'raw' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Raw
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Output content */}
      <div className="min-h-[300px] rounded-lg border border-zinc-700/50 bg-[#0F0F0F] overflow-hidden">
        {!displayContent && streamStatus !== 'streaming' ? (
          <div className="flex h-48 items-center justify-center text-zinc-600 text-sm">
            {streamStatus === 'connecting' ? (
              <span className="animate-pulse">Initializing agent...</span>
            ) : (
              'No output yet'
            )}
          </div>
        ) : viewMode === 'raw' ? (
          <pre className="p-4 text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[600px]">
            {displayContent}
            {streamStatus === 'streaming' && (
              <span className="inline-block w-2 h-4 bg-[#A3E635] ml-0.5 animate-pulse" />
            )}
          </pre>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none p-6 overflow-auto max-h-[600px] [&_table]:text-xs [&_pre]:bg-zinc-800 [&_code]:text-[#A3E635]">
            <ReactMarkdown>{displayContent}</ReactMarkdown>
            {streamStatus === 'streaming' && (
              <span className="inline-block w-2 h-4 bg-[#A3E635] ml-0.5 animate-pulse" />
            )}
          </div>
        )}
      </div>

      {/* Copy button */}
      {displayContent && (
        <div className="flex justify-end">
          <button
            onClick={() => navigator.clipboard.writeText(displayContent)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Copy to clipboard
          </button>
        </div>
      )}

      {/* Approval actions — only when output is ready and not yet reviewed */}
      {(streamStatus === 'complete' || existingOutput) && !isAlreadyReviewed && outputId && (
        <div className="border-t border-zinc-800 pt-4 space-y-3">
          {/* Revision note form */}
          {showRevisionForm && (
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Revision instructions for the agent</label>
              <textarea
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Be specific: what should change, what tone to use, what to add or remove..."
                className="w-full rounded bg-[#1E1E1E] border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#A3E635]/50 focus:outline-none resize-none"
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowRevisionForm(false);
                    setRevisionNote('');
                  }}
                  className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevisionSubmit}
                  disabled={!revisionNote.trim() || isSubmitting || revisionsRemaining <= 0}
                  className="px-4 py-1.5 text-sm rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Revision
                  {revisionsRemaining > 0 && (
                    <span className="ml-1 text-xs opacity-70">({revisionsRemaining} left)</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {!showRevisionForm && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">
                {revisionsUsed > 0 ? `${revisionsUsed} revision${revisionsUsed > 1 ? 's' : ''} used` : 'First draft'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onReject}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-sm rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowRevisionForm(true)}
                  disabled={isSubmitting || revisionsRemaining <= 0}
                  title={revisionsRemaining <= 0 ? 'Maximum revisions reached' : undefined}
                  className="px-3 py-1.5 text-sm rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Request Revision
                </button>
                <button
                  onClick={onApprove}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-sm rounded bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/30 hover:bg-[#A3E635]/30 disabled:opacity-50 transition-colors font-medium"
                >
                  ✓ Approve
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Already reviewed state */}
      {isAlreadyReviewed && (
        <div className={`text-center text-sm py-2 rounded ${
          outputStatus === 'approved'
            ? 'text-[#A3E635] bg-[#A3E635]/5'
            : outputStatus === 'rejected'
            ? 'text-red-400 bg-red-500/5'
            : 'text-amber-400 bg-amber-500/5'
        }`}>
          {outputStatus === 'approved' && '✓ Output approved and saved as deliverable'}
          {outputStatus === 'rejected' && '✕ Output rejected'}
          {outputStatus === 'revision_requested' && '↺ Revision requested — new version in queue'}
        </div>
      )}
    </div>
  );
}
