'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { prisma } from '@/lib/prisma';

const CAMPAIGN_ICONS: Record<string, string> = {
  product_launch: '🚀',
  brand_awareness: '📢',
  lead_generation: '🎯',
  seo_content_drive: '🔍',
  social_media_campaign: '📱',
  brand_refresh: '✨',
  paid_ads_campaign: '📊',
  custom: '◈',
};

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  totalTasks: number;
  doneTasks: number;
  createdAt: string;
  launchedAt: string | null;
  project: { id: string; name: string };
  _count: { agentTasks: number };
}

export default function CampaignsClient({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  async function openNewCampaign() {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/projects?status=active');
      if (res.ok) setProjects(await res.json());
    } finally {
      setLoadingProjects(false);
      setProjectPickerOpen(true);
    }
  }

  const filtered = campaigns.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'draft', 'active', 'completed', 'paused'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25'
                  : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40 w-48"
          />
          <Button variant="primary" size="sm" onClick={openNewCampaign}>
            + New Campaign
          </Button>
        </div>
      </div>

      {/* Campaign list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🚀"
          title="No campaigns yet"
          description="Create a campaign to deploy multiple AI agents in an orchestrated sequence"
          action={{ label: '+ New Campaign', onClick: openNewCampaign }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}

      {/* Project picker modal */}
      <Modal
        open={projectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        title="Select a Project"
        subtitle="Choose the project this campaign belongs to"
        size="sm"
      >
        <div className="space-y-2">
          {loadingProjects ? (
            <p className="text-sm text-zinc-500 text-center py-4">Loading projects...</p>
          ) : projects.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-zinc-500">No active projects found.</p>
              <Link href="/projects" className="text-xs text-[#A3E635] mt-1 block">
                Create a project first →
              </Link>
            </div>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setProjectPickerOpen(false);
                  router.push(`/campaigns/new?projectId=${project.id}&projectName=${encodeURIComponent(project.name)}`);
                }}
                className="w-full flex items-center gap-3 rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] px-4 py-3 text-left hover:border-[#3A3A3A] hover:bg-[#252525] transition-all"
              >
                <span className="text-lg">◈</span>
                <span className="text-sm text-zinc-200">{project.name}</span>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const icon = CAMPAIGN_ICONS[campaign.type] ?? '◈';
  const pct = campaign.totalTasks > 0
    ? Math.round((campaign.doneTasks / campaign.totalTasks) * 100)
    : 0;

  return (
    <Link href={`/campaigns/${campaign.id}`} className="group block">
      <div className="h-full rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-4 hover:border-[#3A3A3A] hover:bg-[#252525] transition-all flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <div>
              <p className="text-sm font-semibold text-zinc-200 group-hover:text-white leading-tight">
                {campaign.name}
              </p>
              <p className="text-xs text-zinc-600">{campaign.project.name}</p>
            </div>
          </div>
          <StatusBadge status={campaign.status} />
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-600">
            <span>{campaign.doneTasks}/{campaign.totalTasks} tasks</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#A3E635] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-zinc-600 border-t border-[#2A2A2A] pt-2">
          <span>{campaign._count.agentTasks} agents</span>
          <span>
            {campaign.launchedAt
              ? `Launched ${new Date(campaign.launchedAt).toLocaleDateString()}`
              : `Created ${new Date(campaign.createdAt).toLocaleDateString()}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
