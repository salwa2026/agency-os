'use client';

import { useState } from 'react';
import type { Keyword } from '@/types/seo';

interface Props {
  keywords: Keyword[];
  projects: { id: string; name: string }[];
  onKeywordsChange: (kws: Keyword[]) => void;
}

const DIFF_COLORS = [
  { max: 30, label: 'Easy', color: 'text-emerald-400' },
  { max: 60, label: 'Medium', color: 'text-amber-400' },
  { max: 100, label: 'Hard', color: 'text-red-400' },
];

function diffLabel(d: number | null) {
  if (d == null) return null;
  return DIFF_COLORS.find((c) => d <= c.max) ?? DIFF_COLORS[2];
}

function positionDelta(current: number | null, previous: number | null) {
  if (current == null || previous == null) return null;
  return previous - current; // positive = improved (went up in ranking)
}

function positionStatus(current: number | null, target: number) {
  if (current == null) return 'unknown';
  if (current <= target) return 'achieved';
  if (current <= target + 5) return 'close';
  return 'far';
}

const STATUS_COLORS = {
  achieved: 'text-emerald-400',
  close: 'text-amber-400',
  far: 'text-red-400',
  unknown: 'text-zinc-600',
};

const EMPTY_FORM = {
  projectId: '',
  keyword: '',
  targetUrl: '',
  searchVolume: '',
  difficulty: '',
  currentPosition: '',
  targetPosition: '10',
  notes: '',
};

export default function KeywordTracker({ keywords, projects, onKeywordsChange }: Props) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, projectId: projects[0]?.id ?? '' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPos, setEditPos] = useState('');

  const filtered = keywords.filter((k) =>
    !search || k.keyword.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.keyword.trim() || !form.projectId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created: Keyword = await res.json();
        onKeywordsChange([created, ...keywords]);
        setForm({ ...EMPTY_FORM, projectId: form.projectId });
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePosition(id: string, position: string) {
    if (!position.trim()) return;
    const res = await fetch(`/api/seo/keywords/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPosition: position }),
    });
    if (res.ok) {
      const updated: Keyword = await res.json();
      onKeywordsChange(keywords.map((k) => (k.id === id ? updated : k)));
    }
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/seo/keywords/${id}`, { method: 'DELETE' });
    if (res.ok) onKeywordsChange(keywords.filter((k) => k.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 justify-between flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keywords..."
          className="rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40 w-52"
        />
        <button
          onClick={() => setAdding((v) => !v)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25 hover:bg-[#A3E635]/20 transition-colors"
        >
          {adding ? '✕ Cancel' : '+ Add Keyword'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-[#A3E635]/20 bg-[#1E1E1E] p-4 space-y-3 animate-fade-in"
        >
          <p className="text-xs font-semibold text-[#A3E635]">New Keyword</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] text-zinc-500 mb-1">Project</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] text-zinc-500 mb-1">Keyword *</label>
              <input
                type="text"
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                placeholder="e.g. best crm software for agencies"
                required
                className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Monthly Volume</label>
              <input
                type="number"
                value={form.searchVolume}
                onChange={(e) => setForm({ ...form, searchVolume: e.target.value })}
                placeholder="e.g. 1200"
                className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Difficulty (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                placeholder="e.g. 45"
                className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Current Position</label>
              <input
                type="number"
                min={1}
                value={form.currentPosition}
                onChange={(e) => setForm({ ...form, currentPosition: e.target.value })}
                placeholder="e.g. 24"
                className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Target Position</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.targetPosition}
                onChange={(e) => setForm({ ...form, targetPosition: e.target.value })}
                className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-[#A3E635]/40"
              />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className="block text-[10px] text-zinc-500 mb-1">Target URL</label>
              <input
                type="text"
                value={form.targetUrl}
                onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                placeholder="/blog/your-article-slug"
                className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Add Keyword'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-12 text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm text-zinc-400">No keywords tracked yet</p>
          <p className="text-xs text-zinc-600 mt-1">Add keywords to start tracking positions</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#2E2E2E] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2E2E2E] bg-[#141414]">
                  {['Keyword', 'Volume', 'Difficulty', 'Position', 'Target', 'Change', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E]">
                {filtered.map((kw) => {
                  const diff = diffLabel(kw.difficulty);
                  const delta = positionDelta(kw.currentPosition, kw.previousPosition);
                  const status = positionStatus(kw.currentPosition, kw.targetPosition);
                  return (
                    <tr key={kw.id} className="bg-[#1A1A1A] hover:bg-[#202020] transition-colors group">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-zinc-200">{kw.keyword}</p>
                          {kw.targetUrl && (
                            <p className="text-[10px] text-zinc-600 mt-0.5 truncate max-w-[180px]">{kw.targetUrl}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {kw.searchVolume != null ? kw.searchVolume.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {diff ? (
                          <span className={`font-medium ${diff.color}`}>
                            {kw.difficulty} <span className="opacity-60">({diff.label})</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === kw.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editPos}
                              onChange={(e) => setEditPos(e.target.value)}
                              autoFocus
                              className="w-14 rounded border border-[#A3E635]/40 bg-[#141414] px-1.5 py-0.5 text-xs text-zinc-200 outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdatePosition(kw.id, editPos);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => handleUpdatePosition(kw.id, editPos)}
                              className="text-[#A3E635] hover:opacity-80 text-[10px]"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingId(kw.id); setEditPos(String(kw.currentPosition ?? '')) }}
                            className="font-semibold text-zinc-200 hover:text-[#A3E635] transition-colors"
                          >
                            {kw.currentPosition != null ? `#${kw.currentPosition}` : '—'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">#{kw.targetPosition}</td>
                      <td className="px-4 py-3">
                        {delta != null ? (
                          <span className={delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-zinc-600'}>
                            {delta > 0 ? `↑ ${delta}` : delta < 0 ? `↓ ${Math.abs(delta)}` : '→ 0'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${STATUS_COLORS[status]}`}>
                          {status === 'achieved' ? '✓ On target' : status === 'close' ? '≈ Close' : status === 'far' ? '✗ Off target' : '–'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(kw.id)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-600 hover:text-red-400 transition-all"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
