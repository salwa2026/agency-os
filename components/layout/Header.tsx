'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

export default function Header({ title, subtitle, actions, backHref, backLabel }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') closeSearch();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch, closeSearch]);

  return (
    <>
      <header className="flex h-14 items-center border-b border-[#2E2E2E] bg-[#141414] px-6 gap-4 shrink-0">
        {/* Page title */}
        <div className="flex-1 min-w-0">
          {backHref && (
            <button
              onClick={() => router.push(backHref)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-0.5"
            >
              <span>←</span>
              <span>{backLabel ?? 'Back'}</span>
            </button>
          )}
          {title && (
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-semibold text-white truncate">{title}</h1>
              {subtitle && (
                <span className="text-xs text-zinc-600 hidden sm:block">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {/* Search trigger */}
        <button
          onClick={openSearch}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-1.5 text-xs text-zinc-500 hover:border-[#3A3A3A] hover:text-zinc-400 transition-colors"
        >
          <span>⌕</span>
          <span>Search</span>
          <kbd className="ml-1 rounded bg-[#2A2A2A] px-1.5 py-0.5 text-[10px] text-zinc-600">⌘K</kbd>
        </button>

        {/* Notification bell */}
        <NotificationBell />

        {/* Page actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeSearch(); }}
        >
          <div className="w-full max-w-xl rounded-xl border border-[#3A3A3A] bg-[#1E1E1E] shadow-2xl animate-fade-in overflow-hidden">
            <div className="flex items-center gap-3 px-4 border-b border-[#2E2E2E]">
              <span className="text-zinc-500 text-sm">⌕</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, tasks, agents..."
                className="flex-1 bg-transparent py-3.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query) {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                    closeSearch();
                  }
                }}
              />
              <kbd
                onClick={closeSearch}
                className="cursor-pointer rounded bg-[#2A2A2A] px-1.5 py-0.5 text-[10px] text-zinc-600 hover:text-zinc-400"
              >
                ESC
              </kbd>
            </div>
            <div className="px-4 py-3 text-xs text-zinc-600">
              {query ? `Press Enter to search for "${query}"` : 'Start typing to search'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-[#1E1E1E] hover:text-zinc-300 transition-colors"
      >
        <span className="text-base">🔔</span>
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#A3E635] animate-pulse-dot" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2E2E2E]">
              <span className="text-sm font-medium text-zinc-200">Notifications</span>
              <button className="text-xs text-[#A3E635] hover:opacity-80">Mark all read</button>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm text-zinc-600">No new notifications</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
