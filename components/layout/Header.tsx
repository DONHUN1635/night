import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-night-800 bg-night-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-lg text-moonlight-100">
          Hajnali Beszélgetések
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-moonlight-300 md:flex">
          <Link href="/rooms" className="hover:text-moonlight-100">Szobák</Link>
          <Link href="/dashboard" className="hover:text-moonlight-100">Irányítópult</Link>
          <Link href="/szabalyzat" className="hover:text-moonlight-100">Közösségi szabályok</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-moonlight-300 hover:text-moonlight-100 sm:block"
          >
            Belépés
          </Link>
          <Link
            href="/guest"
            className="rounded-full bg-dusk-600 px-4 py-2 text-sm font-medium text-white hover:bg-dusk-500"
          >
            Belépek az éjszakába
          </Link>
        </div>
      </div>
    </header>
  );
}
