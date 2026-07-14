'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { Message } from '@/types/database';

const REAKCIOK: { type: string; label: string; emoji: string }[] = [
  { type: 'ertelek', label: 'Értelek', emoji: '🤍' },
  { type: 'veled_vagyok', label: 'Veled vagyok', emoji: '🫂' },
  { type: 'atltem_mar', label: 'Átéltem már', emoji: '🌗' },
  { type: 'koszonom_hogy_leirtad', label: 'Köszönöm, hogy leírtad', emoji: '🙏' },
  { type: 'kuldok_egy_olelest', label: 'Küldök egy ölelést', emoji: '🤗' },
  { type: 'beszeljunk_rola', label: 'Beszéljünk róla', emoji: '💬' },
];

export function ChatMessage({
  message,
  isOwn,
  onReact,
  onReport,
}: {
  message: Message;
  isOwn: boolean;
  onReact: (reactionType: string) => void;
  onReport: () => void;
}) {
  const [showReactions, setShowReactions] = useState(false);

  if (message.is_deleted) {
    return (
      <div className="my-1 text-sm italic text-moonlight-300/60">Az üzenetet törölték.</div>
    );
  }

  return (
    <div className={clsx('group my-1.5 flex flex-col', isOwn ? 'items-end' : 'items-start')}>
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-dusk-400">{message.author_display_name}</span>
        <span className="text-[10px] text-moonlight-300/60">
          {new Date(message.created_at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div
        className={clsx(
          'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
          isOwn ? 'bg-dusk-600 text-white' : 'bg-night-800 text-moonlight-100'
        )}
      >
        {message.content}
        {message.is_edited && <span className="ml-1 text-[10px] opacity-60">(szerkesztve)</span>}
      </div>

      <div className="mt-1 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => setShowReactions((v) => !v)}
          className="text-xs text-moonlight-300 hover:text-moonlight-100"
        >
          Reagálás
        </button>
        <button onClick={onReport} className="text-xs text-moonlight-300 hover:text-red-400">
          Jelentés
        </button>
      </div>

      {showReactions && (
        <div className="mt-1 flex flex-wrap gap-1 rounded-lg border border-night-700 bg-night-900 p-2">
          {REAKCIOK.map((r) => (
            <button
              key={r.type}
              onClick={() => {
                onReact(r.type);
                setShowReactions(false);
              }}
              title={r.label}
              className="rounded-full px-2 py-1 text-xs hover:bg-night-800"
            >
              {r.emoji} {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
