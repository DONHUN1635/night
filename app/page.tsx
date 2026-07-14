import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <span className="mb-6 text-5xl" aria-hidden="true">🌙</span>

      <h1 className="max-w-xl font-display text-4xl leading-tight text-moonlight-100 sm:text-5xl">
        Nem alszol? Nem vagy egyedül.
      </h1>

      <p className="mt-4 max-w-md text-lg text-moonlight-300">
        Beszélgess olyan emberekkel, akik hozzád hasonlóan még ébren vannak.
      </p>

      <Link
        href="/guest"
        className="mt-10 rounded-full bg-dusk-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-dusk-600/30 transition hover:bg-dusk-500"
      >
        Belépek az éjszakába
      </Link>

      <p className="mt-6 text-sm text-moonlight-300">
        Vagy{' '}
        <Link href="/register" className="text-skyline-400 underline">
          regisztrálj
        </Link>{' '}
        egy állandó profillal
      </p>

      <p className="mt-16 max-w-lg text-xs text-moonlight-300/70">
        A Hajnali Beszélgetések egy közösségi, beszélgetős platform. Nem társkereső
        és nem egészségügyi szolgáltatás, és nem helyettesíti a szakember segítségét.
      </p>
    </div>
  );
}
