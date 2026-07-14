'use client';

interface CrisisResource {
  name: string;
  phone_number: string | null;
  url: string | null;
  description: string | null;
}

// Diszkrét, de jól látható segítségkérő panel. Nem diagnosztizál, nem állítja,
// hogy orvosi vagy pszichológiai szolgáltatást nyújtana - csak elérhetőséget ad.
export function CrisisSupportPanel({
  resources,
  onDismiss,
}: {
  resources: CrisisResource[];
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-dusk-500/40 bg-night-900/95 p-5 shadow-2xl backdrop-blur"
    >
      <p className="text-sm leading-relaxed text-moonlight-100">
        Úgy tűnik, most nagyon nehéz időszakon mész keresztül. Nem vagy egyedül,
        és van, aki tud segíteni. Ha közvetlen veszélyben érzed magad vagy mást,
        kérjük, fordulj a helyi segélyhívóhoz vagy egy krízisvonalhoz.
      </p>

      <ul className="mt-4 space-y-2">
        {resources.map((r) => (
          <li key={r.name} className="rounded-lg bg-night-800 p-3">
            <p className="font-medium text-moonlight-100">{r.name}</p>
            {r.phone_number && (
              <a href={`tel:${r.phone_number}`} className="text-skyline-400 underline">
                {r.phone_number}
              </a>
            )}
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 text-skyline-400 underline"
              >
                weboldal
              </a>
            )}
          </li>
        ))}
      </ul>

      <button
        onClick={onDismiss}
        className="mt-4 w-full rounded-lg border border-night-700 py-2 text-sm text-moonlight-300 hover:bg-night-800"
      >
        Bezárás
      </button>
    </div>
  );
}
