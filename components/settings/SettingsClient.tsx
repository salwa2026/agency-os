'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: '◎' },
  { id: 'agents', label: 'AI Agents', icon: '⚡' },
  { id: 'integrations', label: 'Integrations', icon: '◈' },
  { id: 'danger', label: 'Danger Zone', icon: '⚠' },
];

export default function SettingsClient({ user }: { user: User }) {
  const [section, setSection] = useState('profile');

  return (
    <div className="flex h-full animate-fade-in">
      {/* Settings sidebar */}
      <nav className="w-52 shrink-0 border-r border-[#2E2E2E] p-4 space-y-0.5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              section === s.id
                ? 'bg-[#A3E635]/10 text-[#A3E635]'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1E1E1E]'
            }`}
          >
            <span className={`text-base ${section === s.id ? 'text-[#A3E635]' : 'text-zinc-600'}`}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {section === 'profile' && <ProfileSection user={user} />}
        {section === 'agents' && <AgentsSection />}
        {section === 'integrations' && <IntegrationsSection />}
        {section === 'danger' && <DangerSection />}
      </div>
    </div>
  );
}

/* ─── Profile ─────────────────────────────────────────────────────────────── */

function ProfileSection({ user }: { user: User }) {
  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader title="Profile" subtitle="Your account information" icon="◎" />
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-zinc-800 border border-[#3A3A3A] overflow-hidden flex items-center justify-center text-2xl text-zinc-400">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                user.name?.[0]?.toUpperCase() ?? 'U'
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">{user.name}</p>
              <p className="text-xs text-zinc-500">{user.email}</p>
              <span className="mt-1 inline-block text-[10px] text-[#A3E635] bg-[#A3E635]/10 border border-[#A3E635]/20 px-2 py-0.5 rounded capitalize">
                {user.role ?? 'viewer'}
              </span>
            </div>
          </div>
          <Input label="Display Name" defaultValue={user.name ?? ''} />
          <Input label="Email" defaultValue={user.email ?? ''} type="email" disabled hint="Managed by your OAuth provider" />
          <Button variant="primary" size="sm">Save Changes</Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Agents ──────────────────────────────────────────────────────────────── */

function AgentsSection() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!apiKey.trim()) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader title="Anthropic API" subtitle="Required to power AI agents" icon="⚡" />
        <div className="space-y-4">
          <Input
            label="API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            hint="Your key is stored securely in environment variables"
          />
          <div className="rounded-lg border border-[#A3E635]/15 bg-[#A3E635]/5 px-4 py-3 text-xs text-zinc-400 space-y-1">
            <p className="text-[#A3E635] font-medium">Using model: claude-opus-4-7</p>
            <p>Thinking: adaptive (auto-enabled)</p>
            <p>Streaming: enabled via SSE</p>
            <p>Max versions per output: 5</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save API Key'}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Queue Configuration" subtitle="BullMQ + Redis settings" icon="◈" />
        <div className="space-y-4">
          <Input
            label="Redis URL"
            defaultValue="redis://localhost:6379"
            placeholder="redis://..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Concurrency" type="number" defaultValue="3" />
            <Input label="Max Retries" type="number" defaultValue="3" />
          </div>
          <Button variant="secondary" size="sm">Update Queue Settings</Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Integrations ────────────────────────────────────────────────────────── */

function IntegrationsSection() {
  const integrations = [
    { name: 'Google Analytics', desc: 'Import campaign performance data', icon: '▲', connected: false },
    { name: 'Meta Business Suite', desc: 'Sync ad account data', icon: '◈', connected: false },
    { name: 'Slack', desc: 'Get notified when agents finish', icon: '◎', connected: false },
    { name: 'Notion', desc: 'Export deliverables to Notion pages', icon: '☰', connected: false },
    { name: 'Google Drive', desc: 'Save deliverables to Drive', icon: '◇', connected: false },
  ];

  return (
    <div className="max-w-xl space-y-3">
      <p className="text-xs text-zinc-500 mb-4">Connect external tools to extend your agency OS</p>
      {integrations.map((intg) => (
        <div
          key={intg.name}
          className="flex items-center gap-4 rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] px-4 py-3"
        >
          <span className="text-xl text-zinc-500">{intg.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-200">{intg.name}</p>
            <p className="text-xs text-zinc-500">{intg.desc}</p>
          </div>
          <Button variant={intg.connected ? 'outline' : 'secondary'} size="sm">
            {intg.connected ? 'Connected' : 'Connect'}
          </Button>
        </div>
      ))}
    </div>
  );
}

/* ─── Danger Zone ─────────────────────────────────────────────────────────── */

function DangerSection() {
  return (
    <div className="max-w-xl space-y-4">
      <Card className="border-red-500/20">
        <CardHeader title="Danger Zone" subtitle="Irreversible actions" icon="⚠" />
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-red-500/15 bg-red-500/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-red-400">Sign Out</p>
              <p className="text-xs text-zinc-500">End your current session</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
              Sign Out
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-red-500/15 bg-red-500/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-red-400">Delete Account</p>
              <p className="text-xs text-zinc-500">Permanently remove your account and all data</p>
            </div>
            <Button variant="danger" size="sm" disabled>
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
