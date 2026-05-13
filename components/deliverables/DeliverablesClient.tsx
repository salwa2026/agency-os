'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';

const AGENT_LABELS: Record<string, string> = {
  social_media: '📱 Social Media',
  paid_ads: '📊 Paid Ads',
  copywriter: '✍️ Copywriter',
  seo: '🔍 SEO',
  data_analyst: '📈 Data Analyst',
  branding: '🎨 Branding',
  strategist: '🧭 Strategist',
  presentation: '🖥️ Presentation',
  designer: '🎭 Designer',
  developer: '💻 Developer',
  excel: '📋 Excel',
};

interface Deliverable {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  project: { id: string; name: string };
  task: { id: string; title: string } | null;
  approvedBy: { name: string | null; image: string | null } | null;
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DeliverablesClient({ deliverables }: { deliverables: Deliverable[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<Deliverable | null>(null);

  const types = Array.from(new Set(deliverables.map((d) => d.type)));

  const filtered = deliverables.filter((d) => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search deliverables..."
          className="rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40 sm:w-64"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25' : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300'}`}
          >
            All Types
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${typeFilter === t ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25' : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300'}`}
            >
              {AGENT_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="◇"
          title="No deliverables yet"
          description="Approved agent outputs will appear here"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <DeliverableCard key={d.id} deliverable={d} onClick={() => setSelected(d)} />
          ))}
        </div>
      )}

      {/* Deliverable detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        subtitle={selected ? `${AGENT_LABELS[selected.type] ?? selected.type} · ${selected.project.name}` : ''}
        size="xl"
      >
        {selected && (
          <div className="prose prose-invert prose-sm max-w-none [&_pre]:bg-zinc-800 [&_code]:text-[#A3E635] [&_table]:text-xs">
            <ReactMarkdown>{selected.content}</ReactMarkdown>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DeliverableCard({
  deliverable,
  onClick,
}: {
  deliverable: Deliverable;
  onClick: () => void;
}) {
  const preview = deliverable.content.slice(0, 200).replace(/#+\s/g, '').replace(/\*\*/g, '');

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-4 hover:border-[#3A3A3A] hover:bg-[#252525] transition-all flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{AGENT_LABELS[deliverable.type]?.split(' ')[0] ?? '◇'}</span>
          <div>
            <p className="text-xs text-zinc-500">{AGENT_LABELS[deliverable.type]?.slice(3) ?? deliverable.type}</p>
            <p className="text-xs text-zinc-600">{deliverable.project.name}</p>
          </div>
        </div>
        <span className="text-[10px] text-[#A3E635] bg-[#A3E635]/10 border border-[#A3E635]/20 px-1.5 py-0.5 rounded shrink-0">
          ✓ Approved
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white leading-snug">
        {deliverable.title}
      </h3>

      {/* Preview */}
      <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed flex-1">{preview}</p>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-zinc-600 border-t border-[#2A2A2A] pt-2">
        <span>{formatDate(deliverable.createdAt)}</span>
        {deliverable.approvedBy && (
          <span>by {deliverable.approvedBy.name}</span>
        )}
      </div>
    </button>
  );
}
