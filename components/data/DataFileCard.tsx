'use client';

import { useState, useRef } from 'react';
import ChartRenderer, { type ChartConfig } from './ChartRenderer';

interface DataFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  rowCount: number;
  columnCount: number;
  headers: string[];
  preview: Record<string, unknown>[];
  projectId: string;
  createdAt: string;
  uploadedBy: { name: string | null };
  _count: { analyses: number };
}

interface AnalysisResult {
  id: string;
  title: string | null;
  summary: string | null;
  insights: string[] | null;
  metrics: Array<{ label: string; value: string; change?: string; icon?: string }> | null;
  charts: ChartConfig[] | null;
  recommendations: string[] | null;
  status: string;
  createdAt: string;
}

interface Props {
  file: DataFile;
  onDeleted: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DataFileCard({ file, onDeleted }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [question, setQuestion] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const isCSV = file.mimeType === 'text/csv' || file.originalName.endsWith('.csv');

  async function handleAnalyze() {
    setAnalyzing(true);
    setStreamText('');
    setError('');
    setAnalysis(null);

    try {
      const res = await fetch(`/api/data/files/${file.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!res.ok || !res.body) throw new Error('Analysis failed to start');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
              if (data.analysis) {
                setAnalysis(data.analysis);
                setStreamText('');
              }
              if (data.error) setError(data.error);
            } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/data/files/${file.id}`, { method: 'DELETE' });
    if (res.ok) onDeleted(file.id);
  }

  return (
    <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-[#252525] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-2xl shrink-0 mt-0.5">{isCSV ? '📄' : '📊'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-200 truncate">{file.name}</p>
          <p className="text-xs text-zinc-600 mt-0.5">{file.originalName}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500">
            <span>{file.rowCount.toLocaleString()} rows</span>
            <span>{file.columnCount} columns</span>
            <span>{formatBytes(file.size)}</span>
            {file._count.analyses > 0 && (
              <span className="text-[#A3E635]">{file._count.analyses} analysis</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-zinc-500 text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-[#2A2A2A] animate-fade-in">
          {/* Column tags */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] text-zinc-600 mb-1.5">COLUMNS</p>
            <div className="flex flex-wrap gap-1">
              {file.headers.map((h) => (
                <span key={h} className="text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Data preview toggle */}
          <div className="px-4 pb-2">
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPreview ? '▾ Hide preview' : '▸ Show data preview'}
            </button>
            {showPreview && (
              <div className="mt-2 overflow-x-auto rounded-lg border border-[#2A2A2A]">
                <table className="text-[10px] min-w-full">
                  <thead>
                    <tr className="bg-[#141414] border-b border-[#2A2A2A]">
                      {file.headers.map((h) => (
                        <th key={h} className="px-3 py-1.5 text-left text-zinc-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1E1E]">
                    {file.preview.slice(0, 8).map((row, i) => (
                      <tr key={i} className="hover:bg-[#1A1A1A]">
                        {file.headers.map((h) => (
                          <td key={h} className="px-3 py-1.5 text-zinc-400 whitespace-nowrap max-w-[120px] truncate">
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Analysis input */}
          <div className="px-4 pb-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question (optional)... e.g. What drives revenue growth?"
                className="flex-1 rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#A3E635]/40"
                onKeyDown={(e) => { if (e.key === 'Enter' && !analyzing) handleAnalyze(); }}
              />
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-[#A3E635] text-black hover:bg-[#B8F04D] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {analyzing ? (
                  <><span className="animate-spin inline-block">⟳</span> Analyzing...</>
                ) : (
                  <>⚡ Analyze</>
                )}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            {/* Stream progress */}
            {analyzing && streamText && (
              <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] p-3 max-h-32 overflow-y-auto">
                <pre className="text-[10px] text-zinc-500 font-mono whitespace-pre-wrap leading-relaxed">
                  {streamText}
                </pre>
              </div>
            )}

            {/* Analysis results */}
            {analysis && <AnalysisResults analysis={analysis} />}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#1A1A1A] bg-[#181818]">
        <span className="text-[10px] text-zinc-600">
          {new Date(file.createdAt).toLocaleDateString()} · {file.uploadedBy?.name ?? 'Unknown'}
        </span>
        <button
          onClick={handleDelete}
          className="text-[10px] text-zinc-700 hover:text-red-400 transition-colors"
        >
          Delete file
        </button>
      </div>
    </div>
  );
}

function AnalysisResults({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Title + summary */}
      <div className="rounded-xl border border-[#A3E635]/20 bg-[#A3E635]/5 p-4">
        <p className="text-sm font-semibold text-[#A3E635] mb-1.5">{analysis.title}</p>
        <p className="text-xs text-zinc-400 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Metrics */}
      {analysis.metrics && analysis.metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {analysis.metrics.map((m, i) => (
            <div key={i} className="rounded-lg border border-[#2E2E2E] bg-[#141414] px-3 py-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-zinc-600">{m.label}</span>
                {m.icon && <span className="text-sm">{m.icon}</span>}
              </div>
              <p className="text-sm font-bold text-white">{m.value}</p>
              {m.change && (
                <p className={`text-[10px] mt-0.5 ${m.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.change}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {analysis.charts && analysis.charts.length > 0 && (
        <div className="space-y-3">
          {analysis.charts.map((chart) => (
            <ChartRenderer key={chart.id} chart={chart} />
          ))}
        </div>
      )}

      {/* Insights */}
      {analysis.insights && analysis.insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Key Insights</p>
          <ul className="space-y-1.5">
            {analysis.insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="text-[#A3E635] mt-0.5 shrink-0">◆</span>
                <span>{ins}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Recommendations</p>
          <ul className="space-y-1.5">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
