'use client';

import { Input, Textarea } from '@/components/ui/Input';
import type { CampaignBrief } from '@/types/campaign';

interface BriefFormProps {
  brief: CampaignBrief;
  onChange: (brief: CampaignBrief) => void;
}

const TONE_OPTIONS = [
  'Professional & authoritative',
  'Friendly & conversational',
  'Bold & provocative',
  'Empathetic & supportive',
  'Technical & precise',
  'Playful & witty',
  'Inspirational & aspirational',
];

const CHANNEL_OPTIONS = [
  'Website / SEO',
  'Google Ads',
  'Meta Ads (Facebook/Instagram)',
  'LinkedIn',
  'TikTok',
  'Email Marketing',
  'Content / Blog',
  'Social Media (Organic)',
  'PR / Media',
  'Partnerships',
];

export default function BriefForm({ brief, onChange }: BriefFormProps) {
  function update<K extends keyof CampaignBrief>(key: K, value: CampaignBrief[K]) {
    onChange({ ...brief, [key]: value });
  }

  function updateList(key: 'kpis' | 'uniqueSellingPoints' | 'competitors' | 'channels', raw: string) {
    const items = raw.split('\n').map((s) => s.trim()).filter(Boolean);
    onChange({ ...brief, [key]: items });
  }

  function toggleChannel(channel: string) {
    const current = brief.channels ?? [];
    const next = current.includes(channel)
      ? current.filter((c) => c !== channel)
      : [...current, channel];
    onChange({ ...brief, channels: next });
  }

  return (
    <div className="space-y-6">
      {/* Company basics */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Company</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Company Name"
            required
            value={brief.companyName}
            onChange={(e) => update('companyName', e.target.value)}
            placeholder="e.g. Acme Corp"
          />
          <Input
            label="Industry"
            required
            value={brief.industry}
            onChange={(e) => update('industry', e.target.value)}
            placeholder="e.g. B2B SaaS, E-commerce, Healthcare"
          />
        </div>
      </div>

      {/* Campaign goal */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Campaign Goal</h3>
        <div className="space-y-4">
          <Textarea
            label="Main Goal"
            required
            value={brief.mainGoal}
            onChange={(e) => update('mainGoal', e.target.value)}
            placeholder="What is the single most important outcome this campaign must achieve?"
            rows={2}
          />
          <Textarea
            label="Target Audience"
            required
            value={brief.targetAudience}
            onChange={(e) => update('targetAudience', e.target.value)}
            placeholder="Describe your ideal customer: demographics, role, pain points, desires..."
            rows={3}
          />
          <Textarea
            label="KPIs (one per line)"
            value={brief.kpis.join('\n')}
            onChange={(e) => updateList('kpis', e.target.value)}
            placeholder="e.g.&#10;100 qualified leads/month&#10;3x ROAS on paid channels&#10;+20% organic traffic"
            rows={4}
            hint="Enter each KPI on a new line"
          />
        </div>
      </div>

      {/* Timeline & budget */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Timeline & Budget</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Timeline"
            value={brief.timeline}
            onChange={(e) => update('timeline', e.target.value)}
            placeholder="e.g. Q1 2025 (Jan–Mar), 90 days starting March 1"
          />
          <Input
            label="Budget"
            value={brief.budget}
            onChange={(e) => update('budget', e.target.value)}
            placeholder="e.g. $15,000/month, $50k total"
          />
        </div>
      </div>

      {/* Channels */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Target Channels</h3>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_OPTIONS.map((channel) => {
            const active = brief.channels.includes(channel);
            return (
              <button
                key={channel}
                type="button"
                onClick={() => toggleChannel(channel)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  active
                    ? 'border-[#A3E635]/50 bg-[#A3E635]/12 text-[#A3E635]'
                    : 'border-[#2E2E2E] text-zinc-500 hover:border-[#3A3A3A] hover:text-zinc-300'
                }`}
              >
                {channel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand positioning */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Brand Positioning</h3>
        <div className="space-y-4">
          <Textarea
            label="Unique Selling Points (one per line)"
            value={brief.uniqueSellingPoints.join('\n')}
            onChange={(e) => updateList('uniqueSellingPoints', e.target.value)}
            placeholder="e.g.&#10;Only platform with real-time AI analysis&#10;50% faster onboarding than competitors&#10;Built for enterprise security requirements"
            rows={4}
            hint="What makes your product/service different and better?"
          />
          <Textarea
            label="Main Competitors (one per line)"
            value={brief.competitors.join('\n')}
            onChange={(e) => updateList('competitors', e.target.value)}
            placeholder="e.g.&#10;HubSpot&#10;Salesforce&#10;Mailchimp"
            rows={3}
          />
        </div>
      </div>

      {/* Tone */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Brand Tone</h3>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => update('tone', tone)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                brief.tone === tone
                  ? 'border-[#A3E635]/50 bg-[#A3E635]/12 text-[#A3E635]'
                  : 'border-[#2E2E2E] text-zinc-500 hover:border-[#3A3A3A] hover:text-zinc-300'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
        <Input
          className="mt-2"
          value={TONE_OPTIONS.includes(brief.tone) ? '' : brief.tone}
          onChange={(e) => update('tone', e.target.value)}
          placeholder="Or type a custom tone description..."
        />
      </div>

      {/* Additional context */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Additional Context</h3>
        <Textarea
          label="Anything else the agents should know?"
          value={brief.additionalContext ?? ''}
          onChange={(e) => update('additionalContext', e.target.value)}
          placeholder="Previous campaign results, brand restrictions, important deadlines, stakeholder preferences..."
          rows={4}
        />
      </div>
    </div>
  );
}
