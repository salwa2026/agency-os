'use client';

import { useState } from 'react';
import KeywordTracker from './KeywordTracker';
import ContentBriefList from './ContentBriefList';
import type { Keyword, ContentBrief } from '@/types/seo';

interface SeoStats {
  totalKeywords: number;
  avgPosition: number | null;
  publishedBriefs: number;
  inProgressBriefs: number;
}

interface SeoClientProps {
  projects: { id: string; name: string }[];
  initialKeywords: Keyword[];
  initialBriefs: ContentBrief[];
  stats: SeoStats;
}

type Tab = 'keywords' | 'briefs';

export default function SeoClient({ projects, initialKeywords, initialBriefs, stats }: SeoClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('keywords');
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords);
  const [briefs, setBriefs] = useState<ContentBrief[]>(initialBriefs);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Keywords Tracked', value: stats.totalKeywords, icon: '🔍', accent: false },
          {
            label: 'Avg. Position',
            value: stats.avgPosition != null ? `#${stats.avgPosition}` : '—',
            icon: '📊',
            accent: stats.avgPosition != null && stats.avgPosition <= 10,
          },
          { label: 'In Pipeline', value: stats.inProgressBriefs, icon: '✍️', accent: false },
          { label: 'Published', value: stats.publishedBriefs, icon: '✅', accent: true },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-500">{s.label}</span>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.accent ? 'text-[#A3E635]' : 'text-white'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[#2E2E2E]">
        {(
          [
            { id: 'keywords' as Tab, label: 'Keywords', count: keywords.length },
            { id: 'briefs' as Tab, label: 'Content Briefs', count: briefs.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-[#A3E635] text-[#A3E635]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] rounded-full px-1.5 py-0.5 ${
                activeTab === tab.id
                  ? 'bg-[#A3E635]/15 text-[#A3E635]'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'keywords' && (
        <KeywordTracker
          keywords={keywords}
          projects={projects}
          onKeywordsChange={setKeywords}
        />
      )}
      {activeTab === 'briefs' && (
        <ContentBriefList
          briefs={briefs}
          projects={projects}
          keywords={keywords}
          onBriefsChange={setBriefs}
        />
      )}
    </div>
  );
}
