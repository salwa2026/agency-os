'use client';

import { useState } from 'react';
import type { ContentBrief, Keyword, ContentBriefStatus, ContentType } from '@/types/seo';
import { BRIEF_STATUS_LABELS, BRIEF_STATUS_COLORS, CONTENT_TYPE_LABELS } from '@/types/seo';
import BriefDetailPanel from './BriefDetailPanel';

interface Props {
  briefs: ContentBrief[];
  projects: { id: string; name: string }[];
  keywords: Keyword[];
  onBriefsChange: (briefs: ContentBrief[]) => void;
}

const CONTENT_TYPES: ContentType[] = [
  'blog_post', 'landing_page', 'product_page', 'pillar_page', 'case_study', 'comparison', 'guide',
];

const PRIORITIES = ['low', 'medium', 'high'] as const;

const STATUSES: ContentBriefStatus[] = [
  'draft', 'ready', 'in_progress', 'in_review', 'published', 'archived',
];

const EMPTY_FORM = {
  projectId: '',
  keywordId: '',
  targetKeyword: '',
  secondaryKeywords: '',
  title: '',
  contentType: 'blog_post' as ContentType,
  wordCountTarget: '1500',
  priority: 'medium' as const,
  dueDate: '',
  notes: '',
};

export default function ContentBriefList({ briefs, projects, keywords, onBriefsChange }: Props) {
  const [statusFilter, setStatusFilter] = useState<ContentBriefStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, projectId: projects[0]?.id ?? '' });
  const [saving, setSaving] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<ContentBrief | null>(null);

  const projectKeywords = keywords.filter((k) => k.projectId === form.projectId);

  const filtered = briefs.filter((b) => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchSearch = !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.targetKeyword.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.targetKeyword.trim() || !form.title.trim() || !form.projectId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/seo/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          secondaryKeywords: form.secondaryKeywords
            ? form.secondaryKeywords.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          keywordId: form.keywordId || null,
        }),
      });
      if (res.ok) {
        const created: ContentBrief = await res.json();
        onBriefsChange([created, ...briefs]);
        setForm({ ...EMPTY_FORM, projectId: form.projectId });
        setCreating(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: ContentBriefStatus) {
    const res = await fetch(`/api/seo/briefs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated: ContentBrief = await res.json();
      onBriefsChange(briefs.map((b) => (b.id === id ? updated : b)));
      if (selectedBrief?.id === id) setSelectedBrief(updated);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/seo/briefs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      onBriefsChange(briefs.filter((b) => b.id !== id));
      if (selectedBrief?.id === id) setSelectedBrief(null);
    }
  }

  function handleBriefUpdate(updated: ContentBrief) {
    onBriefsChange(briefs.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedBrief(updated);
  }

  return (
    <div className="flex gap-5">
      {/* Main list */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            {(['all', ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25'
                    : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s === 'all' ? 'All' : BRIEF_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search briefs..."
              className="rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40 w-44"
            />
            <button
              onClick={() => setCreating((v) => !v)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25 hover:bg-[#A3E635]/20 transition-colors whitespace-nowrap"
            >
              {creating ? '✕ Cancel' : '+ New Brief'}
            </button>
          </div>
        </div>

        {/* Create form */}
        {creating && (
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-[#A3E635]/20 bg-[#1E1E1E] p-4 space-y-3 animate-fade-in"
          >
            <p className="text-xs font-semibold text-[#A3E635]">New Content Brief</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Project</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value, keywordId: '' })}
                  required
                  className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40"
                >
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Link Keyword (optional)</label>
                <select
                  value={form.keywordId}
                  onChange={(e) => {
                    const kw = projectKeywords.find((k) => k.id === e.target.value);
                    setForm({
                      ...form,
                      keywordId: e.target.value,
                      targetKeyword: kw ? kw.keyword : form.targetKeyword,
                    });
                  }}
                  className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40"
                >
                  <option value="">— None —</option>
                  {projectKeywords.map((k) => <option key={k.id} value={k.id}>{k.keyword}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Primary Keyword *</label>
                <input
                  type="text"
                  value={form.targetKeyword}
                  onChange={(e) => setForm({ ...form, targetKeyword: e.target.value })}
                  placeholder="e.g. best project management tools"
                  required
                  className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Secondary Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={form.secondaryKeywords}
                  onChange={(e) => setForm({ ...form, secondaryKeywords: e.target.value })}
                  placeholder="project management, team tools, ..."
                  className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-zinc-500 mb-1">Working Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 15 Best Project Management Tools for Agencies in 2025"
                  required
                  className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Content Type</label>
                <select
                  value={form.contentType}
                  onChange={(e) => setForm({ ...form, contentType: e.target.value as ContentType })}
                  className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40"
                >
                  {CONTENT_TYPES.map((ct) => <option key={ct} value={ct}>{CONTENT_TYPE_LABELS[ct]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Word Count Target</label>
                <input
                  type="number"
                  value={form.wordCountTarget}
                  onChange={(e) => setForm({ ...form, wordCountTarget: e.target.value })}
                  min={300}
                  className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}
                  className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40"
                >
                  {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setCreating(false)} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Creating...' : 'Create Brief'}
              </button>
            </div>
          </form>
        )}

        {/* Brief cards */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-12 text-center">
            <p className="text-2xl mb-2">✍️</p>
            <p className="text-sm text-zinc-400">No content briefs yet</p>
            <p className="text-xs text-zinc-600 mt-1">Create a brief to start planning your content</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                isSelected={selectedBrief?.id === brief.id}
                onSelect={() => setSelectedBrief(selectedBrief?.id === brief.id ? null : brief)}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedBrief && (
        <BriefDetailPanel
          brief={selectedBrief}
          onUpdate={handleBriefUpdate}
          onClose={() => setSelectedBrief(null)}
        />
      )}
    </div>
  );
}

function BriefCard({
  brief,
  isSelected,
  onSelect,
  onStatusChange,
  onDelete,
}: {
  brief: ContentBrief;
  isSelected: boolean;
  onSelect: () => void;
  onStatusChange: (id: string, status: ContentBriefStatus) => void;
  onDelete: (id: string) => void;
}) {
  const PRIORITY_COLORS = {
    low: 'text-zinc-500',
    medium: 'text-amber-400',
    high: 'text-red-400',
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-[#A3E635]/30 bg-[#A3E635]/5'
          : 'border-[#2E2E2E] bg-[#1E1E1E] hover:border-[#3A3A3A] hover:bg-[#252525]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${BRIEF_STATUS_COLORS[brief.status]}`}>
              {BRIEF_STATUS_LABELS[brief.status]}
            </span>
            <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">
              {CONTENT_TYPE_LABELS[brief.contentType as ContentType]}
            </span>
            <span className={`text-[10px] font-medium capitalize ${PRIORITY_COLORS[brief.priority as keyof typeof PRIORITY_COLORS]}`}>
              {brief.priority} priority
            </span>
            {brief.aiGenerated && (
              <span className="text-[10px] text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded">
                ⚡ AI Generated
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-zinc-200 leading-snug">{brief.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">🔍 {brief.targetKeyword}</p>
          {brief.secondaryKeywords.length > 0 && (
            <p className="text-[10px] text-zinc-700 mt-0.5 truncate">
              +{brief.secondaryKeywords.join(', ')}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <select
            value={brief.status}
            onChange={(e) => onStatusChange(brief.id, e.target.value as ContentBriefStatus)}
            className="rounded border border-[#2E2E2E] bg-[#141414] px-2 py-1 text-[10px] text-zinc-400 outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{BRIEF_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            onClick={() => onDelete(brief.id)}
            className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors p-1"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-[#2A2A2A] text-[10px] text-zinc-600">
        <span>{brief.wordCountTarget.toLocaleString()} words</span>
        {brief.dueDate && <span>Due {new Date(brief.dueDate).toLocaleDateString()}</span>}
        <span className="ml-auto">
          {new Date(brief.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
