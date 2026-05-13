import Button from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon = '◇', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2E2E2E] bg-[#1E1E1E] text-2xl">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-1.5 text-xs text-zinc-600 max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
