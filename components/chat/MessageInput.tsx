'use client';

import { useRef, useState } from 'react';

export function MessageInput({
  onSend,
  onTyping,
}: {
  onSend: (content: string) => void;
  onTyping: () => void;
}) {
  const [value, setValue] = useState('');
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    onTyping();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-night-800 p-3">
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={1}
        maxLength={2000}
        placeholder="Írj valamit… (Enter a küldéshez)"
        className="max-h-32 flex-1 resize-none rounded-xl border border-night-700 bg-night-900 px-3 py-2 text-sm text-moonlight-100 placeholder:text-moonlight-300/50"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="rounded-full bg-dusk-600 px-4 py-2 text-sm font-medium text-white hover:bg-dusk-500 disabled:opacity-40"
      >
        Küldés
      </button>
    </form>
  );
}
