'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'hb_guest_device_token';

export default function GuestEntryPage() {
  const router = useRouter();
  const [guestName, setGuestName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createOrRestoreGuest() {
      try {
        const deviceToken = localStorage.getItem(STORAGE_KEY) ?? undefined;

        const res = await fetch('/api/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceToken }),
        });

        if (!res.ok) throw new Error('request-failed');

        const { guest } = await res.json();
        localStorage.setItem(STORAGE_KEY, guest.device_token);
        localStorage.setItem('hb_guest_id', guest.id);
        localStorage.setItem('hb_guest_name', guest.guest_name);
        setGuestName(guest.guest_name);

        setTimeout(() => router.push('/dashboard'), 1200);
      } catch {
        setError('Nem sikerült létrehozni a vendég munkamenetet. Próbáld újra.');
      }
    }

    createOrRestoreGuest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      {error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <>
          <span className="text-4xl">🌙</span>
          <p className="mt-4 text-moonlight-300">Vendég munkamenet létrehozása…</p>
          {guestName && (
            <p className="mt-2 font-display text-2xl text-moonlight-100">
              Üdv, {guestName}!
            </p>
          )}
        </>
      )}
    </div>
  );
}
