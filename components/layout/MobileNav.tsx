'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Home', icon: '⬡' },
  { href: '/projects', label: 'Projects', icon: '◈' },
  { href: '/agents', label: 'Agents', icon: '⚡' },
  { href: '/tasks', label: 'Tasks', icon: '☰' },
  { href: '/settings', label: 'Settings', icon: '◎' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#2E2E2E] bg-[#141414]/95 backdrop-blur-md sm:hidden">
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-3 text-[10px] transition-colors ${
                active ? 'text-[#A3E635]' : 'text-zinc-600 active:text-zinc-400'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
