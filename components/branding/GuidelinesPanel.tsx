'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { BrandProfile } from './BrandingClient';

interface Props {
  projectId: string;
  profile: BrandProfile | null;
  onProfileUpdate: (profile: BrandProfile) => void;
}

export default function GuidelinesPanel({ projectId, profile, onProfileUpdate }: Props) {
  const [generating, setGenerating] = useState(false);
  const [streamDoc, setStreamDoc] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const doc = streamDoc || profile?.guidelinesDoc || null;

  async function handleGenerate() {
    if (!profile) return;
    setGenerating(true);
    setStreamDoc('');
    setError('');

    try {
      const res = await fetch('/api/branding/profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok || !res.body) throw new Error('Generation failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullDoc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullDoc += data.text;
                setStreamDoc(fullDoc);
              }
              if (data.error) setError(data.error);
              if (data.doc) {
                onProfileUpdate({ ...profile, guidelinesDoc: data.doc, guidelinesGeneratedAt: new Date().toISOString() });
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!doc) return;
    navigator.clipboard.writeText(doc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-dashed border-[#2E2E2E] p-12 text-center">
        <p className="text-2xl mb-2">📋</p>
        <p className="text-sm text-zinc-400">No brand profile yet</p>
        <p className="text-xs text-zinc-600 mt-1">Fill in your Brand Identity first, then generate guidelines</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <><span className="animate-spin inline-block">⟳</span> Generating Guidelines...</>
          ) : (
            <><span>⚡</span> {doc ? 'Regenerate Guidelines' : 'Generate Brand Guidelines'}</>
          )}
        </button>

        {doc && (
          <>
            <button
              onClick={handleCopy}
              className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 border border-[#2E2E2E] hover:border-[#3A3A3A] hover:text-zinc-200 transition-colors"
            >
              {copied ? '✓ Copied!' : '⎘ Copy Markdown'}
            </button>
            {profile.guidelinesGeneratedAt && (
              <span className="text-xs text-zinc-600">
                Last generated {new Date(profile.guidelinesGeneratedAt).toLocaleDateString()}
              </span>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Document */}
      {doc ? (
        <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2A2A] bg-[#141414]">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Brand Guidelines Document</span>
            {generating && <span className="text-xs text-[#A3E635] animate-pulse">● Streaming...</span>}
          </div>
          <div className="p-6 prose prose-invert prose-sm max-w-none
            prose-headings:text-zinc-100 prose-headings:font-semibold
            prose-h1:text-xl prose-h1:border-b prose-h1:border-[#2E2E2E] prose-h1:pb-3 prose-h1:mb-4
            prose-h2:text-base prose-h2:text-[#A3E635] prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-sm prose-h3:text-zinc-300 prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-zinc-400 prose-p:leading-relaxed
            prose-li:text-zinc-400 prose-ul:my-2 prose-ol:my-2
            prose-strong:text-zinc-200 prose-code:text-[#A3E635] prose-code:bg-[#A3E635]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-table:text-xs prose-th:text-zinc-400 prose-th:border-b prose-th:border-[#2E2E2E]
            prose-td:text-zinc-500 prose-td:border-b prose-td:border-[#1A1A1A]
            prose-blockquote:border-l-[#A3E635] prose-blockquote:text-zinc-500
            prose-hr:border-[#2E2E2E]
          ">
            <ReactMarkdown>{doc}</ReactMarkdown>
          </div>
        </div>
      ) : (
        !generating && (
          <div className="rounded-xl border border-dashed border-[#2E2E2E] p-16 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm font-medium text-zinc-300 mb-1">Your brand guidelines document</p>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">
              Click "Generate Brand Guidelines" to create a comprehensive, AI-written brand document
              including color usage, typography rules, tone of voice, and do's & don'ts.
            </p>
          </div>
        )
      )}
    </div>
  );
}
