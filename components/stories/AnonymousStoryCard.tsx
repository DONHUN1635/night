import Link from 'next/link';
import type { AnonymousPost } from '@/types/database';

export function AnonymousStoryCard({ post, authorName }: { post: AnonymousPost; authorName: string }) {
  return (
    <Link
      href={`/tortenetek/${post.id}`}
      className="block rounded-xl border border-night-800 bg-night-900 p-4 hover:border-dusk-500"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-night-800 px-2.5 py-0.5 text-xs text-dusk-400">{post.category}</span>
        <span className="text-xs text-moonlight-300/60">
          {new Date(post.created_at).toLocaleDateString('hu-HU')}
        </span>
      </div>
      <p className="mt-2 font-display text-lg text-moonlight-100">{post.title}</p>
      <p className="mt-1 line-clamp-2 text-sm text-moonlight-300">{post.content}</p>
      <p className="mt-2 text-xs text-moonlight-300/70">{authorName}</p>
    </Link>
  );
}
