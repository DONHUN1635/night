import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { StarField } from '@/components/shared/StarField';

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  weight: ['400', '500', '600'],
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Hajnali Beszélgetések - Nem alszol? Nem vagy egyedül.',
  description:
    'Beszélgess olyan emberekkel, akik hozzád hasonlóan még ébren vannak. Nyugodt, biztonságos közösségi tér éjszakai gondolatoknak.',
  openGraph: {
    title: 'Hajnali Beszélgetések',
    description: 'Nem alszol? Nem vagy egyedül.',
    type: 'website',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${fraunces.variable} ${inter.variable} dark`}>
      <body className="relative min-h-screen">
        <StarField enabled />
        <div className="relative z-10">
          <Header />
          <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:pb-10">{children}</main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
