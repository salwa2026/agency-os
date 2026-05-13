import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, prefix, className = '', ...props },
  ref,
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-zinc-400">
          {label}
          {props.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          {...props}
          className={`w-full rounded-lg border bg-[#1E1E1E] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors ${
            error
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-[#2E2E2E] focus:border-[#A3E635]/50'
          } ${prefix ? 'pl-8' : ''} ${className}`}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className = '', ...props },
  ref,
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-zinc-400">
          {label}
          {props.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        {...props}
        className={`w-full rounded-lg border bg-[#1E1E1E] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors resize-none ${
          error
            ? 'border-red-500/50 focus:border-red-500'
            : 'border-[#2E2E2E] focus:border-[#A3E635]/50'
        } ${className}`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );
});
