'use client';

import { useState } from 'react';
import type { GrowthExperiment } from './GrowthClient';

interface Props {
  projectId: string;
  experiments: GrowthExperiment[];
  allExperiments: GrowthExperiment[];
  onChange: (exps: GrowthExperiment[]) => void;
}

const STATUSES = [
  { id: 'draft', label: 'Draft', icon: '◯', color: 'text-zinc-500 bg-zinc-800 border-zinc-700' },
  { id: 'running', label: 'Running', icon: '▶', color: 'text-[#A3E635] bg-[#A3E635]/10 border-[#A3E635]/20' },
  { id: 'paused', label: 'Paused', icon: '⏸', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { id: 'complete', label: 'Complete', icon: '✓', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
] as const;

const EFFORT_COLORS = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' };
const IMPACT_COLORS = { low: 'text-zinc-500', medium: 'text-amber-400', high: 'text-[#A3E635]' };

const EMPTY_FORM = {
  name: '', hypothesis: '', variantA: 'Current state (control)',
  variantB: '', metric: '', targetLift: '', notes: '',
};

export default function ExperimentBoard({ projectId, experiments, allExperiments, onChange }: Props) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<GrowthExperiment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = experiments.filter((e) => statusFilter === 'all' || e.status === statusFilter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/growth/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ...form }),
      });
      if (res.ok) {
        const created: GrowthExperiment = await res.json();
        onChange([created, ...allExperiments]);
        setForm({ ...EMPTY_FORM });
        setCreating(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    const extra: Partial<GrowthExperiment> = {};
    if (status === 'running') extra.startDate = new Date().toISOString();
    if (status === 'complete') extra.endDate = new Date().toISOString();

    const res = await fetch(`/api/growth/experiments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    if (res.ok) {
      const updated: GrowthExperiment = await res.json();
      onChange(allExperiments.map((e) => (e.id === id ? updated : e)));
      if (selected?.id === id) setSelected(updated);
    }
  }

  async function handleResult(id: string, winner: string, resultA: string, resultB: string) {
    const res = await fetch(`/api/growth/experiments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner, resultA, resultB, status: 'complete', endDate: new Date().toISOString() }),
    });
    if (res.ok) {
      const updated: GrowthExperiment = await res.json();
      onChange(allExperiments.map((e) => (e.id === id ? updated : e)));
      setSelected(updated);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/growth/experiments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      onChange(allExperiments.filter((e) => e.id !== id));
      if (selected?.id === id) setSelected(null);
    }
  }

  return (
    <div className="flex gap-5">
      <div className="flex-1 space-y-4 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            {['all', ...STATUSES.map((s) => s.id)].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25'
                    : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s === 'all' ? 'All' : STATUSES.find((x) => x.id === s)?.label ?? s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCreating((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25 hover:bg-[#A3E635]/20 transition-colors"
          >
            {creating ? '✕ Cancel' : '+ New Experiment'}
          </button>
        </div>

        {/* Create form */}
        {creating && (
          <form onSubmit={handleCreate} className="rounded-xl border border-[#A3E635]/20 bg-[#1E1E1E] p-4 space-y-3 animate-fade-in">
            <p className="text-xs font-semibold text-[#A3E635]">New Growth Experiment</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-zinc-500 mb-1">Experiment Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. CTA Button Color Test" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-zinc-500 mb-1">Hypothesis *</label>
                <textarea rows={2} value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} required placeholder="If we [change X], then [metric Y] will improve by [Z%] because [reason]" className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Variant A (Control)</label>
                <input type="text" value={form.variantA} onChange={(e) => setForm({ ...form, variantA: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Variant B (Treatment)</label>
                <input type="text" value={form.variantB} onChange={(e) => setForm({ ...form, variantB: e.target.value })} placeholder="What we're changing" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Primary Metric</label>
                <input type="text" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} placeholder="e.g. Click-through rate" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Target Lift (%)</label>
                <input type="number" value={form.targetLift} onChange={(e) => setForm({ ...form, targetLift: e.target.value })} placeholder="e.g. 20" className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Experiment'}
              </button>
            </div>
          </form>
        )}

        {/* Experiment list */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2E2E2E] p-12 text-center">
            <p className="text-2xl mb-2">🧪</p>
            <p className="text-sm text-zinc-400">No experiments yet</p>
            <p className="text-xs text-zinc-600 mt-1">Create your first growth experiment or use the AI Ideas Generator</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((exp) => {
              const statusDef = STATUSES.find((s) => s.id === exp.status);
              const lift = exp.resultA != null && exp.resultB != null
                ? (((exp.resultB - exp.resultA) / exp.resultA) * 100).toFixed(1)
                : null;
              return (
                <div
                  key={exp.id}
                  onClick={() => setSelected(selected?.id === exp.id ? null : exp)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    selected?.id === exp.id
                      ? 'border-[#A3E635]/30 bg-[#A3E635]/5'
                      : 'border-[#2E2E2E] bg-[#1E1E1E] hover:border-[#3A3A3A] hover:bg-[#252525]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusDef?.color}`}>
                          {statusDef?.icon} {statusDef?.label}
                        </span>
                        {exp.metric && (
                          <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">{exp.metric}</span>
                        )}
                        {exp.targetLift && (
                          <span className="text-[10px] text-zinc-600">Target: +{exp.targetLift}%</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-zinc-200">{exp.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{exp.hypothesis}</p>
                    </div>
                    <div className="shrink-0 text-right" onClick={(e) => e.stopPropagation()}>
                      {exp.status === 'complete' && lift !== null && (
                        <p className={`text-sm font-bold ${parseFloat(lift) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {parseFloat(lift) > 0 ? '+' : ''}{lift}%
                        </p>
                      )}
                      {exp.winner && (
                        <p className="text-[10px] text-zinc-500">
                          {exp.winner === 'b' ? '🏆 B wins' : exp.winner === 'a' ? '→ A holds' : '≈ Inconclusive'}
                        </p>
                      )}
                      <select
                        value={exp.status}
                        onChange={(e) => handleStatusChange(exp.id, e.target.value)}
                        className="mt-1 rounded border border-[#2E2E2E] bg-[#141414] px-2 py-0.5 text-[10px] text-zinc-400 outline-none"
                      >
                        {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <ExperimentDetail
          experiment={selected}
          onClose={() => setSelected(null)}
          onResult={handleResult}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function ExperimentDetail({
  experiment: exp,
  onClose,
  onResult,
  onDelete,
}: {
  experiment: GrowthExperiment;
  onClose: () => void;
  onResult: (id: string, winner: string, a: string, b: string) => void;
  onDelete: (id: string) => void;
}) {
  const [resultA, setResultA] = useState(String(exp.resultA ?? ''));
  const [resultB, setResultB] = useState(String(exp.resultB ?? ''));
  const [winner, setWinner] = useState(exp.winner ?? '');

  const lift = resultA && resultB && parseFloat(resultA) !== 0
    ? (((parseFloat(resultB) - parseFloat(resultA)) / parseFloat(resultA)) * 100).toFixed(1)
    : null;

  return (
    <div className="w-[380px] shrink-0 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] flex flex-col max-h-[calc(100vh-8rem)] sticky top-6 overflow-hidden animate-slide-in-right">
      <div className="flex items-start justify-between gap-2 px-5 py-4 border-b border-[#2E2E2E] shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug">{exp.name}</p>
          {exp.metric && <p className="text-xs text-zinc-500 mt-0.5">Metric: {exp.metric}</p>}
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-sm shrink-0 mt-0.5">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        <Section title="Hypothesis">
          <p className="text-xs text-zinc-400 leading-relaxed">{exp.hypothesis}</p>
        </Section>

        {(exp.variantA || exp.variantB) && (
          <Section title="Variants">
            <div className="space-y-2">
              {exp.variantA && (
                <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] px-3 py-2">
                  <span className="text-[10px] text-zinc-600 block mb-0.5">VARIANT A — Control</span>
                  <p className="text-xs text-zinc-300">{exp.variantA}</p>
                </div>
              )}
              {exp.variantB && (
                <div className="rounded-lg border border-[#A3E635]/15 bg-[#A3E635]/5 px-3 py-2">
                  <span className="text-[10px] text-[#A3E635] block mb-0.5">VARIANT B — Treatment</span>
                  <p className="text-xs text-zinc-300">{exp.variantB}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {exp.targetLift && (
          <Section title="Target">
            <p className="text-xs text-zinc-400">+{exp.targetLift}% improvement in {exp.metric ?? 'primary metric'}</p>
          </Section>
        )}

        {/* Record results */}
        {['running', 'paused', 'complete'].includes(exp.status) && (
          <Section title="Results">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1">Variant A result</label>
                  <input type="number" value={resultA} onChange={(e) => setResultA(e.target.value)} placeholder="e.g. 3.2" step="0.01" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1">Variant B result</label>
                  <input type="number" value={resultB} onChange={(e) => setResultB(e.target.value)} placeholder="e.g. 4.1" step="0.01" className={inputCls} />
                </div>
              </div>
              {lift !== null && (
                <p className={`text-sm font-bold text-center py-2 rounded-lg ${parseFloat(lift) > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {parseFloat(lift) > 0 ? '+' : ''}{lift}% lift
                </p>
              )}
              <select value={winner} onChange={(e) => setWinner(e.target.value)} className={`w-full ${inputCls}`}>
                <option value="">Select winner...</option>
                <option value="b">🏆 Variant B wins — deploy treatment</option>
                <option value="a">→ Variant A wins — keep control</option>
                <option value="inconclusive">≈ Inconclusive — no clear winner</option>
              </select>
              <button
                onClick={() => winner && onResult(exp.id, winner, resultA, resultB)}
                disabled={!winner}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-40 transition-colors"
              >
                Record Results
              </button>
            </div>
          </Section>
        )}

        {exp.notes && (
          <Section title="Notes">
            <p className="text-xs text-zinc-400 leading-relaxed">{exp.notes}</p>
          </Section>
        )}

        <div className="pt-2">
          <button
            onClick={() => onDelete(exp.id)}
            className="text-xs text-zinc-700 hover:text-red-400 transition-colors"
          >
            Delete experiment
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40 transition-colors';
