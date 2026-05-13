'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Overview', icon: '⬡' },
  { href: '/projects', label: 'Projects', icon: '◈' },
  { href: '/tasks', label: 'Tasks', icon: '☰' },
  { href: '/campaigns', label: 'Campaigns', icon: '📡' },
  { href: '/seo', label: 'SEO', icon: '🔍' },
  { href: '/data', label: 'Data & Excel', icon: '📊' },
  { href: '/branding', label: 'Branding', icon: '🎨' },
  { href: '/growth', label: 'Growth', icon: '🧪' },
  { href: '/agents', label: 'AI Agents', icon: '⚡' },
  { href: '/deliverables', label: 'Deliverables', icon: '◇' },
  { href: '/analytics', label: 'Analytics', icon: '▲' },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: '◎' },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={`flex flex-col h-full w-[220px] border-r border-[#2E2E2E] bg-[#141414] select-none ${className}`}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[#2E2E2E] shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A3E635] text-black text-xs font-black">
          A
        </div>
        <span className="text-sm font-bold tracking-tight text-white">Agency OS</span>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-[#2E2E2E] space-y-0.5">
          {BOTTOM_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>
      </nav>

      {/* User */}
      {session?.user && (
        <div className="shrink-0 border-t border-[#2E2E2E] p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 group">
            <div className="h-7 w-7 rounded-full bg-[#2A2A2A] border border-[#3A3A3A] overflow-hidden shrink-0">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ''}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400 font-medium">
                  {session.user.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">{session.user.name}</p>
              <p className="text-[10px] text-zinc-600 truncate">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-400 text-xs transition-all"
            >
              ↪
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all group relative ${
        active
          ? 'bg-[#A3E635]/10 text-[#A3E635]'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#1E1E1E]'
      }`}
    >
      <span className={`text-base w-5 text-center leading-none ${active ? 'text-[#A3E635]' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
        {item.icon}
      </span>
      <span className="font-medium">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="ml-auto text-[10px] font-semibold bg-[#A3E635]/20 text-[#A3E635] rounded-full px-1.5 py-0.5 leading-none">
          {item.badge}
        </span>
      )}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#A3E635] rounded-r-full" />
      )}
    </Link>
  );
}
