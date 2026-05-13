interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
  icon?: string;
  accent?: boolean;
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  change,
  unit,
  icon,
  accent = false,
  loading = false,
}: StatCardProps) {
  const positive = change != null && change >= 0;

  if (loading) {
    return (
      <div className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] p-4 space-y-3">
        <div className="h-3 w-20 rounded shimmer" />
        <div className="h-8 w-16 rounded shimmer" />
        <div className="h-2.5 w-12 rounded shimmer" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 space-y-1 ${
        accent
          ? 'border-[#A3E635]/25 bg-[#A3E635]/5'
          : 'border-[#2E2E2E] bg-[#1E1E1E]'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{label}</p>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <p className={`text-2xl font-bold ${accent ? 'text-[#A3E635]' : 'text-white'}`}>
          {value}
        </p>
        {unit && <span className="text-xs text-zinc-500">{unit}</span>}
      </div>
      {change != null && (
        <p className={`text-[10px] font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {positive ? '↑' : '↓'} {Math.abs(change)}% vs last month
        </p>
      )}
    </div>
  );
}
