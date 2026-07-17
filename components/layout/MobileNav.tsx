'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const ITEMS = [
  { href: '/dashboard', label: 'Kezdőlap', icon: '🌙' },
  { href: '/rooms', label: 'Szobák', icon: '💬' },
  { href: '/tortenetek', label: 'Történetek', icon: '📖' },
  { href: '/uzenetek', label: 'Üzenetek', icon: '✉️' },
  { href: '/naplo', label: 'Napló', icon: '📔' },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-night-800 bg-night-950/95 py-2 backdrop-blur md:hidden">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-col items-center gap-0.5 px-2 py-1 text-xs',
              active ? 'text-skyline-400' : 'text-moonlight-300'
            )}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
