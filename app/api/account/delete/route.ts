import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

// A fiók végleges törlése. A profiles tábla "on delete cascade" kapcsolattal
// hivatkozik az auth.users táblára, így a felhasználóhoz tartozó napló,
// bejegyzések és üzenetek is törlődnek. Az auth.admin API csak service role
// kulccsal érhető el, ezért ez a lépés szerveroldali route-ban történik.
export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: 'Nincs bejelentkezve felhasználó.' }, { status: 401 });
  }

  const adminClient = createServiceRoleClient();
  const { error } = await adminClient.auth.admin.deleteUser(userData.user.id);

  if (error) {
    return NextResponse.json({ error: 'A fiók törlése nem sikerült.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
