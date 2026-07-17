'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { STORY_CATEGORIES, STORY_EXPIRY_OPTIONS } from '@/lib/constants';
import { computeExpiresAt } from '@/lib/storyExpiry';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import type { StoryExpiry, StoryVisibility } from '@/types/database';

export default function NewStoryPage() {
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(STORY_CATEGORIES[0]);
  const [visibility, setVisibility] = useState<StoryVisibility>('nevtelen');
  const [expiry, setExpiry] = useState<StoryExpiry>('soha');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 2 || content.trim().length < 10) {
      setError('A cím és a szöveg legyen kellően hosszú.');
      return;
    }

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('hb_guest_id') : null;

    const { data, error: insertError } = await supabase
      .from('anonymous_posts')
      .insert({
        author_profile_id: userData.user?.id ?? null,
        author_guest_id: userData.user ? null : guestId,
        visibility: userData.user ? visibility : 'nevtelen',
        title: title.trim(),
        content: content.trim(),
        category,
        expiry_option: expiry,
        expires_at: computeExpiresAt(expiry),
      })
      .select()
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError('A történet mentése nem sikerült.');
      return;
    }

    router.push(`/tortenetek/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl text-moonlight-100">Új névtelen történet</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm text-moonlight-300">Cím</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          />
        </div>

        <div>
          <label className="block text-sm text-moonlight-300">Szöveg</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            maxLength={8000}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          />
        </div>

        <div>
          <label className="block text-sm text-moonlight-300">Kategória</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          >
            {STORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-moonlight-300">Megjelenés</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as StoryVisibility)}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          >
            <option value="nevtelen">Teljesen névtelenül</option>
            <option value="profilnevvel">A profilnevemmel</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-moonlight-300">Automatikus törlés</label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(e.target.value as StoryExpiry)}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          >
            {STORY_EXPIRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {error && <ErrorMessage message={error} />}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-dusk-600 py-3 font-medium text-white hover:bg-dusk-500 disabled:opacity-50"
        >
          {saving ? 'Közzététel…' : 'Közzététel'}
        </button>
      </form>
    </div>
  );
}
