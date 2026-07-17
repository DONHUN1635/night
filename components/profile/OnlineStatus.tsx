import clsx from 'clsx';

const PRESENCE_COLORS: Record<string, string> = {
  elerheto: 'bg-emerald-400',
  elfoglalt: 'bg-amber-400',
  nem_zavarhato: 'bg-red-400',
  lathatatlan: 'bg-night-600',
};

export function OnlineStatus({
  presence,
  hidden,
}: {
  presence: string;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <span
      className={clsx('inline-block h-2.5 w-2.5 rounded-full', PRESENCE_COLORS[presence] ?? 'bg-night-600')}
      aria-hidden="true"
    />
  );
}
