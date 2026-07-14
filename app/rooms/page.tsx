'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Room } from '@/types/database';

export default function RoomsListPage() {
  const supabase = createClient();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_archived', false)
        .order('sort_order');
      setRooms((data as Room[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <div>
      <h1 className="font-display text-2xl text-moonlight-100">Beszélgetőszobák</h1>
      <p className="mt-1 text-sm text-moonlight-300">Válassz egy témát, ami most közel áll hozzád.</p>

      {loading && <p className="mt-6 text-moonlight-300">Betöltés…</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/rooms/${room.id}`}
            className="rounded-xl border border-night-700 bg-night-900 p-4 transition hover:border-dusk-500"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">{room.icon}</span>
              <p className="font-medium text-moonlight-100">{room.name}</p>
            </div>
            <p className="mt-2 text-sm text-moonlight-300">{room.description}</p>
          </Link>
        ))}
      </div>

      {!loading && rooms.length === 0 && (
        <p className="mt-8 text-center text-moonlight-300">
          Jelenleg nincs elérhető szoba. Nézz vissza később.
        </p>
      )}
    </div>
  );
}
