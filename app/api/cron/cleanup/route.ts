import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Ezt a route-ot a Vercel Cron Job hívja naponta (lásd vercel.json).
// Feladata:
//   1. A beszélgetőszobák X napnál régebbi üzeneteinek törlése
//      (a retenciós idő a system_settings "message_retention_days" kulcsból jön, alap: 7 nap)
//   2. A lejárt (expires_at < now) névtelen történetek törlése
//   3. A lejárt vendég-sessionök törlése
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Jogosulatlan hozzáférés.' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: setting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'message_retention_days')
    .maybeSingle();

  const retentionDays = Number(setting?.value ?? 7) || 7;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60_000).toISOString();

  const { error: messagesError, count: deletedMessages } = await supabase
    .from('messages')
    .delete({ count: 'exact' })
    .lt('created_at', cutoff);

  const { error: postsError, count: deletedPosts } = await supabase
    .from('anonymous_posts')
    .delete({ count: 'exact' })
    .not('expires_at', 'is', null)
    .lt('expires_at', new Date().toISOString());

  const { error: guestsError, count: deletedGuests } = await supabase
    .from('guest_sessions')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString());

  return NextResponse.json({
    retentionDays,
    deletedMessages: deletedMessages ?? 0,
    deletedPosts: deletedPosts ?? 0,
    deletedGuests: deletedGuests ?? 0,
    errors: [messagesError?.message, postsError?.message, guestsError?.message].filter(Boolean),
  });
}
