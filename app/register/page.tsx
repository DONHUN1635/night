'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const MIN_AGE = Number(process.env.NEXT_PUBLIC_MIN_AGE ?? '18');

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const age = currentYear - Number(birthYear);
    if (!birthYear || age < MIN_AGE) {
      setError(`Sajnáljuk, az oldal használatához legalább ${MIN_AGE} évesnek kell lenned.`);
      return;
    }
    if (!acceptedGuidelines) {
      setError('A regisztrációhoz el kell fogadnod a közösségi szabályzatot.');
      return;
    }
    if (displayName.trim().length < 2) {
      setError('A megjelenítési név legalább 2 karakter legyen.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Ismeretlen hiba történt a regisztráció során.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      display_name: displayName.trim(),
      birth_year: Number(birthYear),
      accepted_guidelines_at: new Date().toISOString(),
    });

    setLoading(false);

    if (profileError) {
      setError('A fiók létrejött, de a profil mentése nem sikerült. Próbálj bejelentkezni.');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl text-moonlight-100">Regisztráció</h1>
      <p className="mt-2 text-sm text-moonlight-300">
        Hozz létre egy állandó profilt, hogy megtarthasd a beszélgetéseidet és a naplódat.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-moonlight-300">E-mail cím</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-moonlight-300">Jelszó</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          />
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm text-moonlight-300">Megjelenítési név</label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          />
        </div>

        <div>
          <label htmlFor="birthYear" className="block text-sm text-moonlight-300">Születési év</label>
          <input
            id="birthYear"
            type="number"
            required
            min={1900}
            max={currentYear}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-moonlight-300">
          <input
            type="checkbox"
            checked={acceptedGuidelines}
            onChange={(e) => setAcceptedGuidelines(e.target.checked)}
            className="mt-1"
          />
          Elfogadom a{' '}
          <Link href="/szabalyzat" className="text-skyline-400 underline">
            közösségi szabályzatot
          </Link>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-dusk-600 py-3 font-medium text-white hover:bg-dusk-500 disabled:opacity-50"
        >
          {loading ? 'Regisztráció folyamatban…' : 'Regisztráció'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-moonlight-300">
        Van már fiókod? <Link href="/login" className="text-skyline-400 underline">Belépés</Link>
      </p>
    </div>
  );
}
