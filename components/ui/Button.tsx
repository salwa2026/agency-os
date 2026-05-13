import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-[#A3E635] text-black font-semibold hover:bg-[#B5F03D] disabled:bg-[#A3E635]/40 disabled:text-black/40',
  secondary: 'bg-[#1E1E1E] text-zinc-200 border border-[#3A3A3A] hover:border-[#525252] hover:text-white disabled:opacity-40',
  ghost: 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E1E] disabled:opacity-40',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-40',
  outline: 'border border-[#A3E635]/30 text-[#A3E635] hover:bg-[#A3E635]/10 disabled:opacity-40',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 h-7 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 h-9 rounded-lg gap-2',
  lg: 'text-sm px-5 py-2.5 h-10 rounded-xl gap-2',
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all focus-visible:ring-2 focus-visible:ring-[#A3E635] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414] disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading ? (
        <LoadingSpinner />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
