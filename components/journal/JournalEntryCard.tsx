import { MoodIndicator } from '@/components/profile/MoodIndicator';
import type { JournalEntry } from '@/types/database';

export function JournalEntryCard({
  entry,
  onClick,
}: {
  entry: JournalEntry;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-night-800 bg-night-900 p-4 text-left hover:border-dusk-500"
    >
      <div className="flex items-center justify-between">
        <p className="font-medium text-moonlight-100">{entry.title}</p>
        <span className="text-xs text-moonlight-300/60">
          {new Date(entry.created_at).toLocaleDateString('hu-HU')}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-moonlight-300">{entry.content}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <MoodIndicator mood={entry.mood} />
        {entry.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-night-800 px-2 py-0.5 text-[11px] text-moonlight-300">
            #{tag}
          </span>
        ))}
      </div>
    </button>
  );
}
