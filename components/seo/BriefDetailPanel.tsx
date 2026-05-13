'use client';

import { useState, useRef, useEffect } from 'react';
import type { ContentBrief, OutlineSection } from '@/types/seo';
import { CONTENT_TYPE_LABELS, BRIEF_STATUS_LABELS, BRIEF_STATUS_COLORS } from '@/types/seo';

interface Props {
  brief: ContentBrief;
  onUpdate: (updated: ContentBrief) => void;
  onClose: () => void;
}

type GenerateStatus = 'idle' | 'generating' | 'done' | 'error';

export default function BriefDetailPanel({ brief, onUpdate, onClose }: Props) {
  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>('idle');
  const [streamText, setStreamText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => { esRef.current?.close(); }, []);

  async function handleGenerate() {
    setGenerateStatus('generating');
    setStreamText('');
    setErrorMsg('');

    const es = new EventSource(`/api/seo/briefs/${brief.id}/generate`);
    esRef.current = es;

    // POST then connect SSE (generate route is POST, so use fetch+stream)
    es.close();

    try {
      const res = await fetch(`/api/seo/briefs/${brief.id}/generate`, { method: 'POST' });
      if (!res.ok || !res.body) throw new Error('Generation failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let generated: ContentBrief | null = null;

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
              if (data.text) setStreamText((t) => t + data.text);
              if (data.brief || data.raw) {
                // Fetch updated brief after save
                const updated = await fetch(`/api/seo/briefs/${brief.id}`).then((r) => r.json());
                generated = updated;
                onUpdate(updated);
              }
              if (data.error) {
                setErrorMsg(data.error);
                setGenerateStatus('error');
              }
            } catch { /* ignore parse errors */ }
          }
          if (line.startsWith('event: complete')) {
            setGenerateStatus('done');
          }
          if (line.startsWith('event: error')) {
            setGenerateStatus('error');
          }
        }
      }

      if (!generated) setGenerateStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed');
      setGenerateStatus('error');
    }
  }

  function copyAll() {
    const text = buildCopyText(brief);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const outline = brief.outline as OutlineSection[] | null;

  return (
    <div className="w-[420px] shrink-0 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] flex flex-col h-[calc(100vh-8rem)] sticky top-6 overflow-hidden animate-slide-in-right">
      {/* Panel header */}
      <div className="flex items-start justify-between gap-2 px-5 py-4 border-b border-[#2E2E2E] shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${BRIEF_STATUS_COLORS[brief.status]}`}>
              {BRIEF_STATUS_LABELS[brief.status]}
            </span>
            <span className="text-[10px] text-zinc-600">
              {CONTENT_TYPE_LABELS[brief.contentType as keyof typeof CONTENT_TYPE_LABELS]}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug">{brief.title}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">🔍 {brief.targetKeyword}</p>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-sm mt-0.5 shrink-0">✕</button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Meta info */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Word Count" value={`${brief.wordCountTarget.toLocaleString()} words`} />
          <Stat label="Priority" value={brief.priority.charAt(0).toUpperCase() + brief.priority.slice(1)} />
          {brief.dueDate && (
            <Stat label="Due Date" value={new Date(brief.dueDate).toLocaleDateString()} />
          )}
          <Stat
            label="AI Brief"
            value={brief.aiGenerated ? '✓ Generated' : '—'}
            accent={brief.aiGenerated}
          />
        </div>

        {/* Secondary keywords */}
        {brief.secondaryKeywords.length > 0 && (
          <Section title="Secondary Keywords">
            <div className="flex flex-wrap gap-1.5">
              {brief.secondaryKeywords.map((kw) => (
                <span key={kw} className="text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                  {kw}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* AI-generated content */}
        {brief.aiGenerated && (
          <>
            {brief.metaTitle && (
              <Section title="Meta Title">
                <p className="text-xs text-zinc-300 bg-[#141414] rounded-lg px-3 py-2 font-mono">{brief.metaTitle}</p>
                <p className="text-[10px] text-zinc-600 mt-1">{brief.metaTitle.length}/60 chars</p>
              </Section>
            )}
            {brief.metaDescription && (
              <Section title="Meta Description">
                <p className="text-xs text-zinc-300 bg-[#141414] rounded-lg px-3 py-2">{brief.metaDescription}</p>
                <p className="text-[10px] text-zinc-600 mt-1">{brief.metaDescription.length}/155 chars</p>
              </Section>
            )}
            {outline && outline.length > 0 && (
              <Section title={`Content Outline (${outline.length} sections)`}>
                <div className="space-y-2">
                  {outline.map((section, i) => (
                    <div key={i} className={`rounded-lg px-3 py-2 ${section.type === 'h2' ? 'bg-[#1E1E1E] border border-[#2A2A2A]' : 'bg-[#141414] ml-3'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] text-zinc-600 uppercase mr-2">{section.type?.toUpperCase()}</span>
                          <span className="text-xs font-medium text-zinc-200">{section.heading}</span>
                        </div>
                        {section.wordCount && (
                          <span className="text-[10px] text-zinc-600 shrink-0">{section.wordCount}w</span>
                        )}
                      </div>
                      {section.notes && (
                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{section.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {/* Generating stream preview */}
        {generateStatus === 'generating' && streamText && (
          <Section title="Generating...">
            <pre className="text-[10px] text-zinc-500 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-[#141414] rounded-lg p-3">
              {streamText}
            </pre>
          </Section>
        )}

        {/* Error */}
        {generateStatus === 'error' && errorMsg && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Notes */}
        {brief.notes && (
          <Section title="Notes">
            <p className="text-xs text-zinc-400 leading-relaxed">{brief.notes}</p>
          </Section>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 border-t border-[#2E2E2E] px-5 py-4 space-y-2">
        <button
          onClick={handleGenerate}
          disabled={generateStatus === 'generating'}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-50 transition-colors"
        >
          {generateStatus === 'generating' ? (
            <>
              <span className="animate-spin">⟳</span>
              <span>Generating Brief...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>{brief.aiGenerated ? 'Regenerate with AI' : 'Generate with AI'}</span>
            </>
          )}
        </button>
        {brief.aiGenerated && (
          <button
            onClick={copyAll}
            className="w-full rounded-lg py-2 text-xs font-medium text-zinc-400 border border-[#2E2E2E] hover:border-[#3A3A3A] hover:text-zinc-200 transition-colors"
          >
            {copied ? '✓ Copied!' : '⎘ Copy Full Brief'}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] px-3 py-2">
      <p className="text-[10px] text-zinc-600">{label}</p>
      <p className={`text-xs font-medium mt-0.5 ${accent ? 'text-[#A3E635]' : 'text-zinc-300'}`}>{value}</p>
    </div>
  );
}

function buildCopyText(brief: ContentBrief): string {
  const outline = brief.outline as OutlineSection[] | null;
  const lines: string[] = [
    `CONTENT BRIEF: ${brief.title}`,
    `${'='.repeat(60)}`,
    ``,
    `Target Keyword: ${brief.targetKeyword}`,
    brief.secondaryKeywords.length ? `Secondary Keywords: ${brief.secondaryKeywords.join(', ')}` : '',
    `Content Type: ${CONTENT_TYPE_LABELS[brief.contentType as keyof typeof CONTENT_TYPE_LABELS]}`,
    `Word Count Target: ${brief.wordCountTarget}`,
    ``,
  ];

  if (brief.metaTitle) lines.push(`META TITLE:`, brief.metaTitle, ``);
  if (brief.metaDescription) lines.push(`META DESCRIPTION:`, brief.metaDescription, ``);

  if (outline?.length) {
    lines.push(`OUTLINE:`);
    outline.forEach((s) => {
      const indent = s.type === 'h3' ? '  ' : '';
      lines.push(`${indent}[${s.type?.toUpperCase()}] ${s.heading}${s.wordCount ? ` (${s.wordCount}w)` : ''}`);
      if (s.notes) lines.push(`${indent}  → ${s.notes}`);
    });
    lines.push(``);
  }

  if (brief.notes) lines.push(`NOTES:`, brief.notes);

  return lines.filter((l) => l !== undefined).join('\n');
}
