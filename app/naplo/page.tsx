'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { MOODS, STORY_CATEGORIES } from '@/lib/constants';
import type { JournalEntry, MoodStatus } from '@/types/database';

export default function JournalPage() {
  const supabase = createClient();
  const router = useRouter();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moodFilter, setMoodFilter] = useState<MoodStatus | ''>('');

  const [editing, setEditing] = useState<Partial<JournalEntry> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });
      setEntries((data as JournalEntry[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.content.toLowerCase().includes(search.toLowerCase());
      const matchesMood = !moodFilter || e.mood === moodFilter;
      return matchesSearch && matchesMood;
    });
  }, [entries, search, moodFilter]);

  async function handleSave() {
    if (!editing || !editing.title?.trim() || !editing.content?.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const tags = (editing as any)._tagsInput
      ? String((editing as any)._tagsInput).split(',').map((t: string) => t.trim()).filter(Boolean)
      : editing.tags ?? [];

    if (editing.id) {
      const { data } = await supabase
        .from('journal_entries')
        .update({ title: editing.title, content: editing.content, mood: editing.mood, tags })
        .eq('id', editing.id)
        .select()
        .single();
      if (data) setEntries((prev) => prev.map((e) => (e.id === data.id ? (data as JournalEntry) : e)));
    } else {
      const { data } = await supabase
        .from('journal_entries')
        .insert({ owner_id: userData.user.id, title: editing.title, content: editing.content, mood: editing.mood ?? null, tags })
        .select()
        .single();
      if (data) setEntries((prev) => [data as JournalEntry, ...prev]);
    }
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('journal_entries').delete().eq('id', deleteTarget.id);
    setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  async function handleShareAsStory(entry: JournalEntry) {
    const { data } = await supabase
      .from('anonymous_posts')
      .insert({
        author_profile_id: entry.owner_id,
        visibility: 'nevtelen',
        title: entry.title,
        content: entry.content,
        category: STORY_CATEGORIES[STORY_CATEGORIES.length - 1],
        expiry_option: 'soha',
      })
      .select()
      .single();

    if (data) {
      await supabase.from('journal_entries').update({ shared_as_post_id: data.id }).eq('id', entry.id);
      router.push(`/tortenetek/${data.id}`);
    }
  }

  function handleExport(format: 'json' | 'txt') {
    const content =
      format === 'json'
        ? JSON.stringify(entries, null, 2)
        : entries.map((e) => `${e.title}\n${new Date(e.created_at).toLocaleString('hu-HU')}\n\n${e.content}\n\n---\n`).join('\n');

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ejszakai-naplo.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-moonlight-100">Éjszakai napló</h1>
        <button
          onClick={() => setEditing({})}
          className="rounded-full bg-dusk-600 px-4 py-2 text-sm font-medium text-white hover:bg-dusk-500"
        >
          Új bejegyzés
        </button>
      </div>
      <p className="mt-1 text-xs text-moonlight-300">A naplód alapértelmezetten csak neked látható.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés a naplóban…"
          className="flex-1 rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-sm text-moonlight-100"
        />
        <select
          value={moodFilter}
          onChange={(e) => setMoodFilter(e.target.value as MoodStatus | '')}
          className="rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-sm text-moonlight-100"
        >
          <option value="">Minden hangulat</option>
          {MOODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <button onClick={() => handleExport('json')} className="rounded-lg border border-night-700 px-3 py-2 text-xs text-moonlight-300 hover:bg-night-800">
          Export JSON
        </button>
        <button onClick={() => handleExport('txt')} className="rounded-lg border border-night-700 px-3 py-2 text-xs text-moonlight-300 hover:bg-night-800">
          Export TXT
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState title="Még nincs ide illő bejegyzésed" description="Írd le, mi jár a fejedben ma éjjel." />
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className="space-y-2">
              <JournalEntryCard entry={entry} onClick={() => setEditing({ ...entry, _tagsInput: entry.tags.join(', ') } as any)} />
              <div className="flex gap-3 px-1 text-xs">
                <button onClick={() => handleShareAsStory(entry)} className="text-moonlight-300 hover:text-skyline-400">
                  Megosztás névtelen történetként
                </button>
                <button onClick={() => setDeleteTarget(entry)} className="text-moonlight-300 hover:text-red-400">
                  Törlés
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/80 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-night-700 bg-night-900 p-5 sm:rounded-2xl">
            <p className="font-display text-lg text-moonlight-100">
              {editing.id ? 'Bejegyzés szerkesztése' : 'Új bejegyzés'}
            </p>

            <input
              value={editing.title ?? ''}
              onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Cím"
              className="mt-4 w-full rounded-lg border border-night-700 bg-night-950 px-3 py-2 text-moonlight-100"
            />

            <textarea
              value={editing.content ?? ''}
              onChange={(e) => setEditing((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Mi jár a fejedben?"
              rows={6}
              className="mt-3 w-full rounded-lg border border-night-700 bg-night-950 px-3 py-2 text-moonlight-100"
            />

            <select
              value={editing.mood ?? ''}
              onChange={(e) => setEditing((prev) => ({ ...prev, mood: (e.target.value || null) as MoodStatus | null }))}
              className="mt-3 w-full rounded-lg border border-night-700 bg-night-950 px-3 py-2 text-moonlight-100"
            >
              <option value="">Hangulat megadása nélkül</option>
              {MOODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <input
              value={(editing as any)._tagsInput ?? ''}
              onChange={(e) => setEditing((prev) => ({ ...prev, _tagsInput: e.target.value } as any))}
              placeholder="Címkék, vesszővel elválasztva"
              className="mt-3 w-full rounded-lg border border-night-700 bg-night-950 px-3 py-2 text-moonlight-100"
            />

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-full border border-night-700 py-2 text-sm text-moonlight-300 hover:bg-night-800"
              >
                Mégse
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-full bg-dusk-600 py-2 text-sm font-medium text-white hover:bg-dusk-500"
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Törlöd ezt a bejegyzést?"
          description="Ez a művelet nem vonható vissza."
          confirmLabel="Törlés"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
