import clsx from 'clsx';
import type { AppNotification } from '@/types/database';

const TYPE_LABELS: Record<string, { icon: string; text: (p: any) => string }> = {
  valasz_erkezett: { icon: '💬', text: () => 'Valaki válaszolt neked.' },
  megemlitettek: { icon: '📣', text: () => 'Megemlítettek egy üzenetben.' },
  privat_kerelem: { icon: '🔗', text: () => 'Új privát beszélgetési kérelmed érkezett.' },
  privat_uzenet: { icon: '✉️', text: () => 'Új privát üzeneted érkezett.' },
  reakcio_bejegyzesre: { icon: '🤍', text: () => 'Valaki reagált a bejegyzésedre.' },
  moderatori_figyelmeztetes: { icon: '⚠️', text: () => 'Moderátori figyelmeztetést kaptál.' },
  rendszeruzenet: { icon: '🌙', text: (p) => p?.message ?? 'Rendszerüzenet.' },
};

export function NotificationItem({
  notification,
  onClick,
}: {
  notification: AppNotification;
  onClick: () => void;
}) {
  const info = TYPE_LABELS[notification.type] ?? { icon: '🔔', text: () => 'Értesítés' };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex w-full items-start gap-3 rounded-xl border p-3 text-left',
        notification.is_read ? 'border-night-800 bg-night-900' : 'border-dusk-500/40 bg-night-800'
      )}
    >
      <span className="text-lg" aria-hidden="true">{info.icon}</span>
      <div>
        <p className="text-sm text-moonlight-100">{info.text(notification.payload)}</p>
        <p className="mt-0.5 text-xs text-moonlight-300/60">
          {new Date(notification.created_at).toLocaleString('hu-HU')}
        </p>
      </div>
    </button>
  );
}
