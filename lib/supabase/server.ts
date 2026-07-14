import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Szerveroldali Supabase kliens - Server Componentekben és Route Handlerekben használandó.
// A cookie-kezelést a Next.js cookies() API-ja végzi, így az auth session
// szerveroldalon is elérhető marad.
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component-ből hívva ez elvárt hiba, a middleware kezeli a cookie-frissítést
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // lásd fent
          }
        },
      },
    }
  );
}

// Csak szerveroldali API route-okban használható, kiterjesztett jogokkal
// (pl. vendég session létrehozása). SOHA ne importáld kliens komponensbe.
export function createServiceRoleClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
