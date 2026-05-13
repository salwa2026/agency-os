'use client';

import { useState } from 'react';
import ExperimentBoard from './ExperimentBoard';
import IdeasGenerator from './IdeasGenerator';

export interface GrowthExperiment {
  id: string;
  projectId: string;
  name: string;
  hypothesis: string;
  variantA: string | null;
  variantB: string | null;
  metric: string | null;
  targetLift: number | null;
  status: 'draft' | 'running' | 'paused' | 'complete' | 'archived';
  winner: string | null;
  resultA: number | null;
  resultB: number | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

interface Props {
  projects: { id: string; name: string; industry: string | null; description: string | null }[];
  initialExperiments: GrowthExperiment[];
  stats: { total: number; running: number; complete: number; wins: number };
}

type Tab = 'experiments' | 'ideas';

export default function GrowthClient({ projects, initialExperiments, stats }: Props) {
  const [tab, setTab] = useState<Tab>('experiments');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '');
  const [experiments, setExperiments] = useState<GrowthExperiment[]>(initialExperiments);

  const projectExperiments = experiments.filter((e) => e.projectId === selectedProjectId);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Experiments', value: stats.total, icon: '🧪' },
          { label: 'Running Now', value: stats.running, icon: '▶', accent: stats.running > 0 },
          { label: 'Completed', value: stats.complete, icon: '✓' },
          { label: 'Winning Tests', value: stats.wins, icon: '🏆', accent: stats.wins > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-500">{s.label}</span>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.accent ? 'text-[#A3E635]' : 'text-white'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Project + Tabs */}
      <div className="flex items-center gap-4 flex-wrap">
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-[#A3E635]/40"
        >
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <div className="flex items-center gap-1 border-b border-[#2E2E2E] flex-1">
          {([
            { id: 'experiments' as Tab, label: 'Experiments', count: projectExperiments.length },
            { id: 'ideas' as Tab, label: '⚡ AI Ideas Generator' },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id ? 'border-[#A3E635] text-[#A3E635]' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
              {'count' in t && t.count != null && (
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${tab === t.id ? 'bg-[#A3E635]/15 text-[#A3E635]' : 'bg-zinc-800 text-zinc-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'experiments' && (
        <ExperimentBoard
          projectId={selectedProjectId}
          experiments={projectExperiments}
          onChange={setExperiments}
          allExperiments={experiments}
        />
      )}
      {tab === 'ideas' && (
        <IdeasGenerator
          projectId={selectedProjectId}
          project={projects.find((p) => p.id === selectedProjectId)!}
          onAddExperiment={(exp) => setExperiments((prev) => [exp, ...prev])}
        />
      )}
    </div>
  );
}
