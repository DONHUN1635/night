'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LoadingState } from '@/components/shared/LoadingState';
import type { AnonymousPost, AnonymousPostComment } from '@/types/database';

export default function StoryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const postId = params.id;

  const [post, setPost] = useState<AnonymousPost | null>(null);
  const [authorName, setAuthorName] = useState('Névtelen');
  const [comments, setComments] = useState<AnonymousPostComment[]>([]);
  const [commentAuthorNames, setCommentAuthorNames] = useState<Record<string, string>>({});
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: postData } = await supabase.from('anonymous_posts').select('*').eq('id', postId).single();
      setPost(postData as AnonymousPost);

      if (postData?.visibility === 'profilnevvel' && postData.author_profile_id) {
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', postData.author_profile_id)
          .single();
        setAuthorName(authorProfile?.display_name ?? 'Ismeretlen');
      }

      const { data: commentData } = await supabase
        .from('anonymous_post_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('is_removed', false)
        .order('created_at', { ascending: true });
      setComments((commentData as AnonymousPostComment[]) ?? []);

      setLoading(false);
    }
    load();
  }, [postId, supabase]);

  async function handleReact(reactionType: string) {
    const { data: userData } = await supabase.auth.getUser();
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('hb_guest_id') : null;

    await supabase.from('anonymous_post_reactions').insert({
      post_id: postId,
      profile_id: userData.user?.id ?? null,
      guest_session_id: userData.user ? null : guestId,
      reaction_type: reactionType,
    });
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('hb_guest_id') : null;

    const { data } = await supabase
      .from('anonymous_post_comments')
      .insert({
        post_id: postId,
        author_profile_id: userData.user?.id ?? null,
        author_guest_id: userData.user ? null : guestId,
        content: newComment.trim(),
      })
      .select()
      .single();

    if (data) setComments((prev) => [...prev, data as AnonymousPostComment]);
    setNewComment('');
  }

  async function handleReport() {
    const { data: userData } = await supabase.auth.getUser();
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('hb_guest_id') : null;

    await supabase.from('reports').insert({
      reporter_profile_id: userData.user?.id ?? null,
      reporter_guest_id: userData.user ? null : guestId,
      target_type: 'bejegyzes',
      target_post_id: postId,
      reason: 'felhasznaloi_jelentes',
    });
    alert('Köszönjük, jelentésedet rögzítettük.');
  }

  if (loading) return <LoadingState />;
  if (!post) return <p className="text-moonlight-300">A történet nem található vagy törölve lett.</p>;

  return (
    <div className="mx-auto max-w-xl">
      <span className="rounded-full bg-night-800 px-2.5 py-0.5 text-xs text-dusk-400">{post.category}</span>
      <h1 className="mt-3 font-display text-2xl text-moonlight-100">{post.title}</h1>
      <p className="mt-1 text-xs text-moonlight-300/70">
        {authorName} · {new Date(post.created_at).toLocaleDateString('hu-HU')}
      </p>

      <p className="mt-4 whitespace-pre-wrap text-moonlight-100">{post.content}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {['ertelek', 'veled_vagyok', 'atltem_mar', 'koszonom_hogy_leirtad', 'kuldok_egy_olelest', 'beszeljunk_rola'].map((type) => (
          <button
            key={type}
            onClick={() => handleReact(type)}
            className="rounded-full bg-night-800 px-3 py-1 text-xs text-moonlight-300 hover:bg-night-700"
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
        <button onClick={handleReport} className="rounded-full px-3 py-1 text-xs text-moonlight-300 hover:text-red-400">
          Jelentés
        </button>
      </div>

      <div className="mt-8 border-t border-night-800 pt-6">
        <p className="text-sm font-medium text-moonlight-100">Hozzászólások</p>

        <div className="mt-3 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-night-900 p-3 text-sm text-moonlight-100">
              {c.content}
            </div>
          ))}
        </div>

        <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Írj hozzászólást…"
            className="flex-1 rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-sm text-moonlight-100"
          />
          <button
            type="submit"
            className="rounded-full bg-dusk-600 px-4 py-2 text-sm font-medium text-white hover:bg-dusk-500"
          >
            Küldés
          </button>
        </form>
      </div>
    </div>
  );
}
