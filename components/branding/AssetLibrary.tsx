'use client';

import { useState } from 'react';
import type { BrandAsset } from './BrandingClient';

interface Props {
  projectId: string;
  assets: BrandAsset[];
  onAdded: (asset: BrandAsset) => void;
  onDeleted: (id: string) => void;
}

const CATEGORIES = [
  { id: 'logo', label: 'Logo', icon: '◈' },
  { id: 'color_palette', label: 'Colors', icon: '🎨' },
  { id: 'typography', label: 'Typography', icon: '🔤' },
  { id: 'imagery', label: 'Imagery', icon: '🖼️' },
  { id: 'icon', label: 'Icons', icon: '⬡' },
  { id: 'template', label: 'Templates', icon: '📄' },
  { id: 'document', label: 'Documents', icon: '📋' },
  { id: 'other', label: 'Other', icon: '📦' },
] as const;

const EMPTY_FORM = { name: '', description: '', category: 'logo', url: '', tags: '' };

function isImageUrl(url: string | null): boolean {
  if (!url) return false;
  return /\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(url);
}

export default function AssetLibrary({ projectId, assets, onAdded, onDeleted }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const filtered = assets.filter((a) => filter === 'all' || a.category === filter);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/branding/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: form.name,
          description: form.description,
          category: form.category,
          url: form.url,
          tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        }),
      });
      if (res.ok) {
        const asset: BrandAsset = await res.json();
        onAdded(asset);
        setForm({ ...EMPTY_FORM });
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/branding/assets/${id}`, { method: 'DELETE' });
    if (res.ok) onDeleted(id);
  }

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25'
                : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All ({assets.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = assets.filter((a) => a.category === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === cat.id
                    ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25'
                    : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25 hover:bg-[#A3E635]/20 transition-colors"
        >
          {adding ? '✕ Cancel' : '+ Add Asset'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="rounded-xl border border-[#A3E635]/20 bg-[#1E1E1E] p-4 space-y-3 animate-fade-in">
          <p className="text-xs font-semibold text-[#A3E635]">Add Brand Asset</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Asset Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Primary Logo (Dark BG)" required className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-zinc-500 mb-1">URL (image, file, or Figma link)</label>
              <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="When and how to use this" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="light, horizontal, web" className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Asset'}
            </button>
          </div>
        </form>
      )}

      {/* Asset grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2E2E2E] p-12 text-center">
          <p className="text-2xl mb-2">📦</p>
          <p className="text-sm text-zinc-500">No assets yet</p>
          <p className="text-xs text-zinc-600 mt-1">Add logos, color swatches, font files, and brand templates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset) => {
            const cat = CATEGORIES.find((c) => c.id === asset.category);
            return (
              <div key={asset.id} className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] overflow-hidden group">
                {/* Image preview */}
                {isImageUrl(asset.url) && (
                  <div className="h-28 bg-[#141414] border-b border-[#2A2A2A] flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.url!} alt={asset.name} className="max-h-full max-w-full object-contain p-3" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{cat?.icon ?? '📦'}</span>
                        <span className="text-[10px] text-zinc-600 capitalize">{cat?.label ?? asset.category}</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-200 truncate">{asset.name}</p>
                      {asset.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{asset.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-600 hover:text-red-400 transition-all shrink-0 mt-1"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tags */}
                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {asset.tags.map((t) => (
                        <span key={t} className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Link */}
                  {asset.url && (
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-[10px] text-[#A3E635] hover:opacity-80 truncate"
                    >
                      Open link →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40 transition-colors';
