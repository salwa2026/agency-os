'use client';

import { useState } from 'react';
import FileUploader from './FileUploader';
import DataFileCard from './DataFileCard';

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

interface Props {
  projects: { id: string; name: string }[];
  initialFiles: DataFile[];
}

export default function DataClient({ projects, initialFiles }: Props) {
  const [files, setFiles] = useState<DataFile[]>(initialFiles);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '');

  const projectFiles = files.filter((f) => f.projectId === selectedProjectId);

  function handleUploaded(file: unknown) {
    setFiles((prev) => [file as DataFile, ...prev]);
  }

  function handleDeleted(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  if (projects.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-12 text-center">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-sm text-zinc-400">No active projects found</p>
          <p className="text-xs text-zinc-600 mt-1">Create an active project to start uploading data files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Project selector + stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">Project:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-[#A3E635]/40"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 ml-auto text-xs text-zinc-500">
          <span>{projectFiles.length} file{projectFiles.length !== 1 ? 's' : ''}</span>
          <span>{projectFiles.reduce((s, f) => s + f.rowCount, 0).toLocaleString()} total rows</span>
        </div>
      </div>

      {/* Upload zone */}
      <FileUploader
        projectId={selectedProjectId}
        onUploaded={handleUploaded}
      />

      {/* File list */}
      {projectFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2E2E2E] p-12 text-center">
          <p className="text-zinc-600 text-sm">No files uploaded for this project yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projectFiles.map((file) => (
            <DataFileCard
              key={file.id}
              file={file}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
