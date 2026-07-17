'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadIdentity() {
      const { data: userData } = await supabase.auth.getUser();

      if (userData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userData.user.id)
          .single();
        setDisplayName(profile?.display_name ?? 'Ismeretlen');
        setIsGuest(false);
      } else if (typeof window !== 'undefined' && localStorage.getItem('hb_guest_name')) {
        setDisplayName(localStorage.getItem('hb_guest_name'));
        setIsGuest(true);
      } else {
        setDisplayName(null);
      }
      setLoaded(true);
    }

    loadIdentity();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadIdentity();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function handleLogout() {
    if (isGuest && typeof window !== 'undefined') {
      localStorage.removeItem('hb_guest_id');
      localStorage.removeItem('hb_guest_name');
      localStorage.removeItem('hb_guest_device_token');
    } else {
      await supabase.auth.signOut();
    }
    setDisplayName(null);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-night-800 bg-night-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-lg text-moonlight-100">
          Hajnali Beszélgetések
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-moonlight-300 md:flex">
          <Link href="/rooms" className="hover:text-moonlight-100">Szobák</Link>
          <Link href="/tortenetek" className="hover:text-moonlight-100">Történetek</Link>
          <Link href="/uzenetek" className="hover:text-moonlight-100">Üzenetek</Link>
          <Link href="/dashboard" className="hover:text-moonlight-100">Irányítópult</Link>
          <Link href="/szabalyzat" className="hover:text-moonlight-100">Közösségi szabályok</Link>
        </nav>

        <div className="flex items-center gap-3">
          {loaded && displayName && (
            <Link
              href="/ertesitesek"
              className="hidden text-sm text-moonlight-300 hover:text-moonlight-100 sm:block"
              aria-label="Értesítések"
            >
              🔔
            </Link>
          )}

          {!loaded ? null : displayName ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profil"
                className="hidden text-sm text-moonlight-100 hover:text-moonlight-300 sm:block"
              >
                {displayName}{isGuest && <span className="text-moonlight-300/60"> (vendég)</span>}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full border border-night-700 px-4 py-2 text-sm text-moonlight-300 hover:bg-night-800"
              >
                Kijelentkezés
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-moonlight-300 hover:text-moonlight-100 sm:block"
              >
                Belépés
              </Link>
              <Link
                href="/guest"
                className="rounded-full bg-dusk-600 px-4 py-2 text-sm font-medium text-white hover:bg-dusk-500"
              >
                Belépek az éjszakába
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
