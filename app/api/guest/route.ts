import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateGuestName, generateDeviceToken } from '@/lib/guestName';

// Vendég session létrehozása. A guest_sessions táblát a kliens nem írhatja
// közvetlenül (lásd RLS), ezért ez az API route a service role kulccsal dolgozik.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const existingToken: string | undefined = body?.deviceToken;

  const supabase = createServiceRoleClient();

  if (existingToken) {
    const { data: existing } = await supabase
      .from('guest_sessions')
      .select('*')
      .eq('device_token', existingToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existing) {
      await supabase
        .from('guest_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', existing.id);

      return NextResponse.json({ guest: existing });
    }
  }

  const deviceToken = generateDeviceToken();
  const guestName = generateGuestName();

  const { data: created, error } = await supabase
    .from('guest_sessions')
    .insert({ guest_name: guestName, device_token: deviceToken })
    .select()
    .single();

  if (error || !created) {
    return NextResponse.json({ error: 'Nem sikerült létrehozni a vendég munkamenetet.' }, { status: 500 });
  }

  return NextResponse.json({ guest: created });
}
