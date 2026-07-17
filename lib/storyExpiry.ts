import type { StoryExpiry } from '@/types/database';

export function computeExpiresAt(option: StoryExpiry, from: Date = new Date()): string | null {
  switch (option) {
    case 'egy_ora':
      return new Date(from.getTime() + 60 * 60_000).toISOString();
    case 'reggel_8': {
      const next8 = new Date(from);
      next8.setHours(8, 0, 0, 0);
      if (next8 <= from) next8.setDate(next8.getDate() + 1);
      return next8.toISOString();
    }
    case 'huszonnegy_ora':
      return new Date(from.getTime() + 24 * 60 * 60_000).toISOString();
    case 'het_nap':
      return new Date(from.getTime() + 7 * 24 * 60 * 60_000).toISOString();
    case 'soha':
    default:
      return null;
  }
}
