'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MoodIndicator } from '@/components/profile/MoodIndicator';
import { LoadingState } from '@/components/shared/LoadingState';
import type { Profile } from '@/types/database';
import { AWAKE_REASONS } from '@/lib/constants';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setIsGuest(true);
        setLoading(false);
        return;
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
      setProfile(data as Profile);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) return <LoadingState />;

  if (isGuest) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <p className="font-display text-xl text-moonlight-100">Vendégként vagy bejelentkezve</p>
        <p className="mt-2 text-sm text-moonlight-300">
          Regisztrálj, hogy megtarthasd a profilod, a naplódat és a beszélgetéseidet.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-full bg-dusk-600 px-6 py-3 text-sm font-medium text-white hover:bg-dusk-500"
        >
          Regisztráció
        </Link>
      </div>
    );
  }

  if (!profile) return <p className="text-moonlight-300">A profil nem található.</p>;

  const awakeReasonLabel = AWAKE_REASONS.find((r) => r.value === profile.awake_reason)?.label;

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dusk-600 text-2xl text-white">
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-display text-xl text-moonlight-100">{profile.display_name}</p>
          {profile.show_status_on_profile && <MoodIndicator mood={profile.current_mood} />}
        </div>
      </div>

      {profile.bio && <p className="mt-4 text-sm text-moonlight-300">{profile.bio}</p>}

      {profile.show_status_on_profile && awakeReasonLabel && (
        <p className="mt-3 text-sm text-moonlight-300">
          <span className="text-dusk-400">Miért ébren:</span> {awakeReasonLabel}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          href="/profil/beallitasok"
          className="flex-1 rounded-full border border-night-700 py-2 text-center text-sm text-moonlight-100 hover:bg-night-800"
        >
          Profilbeállítások
        </Link>
        <button
          onClick={handleLogout}
          className="flex-1 rounded-full border border-night-700 py-2 text-sm text-moonlight-300 hover:bg-night-800"
        >
          Kijelentkezés
        </button>
      </div>
    </div>
  );
}
