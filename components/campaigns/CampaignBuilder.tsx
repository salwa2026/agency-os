'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TemplateSelector from './TemplateSelector';
import BriefForm from './BriefForm';
import CommandPreview from './CommandPreview';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CampaignBrief, CampaignType } from '@/types/campaign';

interface CampaignBuilderProps {
  projectId: string;
  projectName: string;
}

type Step = 'template' | 'brief' | 'preview' | 'launch';

const STEPS: Array<{ id: Step; label: string; icon: string }> = [
  { id: 'template', label: 'Campaign Type', icon: '◈' },
  { id: 'brief', label: 'Campaign Brief', icon: '✍' },
  { id: 'preview', label: 'Review Commands', icon: '⚡' },
  { id: 'launch', label: 'Launch', icon: '🚀' },
];

const EMPTY_BRIEF: CampaignBrief = {
  companyName: '',
  industry: '',
  targetAudience: '',
  mainGoal: '',
  kpis: [],
  budget: '',
  timeline: '',
  tone: 'Professional & authoritative',
  uniqueSellingPoints: [],
  competitors: [],
  channels: [],
  additionalContext: '',
};

export default function CampaignBuilder({ projectId, projectName }: CampaignBuilderProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('template');
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [brief, setBrief] = useState<CampaignBrief>({ ...EMPTY_BRIEF, companyName: projectName });
  const [launching, setLaunching] = useState(false);
  const [autoLaunch, setAutoLaunch] = useState(true);
  const [error, setError] = useState('');

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  function canProceed(): boolean {
    if (step === 'template') return !!campaignType && !!campaignName.trim();
    if (step === 'brief') {
      return !!(
        brief.companyName &&
        brief.industry &&
        brief.targetAudience &&
        brief.mainGoal
      );
    }
    return true;
  }

  function next() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  }

  function back() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  }

  async function handleLaunch() {
    if (!campaignType) return;
    setLaunching(true);
    setError('');

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: campaignName,
          type: campaignType,
          brief,
          autoLaunch,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create campaign');
      }

      const campaign = await res.json();
      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLaunching(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-[#2E2E2E] bg-[#141414]/95 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-sm font-semibold text-white">Campaign Builder</h1>
            <p className="text-xs text-zinc-500">{projectName}</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1">
                <div
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    step === s.id
                      ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25'
                      : i < currentStepIndex
                      ? 'text-zinc-400'
                      : 'text-zinc-600'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="hidden sm:block">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="text-zinc-700 text-xs">›</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <button onClick={() => setError('')} className="ml-2 opacity-60 hover:opacity-100">×</button>
          </div>
        )}

        {/* Step: Template */}
        {step === 'template' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-white">Choose your campaign type</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Each template includes pre-configured AI agents and auto-generated commands optimized for that campaign objective.
              </p>
            </div>
            <Input
              label="Campaign Name"
              required
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Q1 Growth Campaign, Brand Refresh 2025"
              autoFocus
            />
            <TemplateSelector selected={campaignType} onSelect={setCampaignType} />
          </div>
        )}

        {/* Step: Brief */}
        {step === 'brief' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-white">Fill in your campaign brief</h2>
              <p className="text-sm text-zinc-500 mt-1">
                This brief is injected into every agent's command — the more detail you provide, the better the outputs.
              </p>
            </div>
            <BriefForm brief={brief} onChange={setBrief} />
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && campaignType && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-white">Review agent commands</h2>
              <p className="text-sm text-zinc-500 mt-1">
                These commands have been auto-generated from your brief. Expand each to verify the instructions before launch.
              </p>
            </div>
            <CommandPreview campaignType={campaignType} brief={brief} />
          </div>
        )}

        {/* Step: Launch */}
        {step === 'launch' && campaignType && (
          <div className="space-y-6 animate-fade-in max-w-lg">
            <div>
              <h2 className="text-lg font-bold text-white">Ready to launch</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Review your campaign settings before deploying agents.
              </p>
            </div>

            {/* Summary card */}
            <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{campaignName}</p>
                  <p className="text-xs text-zinc-500">{projectName}</p>
                </div>
                <span className="text-xs text-[#A3E635] bg-[#A3E635]/10 border border-[#A3E635]/20 px-2 py-1 rounded">
                  Ready
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#2A2A2A]">
                {[
                  { label: 'Company', value: brief.companyName },
                  { label: 'Goal', value: brief.mainGoal.slice(0, 40) + (brief.mainGoal.length > 40 ? '...' : '') },
                  { label: 'Budget', value: brief.budget || 'Not set' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wide">{item.label}</p>
                    <p className="text-xs text-zinc-300 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch mode toggle */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Launch Mode</p>

              <button
                onClick={() => setAutoLaunch(true)}
                className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  autoLaunch ? 'border-[#A3E635]/40 bg-[#A3E635]/8' : 'border-[#2E2E2E] bg-[#1E1E1E] hover:border-[#3A3A3A]'
                }`}
              >
                <span className="text-xl mt-0.5">🚀</span>
                <div>
                  <p className={`text-sm font-semibold ${autoLaunch ? 'text-[#A3E635]' : 'text-zinc-200'}`}>
                    Auto-Launch Phase 1
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Deploy Phase 1 agents immediately. Subsequent phases wait for your approval.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setAutoLaunch(false)}
                className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  !autoLaunch ? 'border-[#A3E635]/40 bg-[#A3E635]/8' : 'border-[#2E2E2E] bg-[#1E1E1E] hover:border-[#3A3A3A]'
                }`}
              >
                <span className="text-xl mt-0.5">⏸️</span>
                <div>
                  <p className={`text-sm font-semibold ${!autoLaunch ? 'text-[#A3E635]' : 'text-zinc-200'}`}>
                    Save as Draft
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Create the campaign structure and launch agents manually when ready.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 border-t border-[#2E2E2E] bg-[#141414]/95 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              if (step === 'template') router.back();
              else back();
            }}
          >
            ← {step === 'template' ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex items-center gap-2">
            {/* Progress dots */}
            <div className="flex items-center gap-1 mr-3">
              {STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStepIndex
                      ? 'w-4 bg-[#A3E635]'
                      : i < currentStepIndex
                      ? 'w-1.5 bg-[#A3E635]/40'
                      : 'w-1.5 bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            {step !== 'launch' ? (
              <Button
                variant="primary"
                onClick={next}
                disabled={!canProceed()}
              >
                Continue →
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleLaunch}
                loading={launching}
              >
                {autoLaunch ? '🚀 Launch Campaign' : '💾 Save Campaign'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
