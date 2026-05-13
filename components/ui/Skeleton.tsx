interface SkeletonProps {
  className?: string;
  rows?: number;
}

export default function Skeleton({ className = '', rows }: SkeletonProps) {
  if (rows) {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`h-4 rounded shimmer ${i === rows - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    );
  }
  return <div className={`rounded shimmer ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton rows={2} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-4 py-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
