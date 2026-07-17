'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AnonymousStoryCard } from '@/components/stories/AnonymousStoryCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { STORY_CATEGORIES } from '@/lib/constants';
import type { AnonymousPost } from '@/types/database';

export default function StoriesPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<AnonymousPost[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from('anonymous_posts')
        .select('*')
        .eq('is_removed', false)
        .order('created_at', { ascending: false })
        .limit(30);

      if (category) query = query.eq('category', category);

      const { data } = await query;
      const list = (data as AnonymousPost[]) ?? [];
      setPosts(list);

      const namedIds = list.filter((p) => p.visibility === 'profilnevvel' && p.author_profile_id).map((p) => p.author_profile_id as string);
      if (namedIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', namedIds);
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p: any) => { map[p.id] = p.display_name; });
        setAuthorNames(map);
      }

      setLoading(false);
    }
    load();
  }, [supabase, category]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-moonlight-100">Névtelen történetek</h1>
        <Link
          href="/tortenetek/uj"
          className="rounded-full bg-dusk-600 px-4 py-2 text-sm font-medium text-white hover:bg-dusk-500"
        >
          Új történet
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`rounded-full px-3 py-1 text-xs ${!category ? 'bg-dusk-600 text-white' : 'bg-night-800 text-moonlight-300'}`}
        >
          Összes
        </button>
        {STORY_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs ${category === c ? 'bg-dusk-600 text-white' : 'bg-night-800 text-moonlight-300'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading && <LoadingState />}
        {!loading && posts.length === 0 && (
          <EmptyState title="Még nincs történet ebben a témában" description="Legyél te az első, aki megosztja a gondolatait." />
        )}
        {posts.map((post) => (
          <AnonymousStoryCard
            key={post.id}
            post={post}
            authorName={post.visibility === 'profilnevvel' ? authorNames[post.author_profile_id ?? ''] ?? 'Ismeretlen' : 'Névtelen'}
          />
        ))}
      </div>
    </div>
  );
}
