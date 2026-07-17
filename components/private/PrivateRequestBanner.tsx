'use client';

export function PrivateRequestBanner({
  senderName,
  message,
  onAccept,
  onDecline,
}: {
  senderName: string;
  message: string | null;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="rounded-xl border border-dusk-500/40 bg-night-900 p-4">
      <p className="text-sm text-moonlight-100">
        <span className="font-medium text-dusk-400">{senderName}</span> beszélgetést kezdeményezne veled.
      </p>
      {message && <p className="mt-1 text-sm text-moonlight-300">„{message}”</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={onAccept}
          className="rounded-full bg-dusk-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-dusk-500"
        >
          Elfogadás
        </button>
        <button
          onClick={onDecline}
          className="rounded-full border border-night-700 px-4 py-1.5 text-sm text-moonlight-300 hover:bg-night-800"
        >
          Elutasítás
        </button>
      </div>
    </div>
  );
}
