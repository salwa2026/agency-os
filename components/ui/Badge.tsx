import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800 text-zinc-300 border-zinc-700/50',
  accent: 'bg-[#A3E635]/15 text-[#A3E635] border-[#A3E635]/25',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  danger: 'bg-red-500/15 text-red-400 border-red-500/25',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  muted: 'bg-zinc-800/50 text-zinc-500 border-zinc-700/30',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            variant === 'accent' ? 'bg-[#A3E635]' :
            variant === 'success' ? 'bg-emerald-400' :
            variant === 'warning' ? 'bg-amber-400' :
            variant === 'danger' ? 'bg-red-400' :
            variant === 'info' ? 'bg-blue-400' :
            'bg-zinc-500'
          }`}
        />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    draft: { label: 'Draft', variant: 'muted' },
    active: { label: 'Active', variant: 'accent' },
    paused: { label: 'Paused', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    archived: { label: 'Archived', variant: 'muted' },
    cancelled: { label: 'Cancelled', variant: 'danger' },
    backlog: { label: 'Backlog', variant: 'muted' },
    todo: { label: 'To Do', variant: 'info' },
    in_progress: { label: 'In Progress', variant: 'accent' },
    review: { label: 'Review', variant: 'warning' },
    done: { label: 'Done', variant: 'success' },
  };

  const config = map[status] ?? { label: status, variant: 'default' as BadgeVariant };
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    low: { label: 'Low', variant: 'muted' },
    medium: { label: 'Medium', variant: 'info' },
    high: { label: 'High', variant: 'warning' },
    urgent: { label: 'Urgent', variant: 'danger' },
  };
  const config = map[priority] ?? { label: priority, variant: 'default' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
