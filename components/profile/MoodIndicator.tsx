import type { MoodStatus } from '@/types/database';

const MOOD_LABELS: Record<MoodStatus, { label: string; emoji: string }> = {
  nyugodt: { label: 'Nyugodt', emoji: '🌊' },
  faradt: { label: 'Fáradt', emoji: '🥱' },
  'szomorú': { label: 'Szomorú', emoji: '🌧️' },
  aggodo: { label: 'Aggódó', emoji: '🌫️' },
  feszult: { label: 'Feszült', emoji: '⚡' },
  jo_kedvu: { label: 'Jó kedvű', emoji: '🌟' },
  gondolkodo: { label: 'Gondolkodó', emoji: '🌀' },
  beszelgetnek: { label: 'Beszélgetnék', emoji: '💬' },
};

export function MoodIndicator({ mood }: { mood: MoodStatus | null }) {
  if (!mood) return null;
  const info = MOOD_LABELS[mood];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-night-800 px-2.5 py-1 text-xs text-moonlight-300">
      <span aria-hidden="true">{info.emoji}</span> {info.label}
    </span>
  );
}
