'use client';

import { useState } from 'react';
import type { BrandProfile } from './BrandingClient';

interface Props {
  projectId: string;
  initialProfile: BrandProfile | null;
  projectIndustry: string | null;
  onSaved: (profile: BrandProfile) => void;
}

const TONE_OPTIONS = [
  'Professional', 'Friendly', 'Bold', 'Playful', 'Authoritative',
  'Empathetic', 'Innovative', 'Minimalist', 'Inspirational', 'Conversational',
];

const COLOR_PRESETS: Record<string, { primary: string; secondary: string; accent: string; neutral: string }> = {
  'Lime & Dark': { primary: '#A3E635', secondary: '#1E1E1E', accent: '#F59E0B', neutral: '#71717A' },
  'Blue & White': { primary: '#3B82F6', secondary: '#FFFFFF', accent: '#F59E0B', neutral: '#94A3B8' },
  'Purple & Cream': { primary: '#7C3AED', secondary: '#FEFCE8', accent: '#EC4899', neutral: '#A3A3A3' },
  'Red & Black': { primary: '#EF4444', secondary: '#0A0A0A', accent: '#F97316', neutral: '#6B7280' },
  'Teal & Sand': { primary: '#14B8A6', secondary: '#FFF7ED', accent: '#F59E0B', neutral: '#9CA3AF' },
};

function toArray(val: string): string[] {
  return val
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function fromArray(arr: string[]): string {
  return arr.join('\n');
}

export default function BrandProfileForm({ projectId, initialProfile, projectIndustry, onSaved }: Props) {
  const [form, setForm] = useState({
    companyName: initialProfile?.companyName ?? '',
    tagline: initialProfile?.tagline ?? '',
    mission: initialProfile?.mission ?? '',
    vision: initialProfile?.vision ?? '',
    values: fromArray(initialProfile?.values ?? []),
    primaryColor: initialProfile?.primaryColor ?? '#A3E635',
    secondaryColor: initialProfile?.secondaryColor ?? '#1E1E1E',
    accentColor: initialProfile?.accentColor ?? '#F59E0B',
    neutralColor: initialProfile?.neutralColor ?? '#71717A',
    primaryFont: initialProfile?.primaryFont ?? '',
    secondaryFont: initialProfile?.secondaryFont ?? '',
    toneOfVoice: initialProfile?.toneOfVoice ?? [],
    targetAudience: initialProfile?.targetAudience ?? '',
    competitors: fromArray(initialProfile?.competitors ?? []),
    industry: initialProfile?.industry ?? projectIndustry ?? '',
    logoUrl: initialProfile?.logoUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleTone(tone: string) {
    setForm((f) => ({
      ...f,
      toneOfVoice: f.toneOfVoice.includes(tone)
        ? f.toneOfVoice.filter((t) => t !== tone)
        : [...f.toneOfVoice, tone],
    }));
  }

  function applyPreset(preset: { primary: string; secondary: string; accent: string; neutral: string }) {
    setForm((f) => ({
      ...f,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
      neutralColor: preset.neutral,
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/branding/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...form,
          values: toArray(form.values),
          competitors: toArray(form.competitors),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSaved(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {/* Identity */}
      <Section title="Brand Identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Name">
            <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Corp" className={inputCls} />
          </Field>
          <Field label="Industry">
            <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="SaaS / Marketing / E-commerce..." className={inputCls} />
          </Field>
          <Field label="Tagline" full>
            <input type="text" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Short, memorable brand promise" className={inputCls} />
          </Field>
          <Field label="Logo URL" full>
            <input type="url" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." className={inputCls} />
          </Field>
          <Field label="Mission Statement" full>
            <textarea rows={2} value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} placeholder="Why your company exists" className={textareaCls} />
          </Field>
          <Field label="Vision" full>
            <textarea rows={2} value={form.vision} onChange={(e) => setForm({ ...form, vision: e.target.value })} placeholder="Where you're heading in 10 years" className={textareaCls} />
          </Field>
          <Field label="Core Values (one per line)" full>
            <textarea rows={3} value={form.values} onChange={(e) => setForm({ ...form, values: e.target.value })} placeholder="Integrity&#10;Innovation&#10;Customer Obsession" className={textareaCls} />
          </Field>
        </div>
      </Section>

      {/* Colors */}
      <Section title="Color Palette">
        <div className="mb-3 flex flex-wrap gap-2">
          {Object.entries(COLOR_PRESETS).map(([name, preset]) => (
            <button
              key={name}
              type="button"
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-1.5 rounded-lg border border-[#2E2E2E] bg-[#1A1A1A] px-3 py-1.5 text-xs text-zinc-400 hover:border-[#3A3A3A] hover:text-zinc-200 transition-colors"
            >
              <div className="flex gap-0.5">
                {[preset.primary, preset.secondary, preset.accent].map((c) => (
                  <div key={c} className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: c }} />
                ))}
              </div>
              {name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: 'primaryColor' as const, label: 'Primary' },
            { key: 'secondaryColor' as const, label: 'Secondary' },
            { key: 'accentColor' as const, label: 'Accent' },
            { key: 'neutralColor' as const, label: 'Neutral' },
          ].map(({ key, label }) => (
            <Field key={key} label={label}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="h-9 w-12 rounded-lg border border-[#2E2E2E] bg-transparent cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="flex-1 rounded-lg border border-[#2E2E2E] bg-[#141414] px-2 py-1.5 text-xs text-zinc-300 font-mono outline-none focus:border-[#A3E635]/40"
                  maxLength={7}
                />
              </div>
            </Field>
          ))}
        </div>

        {/* Live palette preview */}
        <div className="mt-4 flex rounded-xl overflow-hidden h-10 border border-[#2A2A2A]">
          {[form.primaryColor, form.secondaryColor, form.accentColor, form.neutralColor].map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Primary Font (Headings)">
            <input type="text" value={form.primaryFont} onChange={(e) => setForm({ ...form, primaryFont: e.target.value })} placeholder="Inter, Montserrat, Playfair Display..." className={inputCls} />
            {form.primaryFont && (
              <p className="text-xs text-zinc-600 mt-1" style={{ fontFamily: form.primaryFont }}>
                {form.primaryFont} — The quick brown fox
              </p>
            )}
          </Field>
          <Field label="Secondary Font (Body)">
            <input type="text" value={form.secondaryFont} onChange={(e) => setForm({ ...form, secondaryFont: e.target.value })} placeholder="Inter, Source Sans, Lato..." className={inputCls} />
            {form.secondaryFont && (
              <p className="text-xs text-zinc-600 mt-1" style={{ fontFamily: form.secondaryFont }}>
                {form.secondaryFont} — The quick brown fox
              </p>
            )}
          </Field>
        </div>
      </Section>

      {/* Tone of Voice */}
      <Section title="Tone of Voice">
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => toggleTone(tone)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                form.toneOfVoice.includes(tone)
                  ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/25'
                  : 'border border-[#2E2E2E] text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </Section>

      {/* Audience & Competitors */}
      <Section title="Audience & Market">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Target Audience" full>
            <textarea rows={3} value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} placeholder="Marketing managers at B2B SaaS companies, 25-45, focused on growth..." className={textareaCls} />
          </Field>
          <Field label="Competitors (one per line)" full>
            <textarea rows={3} value={form.competitors} onChange={(e) => setForm({ ...form, competitors: e.target.value })} placeholder="HubSpot&#10;Salesforce&#10;Marketo" className={textareaCls} />
          </Field>
        </div>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Brand Profile'}
        </button>
        {saved && <span className="text-xs text-emerald-400">✓ Saved</span>}
      </div>
    </form>
  );
}

const inputCls = 'w-full rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40 transition-colors';
const textareaCls = `${inputCls} resize-none leading-relaxed`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-5 space-y-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-full' : ''}>
      <label className="block text-xs text-zinc-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
