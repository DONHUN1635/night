'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getNightGreeting } from '@/lib/greeting';
import type { Room } from '@/types/database';

export default function DashboardPage() {
  const supabase = createClient();
  const [now, setNow] = useState(new Date());
  const [displayName, setDisplayName] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userData.user.id)
          .single();
        setDisplayName(profile?.display_name ?? '');
      } else if (typeof window !== 'undefined') {
        setDisplayName(localStorage.getItem('hb_guest_name') ?? 'Vendég');
      }

      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_archived', false)
        .order('sort_order')
        .limit(6);
      setRooms((roomsData as Room[]) ?? []);

      const { data: questionData } = await supabase
        .from('daily_questions')
        .select('question_text')
        .eq('is_active_on', new Date().toISOString().slice(0, 10))
        .maybeSingle();
      setQuestion(questionData?.question_text ?? null);

      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('last_active_at', new Date(Date.now() - 5 * 60_000).toISOString());
      setOnlineCount(count ?? 0);
    }

    load();
  }, [supabase]);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-moonlight-300">
          {now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <h1 className="font-display text-3xl text-moonlight-100">
          {getNightGreeting(now)}{displayName ? `, ${displayName}` : ''}!
        </h1>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Online most" value={onlineCount ?? '…'} />
        <StatCard label="Aktív szobák" value={rooms.length} />
        <Link href="/rooms/parositas" className="col-span-2 rounded-xl bg-dusk-600 p-4 text-white sm:col-span-2">
          <p className="font-medium">Találj valakit, aki még ébren van</p>
          <p className="text-sm text-moonlight-100/80">Indíts párosítást most</p>
        </Link>
      </section>

      {question && (
        <section className="rounded-xl border border-night-700 bg-night-900 p-5">
          <p className="text-xs uppercase tracking-wide text-dusk-400">Az éjszaka kérdése</p>
          <p className="mt-2 font-display text-xl text-moonlight-100">{question}</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl text-moonlight-100">Ajánlott beszélgetőszobák</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="rounded-xl border border-night-700 bg-night-900 p-4 transition hover:border-dusk-500"
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true">{room.icon}</span>
                <p className="font-medium text-moonlight-100">{room.name}</p>
              </div>
              <p className="mt-1 text-sm text-moonlight-300">{room.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-night-700 bg-night-900 p-4">
      <p className="text-2xl font-semibold text-moonlight-100">{value}</p>
      <p className="text-xs text-moonlight-300">{label}</p>
    </div>
  );
}
