import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

// A párosítás előtt egyik fél se lássa a másik személyes adatait - ezért ez a
// route csak egy anonim jelölt-azonosítót ad vissza, a teljes profil csak
// kölcsönös elfogadás (privát kérelem elfogadása) után válik láthatóvá.
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: 'A párosításhoz be kell jelentkezned.' }, { status: 401 });
  }

  const { awakeReason, mood, excludeIds } = await request.json().catch(() => ({}));

  const admin = createServiceRoleClient();

  const { data: blocks } = await admin
    .from('user_blocks')
    .select('blocked_id, blocker_id')
    .or(`blocker_id.eq.${userData.user.id},blocked_id.eq.${userData.user.id}`);

  const blockedIds = new Set<string>(
    (blocks ?? []).flatMap((b: any) => [b.blocker_id, b.blocked_id])
  );
  blockedIds.add(userData.user.id);
  (excludeIds ?? []).forEach((id: string) => blockedIds.add(id));

  let query = admin
    .from('profiles')
    .select('id')
    .neq('allow_private_messages', 'senki')
    .eq('is_banned', false)
    .gt('last_active_at', new Date(Date.now() - 15 * 60_000).toISOString())
    .limit(20);

  if (awakeReason) query = query.eq('awake_reason', awakeReason);
  if (mood) query = query.eq('current_mood', mood);

  const { data: candidates } = await query;
  const filtered = (candidates ?? []).filter((c) => !blockedIds.has(c.id));

  if (filtered.length === 0) {
    return NextResponse.json({ candidateId: null });
  }

  const chosen = filtered[Math.floor(Math.random() * filtered.length)];
  if (!chosen) {
    return NextResponse.json({ candidateId: null });
  }
  return NextResponse.json({ candidateId: chosen.id });
}
