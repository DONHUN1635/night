'use client';

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Megerősítés',
  onConfirm,
  onCancel,
  danger = false,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/80 p-4">
      <div className="w-full max-w-sm rounded-xl border border-night-700 bg-night-900 p-5">
        <p className="font-display text-lg text-moonlight-100">{title}</p>
        {description && <p className="mt-2 text-sm text-moonlight-300">{description}</p>}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-night-700 py-2 text-sm text-moonlight-300 hover:bg-night-800"
          >
            Mégse
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-full py-2 text-sm font-medium text-white ${
              danger ? 'bg-red-600 hover:bg-red-500' : 'bg-dusk-600 hover:bg-dusk-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
