'use client';

import { useState } from 'react';
import BrandProfileForm from './BrandProfileForm';
import AssetLibrary from './AssetLibrary';
import GuidelinesPanel from './GuidelinesPanel';

export interface BrandProfile {
  id: string;
  projectId: string;
  companyName: string | null;
  tagline: string | null;
  mission: string | null;
  vision: string | null;
  values: string[];
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  neutralColor: string | null;
  primaryFont: string | null;
  secondaryFont: string | null;
  toneOfVoice: string[];
  targetAudience: string | null;
  competitors: string[];
  industry: string | null;
  logoUrl: string | null;
  guidelinesDoc: string | null;
  guidelinesGeneratedAt: string | null;
}

export interface BrandAsset {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  category: string;
  url: string | null;
  mimeType: string | null;
  tags: string[];
  createdAt: string;
}

interface Props {
  projects: { id: string; name: string; industry: string | null }[];
  initialProfiles: BrandProfile[];
  initialAssets: BrandAsset[];
}

type Tab = 'profile' | 'assets' | 'guidelines';

export default function BrandingClient({ projects, initialProfiles, initialAssets }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '');
  const [profiles, setProfiles] = useState<BrandProfile[]>(initialProfiles);
  const [assets, setAssets] = useState<BrandAsset[]>(initialAssets);

  const currentProfile = profiles.find((p) => p.projectId === selectedProjectId) ?? null;
  const currentAssets = assets.filter((a) => a.projectId === selectedProjectId);
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  function handleProfileUpdate(profile: BrandProfile) {
    setProfiles((prev) =>
      prev.some((p) => p.projectId === profile.projectId)
        ? prev.map((p) => (p.projectId === profile.projectId ? profile : p))
        : [...prev, profile]
    );
  }

  function handleAssetAdded(asset: BrandAsset) {
    setAssets((prev) => [asset, ...prev]);
  }

  function handleAssetDeleted(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  if (projects.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-12 text-center">
          <p className="text-2xl mb-2">🎨</p>
          <p className="text-sm text-zinc-400">No active projects found</p>
          <p className="text-xs text-zinc-600 mt-1">Create an active project to set up your brand identity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Project selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs text-zinc-500">Brand for:</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-[#A3E635]/40"
        >
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Color swatches preview */}
        {currentProfile && (
          <div className="flex items-center gap-1.5 ml-2">
            {[
              currentProfile.primaryColor,
              currentProfile.secondaryColor,
              currentProfile.accentColor,
              currentProfile.neutralColor,
            ]
              .filter(Boolean)
              .map((color, i) => (
                <div
                  key={i}
                  className="h-5 w-5 rounded-full border border-black/20 shadow-sm"
                  style={{ backgroundColor: color! }}
                  title={color!}
                />
              ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#2E2E2E]">
        {(
          [
            { id: 'profile' as Tab, label: 'Brand Identity', icon: '🎨' },
            { id: 'assets' as Tab, label: 'Asset Library', icon: '📦', count: currentAssets.length },
            { id: 'guidelines' as Tab, label: 'Brand Guidelines', icon: '📋', badge: currentProfile?.guidelinesDoc ? '✓' : null },
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
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {'count' in tab && tab.count != null && (
              <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${activeTab === tab.id ? 'bg-[#A3E635]/15 text-[#A3E635]' : 'bg-zinc-800 text-zinc-500'}`}>
                {tab.count}
              </span>
            )}
            {'badge' in tab && tab.badge && (
              <span className="text-[10px] text-emerald-400">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && currentProject && (
        <BrandProfileForm
          projectId={selectedProjectId}
          initialProfile={currentProfile}
          projectIndustry={currentProject.industry}
          onSaved={handleProfileUpdate}
        />
      )}
      {activeTab === 'assets' && (
        <AssetLibrary
          projectId={selectedProjectId}
          assets={currentAssets}
          onAdded={handleAssetAdded}
          onDeleted={handleAssetDeleted}
        />
      )}
      {activeTab === 'guidelines' && (
        <GuidelinesPanel
          projectId={selectedProjectId}
          profile={currentProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}
