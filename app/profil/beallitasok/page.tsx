'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { AWAKE_REASONS, MOODS } from '@/lib/constants';
import type { AwakeReason, MoodStatus, Profile } from '@/types/database';

export default function ProfileSettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
      setProfile(data as Profile);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSavedMessage(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        current_mood: profile.current_mood,
        awake_reason: profile.awake_reason,
        show_status_on_profile: profile.show_status_on_profile,
        hide_online_status: profile.hide_online_status,
        allow_private_messages: profile.allow_private_messages,
      })
      .eq('id', profile.id);

    setSaving(false);

    if (updateError) {
      setError('Nem sikerült menteni a változtatásokat.');
      return;
    }
    setSavedMessage('A profil sikeresen frissült.');
  }

  async function handleDeleteAccount() {
    if (!profile) return;
    // A saját tartalmak (napló, bejegyzések, üzenetek) törlése cascade szabályokkal
    // az adatbázisban történik a auth.users törlésekor (lásd 001_schema.sql
    // "on delete cascade" hivatkozásait). A fiók végleges törlése service role
    // jogosultságot igényel, ezért ezt egy dedikált API route végzi.
    await fetch('/api/account/delete', { method: 'POST' });
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) return <LoadingState />;
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-2xl text-moonlight-100">Profilbeállítások</h1>

      <div>
        <label className="block text-sm text-moonlight-300">Megjelenítési név</label>
        <input
          value={profile.display_name}
          onChange={(e) => update('display_name', e.target.value)}
          className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
        />
      </div>

      <div>
        <label className="block text-sm text-moonlight-300">Bemutatkozás</label>
        <textarea
          value={profile.bio ?? ''}
          onChange={(e) => update('bio', e.target.value)}
          maxLength={300}
          rows={3}
          className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
        />
      </div>

      <div>
        <label className="block text-sm text-moonlight-300">Aktuális hangulat</label>
        <select
          value={profile.current_mood ?? ''}
          onChange={(e) => update('current_mood', (e.target.value || null) as MoodStatus | null)}
          className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
        >
          <option value="">Nincs megadva</option>
          {MOODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-moonlight-300">Miért vagy még ébren?</label>
        <select
          value={profile.awake_reason ?? ''}
          onChange={(e) => update('awake_reason', (e.target.value || null) as AwakeReason | null)}
          className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
        >
          <option value="">Nincs megadva</option>
          {AWAKE_REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3 rounded-xl border border-night-800 p-4">
        <p className="text-sm font-medium text-moonlight-100">Adatvédelem</p>

        <label className="flex items-center justify-between text-sm text-moonlight-300">
          Hangulat és állapot megjelenítése a profilon
          <input
            type="checkbox"
            checked={profile.show_status_on_profile}
            onChange={(e) => update('show_status_on_profile', e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between text-sm text-moonlight-300">
          Online állapot elrejtése
          <input
            type="checkbox"
            checked={profile.hide_online_status}
            onChange={(e) => update('hide_online_status', e.target.checked)}
          />
        </label>

        <div>
          <label className="block text-sm text-moonlight-300">Privát üzenetek fogadása</label>
          <select
            value={profile.allow_private_messages}
            onChange={(e) => update('allow_private_messages', e.target.value as Profile['allow_private_messages'])}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          >
            <option value="barki">Bárki küldhet kérelmet</option>
            <option value="csak_regisztralt">Csak regisztrált tagok</option>
            <option value="senki">Senki ne küldhessen</option>
          </select>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {savedMessage && <p className="text-sm text-emerald-400">{savedMessage}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-full bg-dusk-600 py-3 font-medium text-white hover:bg-dusk-500 disabled:opacity-50"
      >
        {saving ? 'Mentés…' : 'Mentés'}
      </button>

      <div className="border-t border-night-800 pt-6">
        <p className="text-sm font-medium text-red-400">Veszélyzóna</p>
        <p className="mt-1 text-xs text-moonlight-300">
          A fiók törlése végleges, és eltávolítja a naplódat, bejegyzéseidet és üzeneteidet.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="mt-3 rounded-full border border-red-900 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30"
        >
          Fiók törlése
        </button>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Biztosan törlöd a fiókod?"
          description="Ez a művelet nem vonható vissza. Minden adatod véglegesen törlődik."
          confirmLabel="Törlés"
          danger
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
