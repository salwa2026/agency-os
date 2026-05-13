'use client';

import { useState } from 'react';
import type { GrowthExperiment } from './GrowthClient';

interface GrowthIdea {
  id: string;
  title: string;
  category: string;
  hypothesis: string;
  variantA: string;
  variantB: string;
  metric: string;
  targetLift: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeToResults: string;
  tags: string[];
}

interface Props {
  projectId: string;
  project: { name: string; industry: string | null; description: string | null };
  onAddExperiment: (exp: GrowthExperiment) => void;
}

const FOCUS_OPTIONS = [
  'Acquisition', 'Activation', 'Retention', 'Referral', 'Revenue',
  'Landing Page', 'Onboarding', 'Email', 'Pricing', 'SEO',
];

const EFFORT_COLORS = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' };
const IMPACT_COLORS = { low: 'text-zinc-500', medium: 'text-amber-400', high: 'text-[#A3E635]' };
const CATEGORY_ICONS: Record<string, string> = {
  acquisition: '📥', activation: '⚡', retention: '🔄', referral: '🔗', revenue: '💰',
};

export default function IdeasGenerator({ projectId, project, onAddExperiment }: Props) {
  const [focus, setFocus] = useState('');
  const [customFocus, setCustomFocus] = useState('');
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState<GrowthIdea[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    setIdeas([]);

    const focusText = customFocus || focus;

    try {
      const res = await fetch('/api/growth/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, focus: focusText }),
      });

      if (!res.ok || !res.body) throw new Error('Generation failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: complete')) {
            // ideas parsed in data line below
          }
          if (line.startsWith('data: ') && !line.includes('"text"')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.ideas) setIdeas(data.ideas);
              if (data.error) setError(data.error);
            } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleAdd(idea: GrowthIdea) {
    setAdding(idea.id);
    try {
      const res = await fetch('/api/growth/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: idea.title,
          hypothesis: idea.hypothesis,
          variantA: idea.variantA,
          variantB: idea.variantB,
          metric: idea.metric,
          targetLift: idea.targetLift,
          tags: [idea.category, ...idea.tags],
        }),
      });
      if (res.ok) {
        const created: GrowthExperiment = await res.json();
        onAddExperiment(created);
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-zinc-200 mb-1">AI Growth Ideas Generator</p>
          <p className="text-xs text-zinc-500">
            Generates 10 tailored, hypothesis-driven growth experiments for <strong className="text-zinc-300">{project.name}</strong>.
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-2">Focus area (optional)</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {FOCUS_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => { setFocus(focus === f ? '' : f); setCustomFocus(''); }}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  focus === f
                    ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25'
                    : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customFocus}
            onChange={(e) => { setCustomFocus(e.target.value); setFocus(''); }}
            placeholder="Or type a custom focus..."
            className="w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <><span className="animate-spin inline-block">⟳</span> Generating Ideas...</>
          ) : (
            <><span>⚡</span> Generate 10 Growth Ideas</>
          )}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Ideas grid */}
      {ideas.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{ideas.length} ideas generated</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {ideas.map((idea) => (
              <div key={idea.id} className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-sm">{CATEGORY_ICONS[idea.category] ?? '🧪'}</span>
                      <span className="text-[10px] text-zinc-600 capitalize bg-zinc-800 px-2 py-0.5 rounded">{idea.category}</span>
                      <span className={`text-[10px] font-medium ${IMPACT_COLORS[idea.impact]}`}>
                        {idea.impact} impact
                      </span>
                      <span className={`text-[10px] font-medium ${EFFORT_COLORS[idea.effort]}`}>
                        {idea.effort} effort
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-200">{idea.title}</p>
                  </div>
                  {idea.targetLift > 0 && (
                    <span className="text-xs font-bold text-[#A3E635] shrink-0">+{idea.targetLift}%</span>
                  )}
                </div>

                {/* Hypothesis */}
                <p className="text-xs text-zinc-500 leading-relaxed">{idea.hypothesis}</p>

                {/* Variants */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded bg-[#141414] border border-[#2A2A2A] px-2 py-1.5">
                    <span className="text-zinc-600 block mb-0.5">A — Control</span>
                    <span className="text-zinc-400">{idea.variantA}</span>
                  </div>
                  <div className="rounded bg-[#A3E635]/5 border border-[#A3E635]/15 px-2 py-1.5">
                    <span className="text-[#A3E635]/70 block mb-0.5">B — Treatment</span>
                    <span className="text-zinc-400">{idea.variantB}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] text-zinc-600">
                    📊 {idea.metric} · ⏱ {idea.timeToResults}
                  </div>
                  <button
                    onClick={() => handleAdd(idea)}
                    disabled={adding === idea.id}
                    className="text-xs font-medium text-[#A3E635] hover:opacity-80 disabled:opacity-50 transition-opacity"
                  >
                    {adding === idea.id ? 'Adding...' : '+ Add to experiments →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
