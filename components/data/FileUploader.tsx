'use client';

import { useState, useRef, useCallback } from 'react';

interface Props {
  projectId: string;
  onUploaded: (file: unknown) => void;
}

export default function FileUploader({ projectId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        setError('Only CSV and Excel (.xlsx / .xls) files are supported');
        return;
      }

      setUploading(true);
      setError('');

      const form = new FormData();
      form.append('file', file);
      form.append('projectId', projectId);

      try {
        const res = await fetch('/api/data/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Upload failed');
        onUploaded(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [projectId, onUploaded],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-[#A3E635] bg-[#A3E635]/5'
            : uploading
            ? 'border-[#2E2E2E] bg-[#1A1A1A] cursor-wait'
            : 'border-[#2E2E2E] bg-[#1A1A1A] hover:border-[#A3E635]/40 hover:bg-[#1E1E1E]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onInputChange}
          className="hidden"
        />
        {uploading ? (
          <div className="space-y-2">
            <div className="text-2xl animate-pulse">⏳</div>
            <p className="text-sm text-zinc-400">Parsing and uploading...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl">{dragging ? '📂' : '📁'}</div>
            <p className="text-sm font-medium text-zinc-300">
              {dragging ? 'Drop to upload' : 'Drag & drop a file, or click to browse'}
            </p>
            <p className="text-xs text-zinc-600">CSV, XLSX, XLS — up to 5,000 rows</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2.5 flex items-center justify-between">
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
        </div>
      )}
    </div>
  );
}
