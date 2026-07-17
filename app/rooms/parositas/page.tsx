'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AWAKE_REASONS, MOODS } from '@/lib/constants';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import type { AwakeReason, MoodStatus } from '@/types/database';

type Stage = 'form' | 'searching' | 'found' | 'sent' | 'none';

export default function MatchingPage() {
  const supabase = createClient();
  const router = useRouter();

  const [awakeReason, setAwakeReason] = useState<AwakeReason | ''>('');
  const [mood, setMood] = useState<MoodStatus | ''>('');
  const [stage, setStage] = useState<Stage>('form');
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [triedIds, setTriedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function findMatch(excludeIds: string[] = []) {
    setStage('searching');
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ awakeReason: awakeReason || null, mood: mood || null, excludeIds }),
    });

    if (!res.ok) {
      setError('A párosítás most nem sikerült. Próbáld újra kicsit később.');
      setStage('form');
      return;
    }

    const { candidateId: found } = await res.json();

    if (!found) {
      setStage('none');
      return;
    }

    setCandidateId(found);
    setStage('found');
  }

  async function sendRequest() {
    if (!candidateId) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase.from('conversation_requests').insert({
      sender_id: userData.user.id,
      recipient_id: candidateId,
      message: 'Szia! Az éjszakai párosításon keresztül találtunk egymásra - beszélgetnél?',
    });

    setStage('sent');
  }

  function findAnother() {
    if (candidateId) setTriedIds((prev) => [...prev, candidateId]);
    findMatch(candidateId ? [...triedIds, candidateId] : triedIds);
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="font-display text-2xl text-moonlight-100">Találj valakit, aki még ébren van</h1>
      <p className="mt-2 text-sm text-moonlight-300">
        A párosítás előtt egyik fél sem látja a másik személyes adatait - a kapcsolat csak
        kölcsönös elfogadás után jön létre.
      </p>

      {stage === 'form' && (
        <div className="mt-6 space-y-4 text-left">
          <div>
            <label className="block text-sm text-moonlight-300">Miért vagy még ébren?</label>
            <select
              value={awakeReason}
              onChange={(e) => setAwakeReason(e.target.value as AwakeReason | '')}
              className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
            >
              <option value="">Bármi</option>
              {AWAKE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-moonlight-300">Hangulat</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value as MoodStatus | '')}
              className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
            >
              <option value="">Bármi</option>
              {MOODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {error && <ErrorMessage message={error} />}

          <button
            onClick={() => findMatch()}
            className="w-full rounded-full bg-dusk-600 py-3 font-medium text-white hover:bg-dusk-500"
          >
            Párosítás indítása
          </button>
        </div>
      )}

      {stage === 'searching' && <p className="mt-10 text-moonlight-300">Keresünk valakit, aki most szintén ébren van…</p>}

      {stage === 'found' && (
        <div className="mt-10 space-y-4">
          <p className="text-4xl">🌙</p>
          <p className="text-moonlight-100">Találtunk valakit, aki most szintén ébren van.</p>
          <div className="flex gap-3">
            <button
              onClick={sendRequest}
              className="flex-1 rounded-full bg-dusk-600 py-3 font-medium text-white hover:bg-dusk-500"
            >
              Beszélgetési kérelem küldése
            </button>
            <button
              onClick={findAnother}
              className="flex-1 rounded-full border border-night-700 py-3 text-sm text-moonlight-300 hover:bg-night-800"
            >
              Másik beszélgetőpartnert keresek
            </button>
          </div>
        </div>
      )}

      {stage === 'sent' && (
        <div className="mt-10">
          <p className="text-moonlight-100">Elküldtük a kérelmet. Ha a másik fél elfogadja, itt fog megjelenni a beszélgetés:</p>
          <a href="/uzenetek" className="mt-4 inline-block text-skyline-400 underline">Privát beszélgetések</a>
        </div>
      )}

      {stage === 'none' && (
        <div className="mt-10 space-y-4">
          <p className="text-moonlight-300">Most nem találtunk senkit, aki megfelelne a kritériumoknak.</p>
          <button
            onClick={() => setStage('form')}
            className="rounded-full border border-night-700 px-6 py-3 text-sm text-moonlight-100 hover:bg-night-800"
          >
            Próbáld újra
          </button>
        </div>
      )}
    </div>
  );
}
