'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showEmailNotice = searchParams.get('ellenorizd_email') === '1';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError('Hibás e-mail cím vagy jelszó.');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl text-moonlight-100">Belépés</h1>
      <p className="mt-2 text-sm text-moonlight-300">Jó, hogy visszatértél.</p>

      {showEmailNotice && (
        <p className="mt-4 rounded-lg border border-dusk-500/40 bg-night-900 p-3 text-sm text-moonlight-100">
          Elküldtünk egy megerősítő e-mailt. Kattints a benne lévő linkre, utána tudsz belépni.
        </p>
      )}

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-moonlight-100"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-dusk-600 py-3 font-medium text-white hover:bg-dusk-500 disabled:opacity-50"
        >
          {loading ? 'Belépés…' : 'Belépés'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-moonlight-300">
        Nincs még fiókod? <Link href="/register" className="text-skyline-400 underline">Regisztráció</Link>
      </p>
      <p className="mt-2 text-center text-sm text-moonlight-300">
        Vagy <Link href="/guest" className="text-skyline-400 underline">lépj be vendégként</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
