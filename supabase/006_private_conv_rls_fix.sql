-- ============================================================
-- RLS JAVÍTÁS - privát beszélgetés tagság
-- Futtasd a 005_notifications_triggers.sql UTÁN.
-- ============================================================

create or replace function is_conversation_member(conv_id uuid)
returns boolean as $$
  select exists (
    select 1 from private_conversation_members
    where conversation_id = conv_id and profile_id = auth.uid()
  );
$$ language sql stable security definer;

drop policy if exists "csak tagok lathatjak a beszelgetest" on private_conversations;
create policy "csak tagok lathatjak a beszelgetest" on private_conversations
  for select using (is_conversation_member(id) or is_staff());

drop policy if exists "tagsag lathato a resztvevoknek" on private_conversation_members;
create policy "tagsag lathato a resztvevoknek" on private_conversation_members
  for select using (
    profile_id = auth.uid() or is_conversation_member(conversation_id) or is_staff()
  );

drop policy if exists "csak a beszelgetes tagjai olvashatjak" on private_messages;
create policy "csak a beszelgetes tagjai olvashatjak" on private_messages
  for select using (is_conversation_member(conversation_id) or is_staff());

drop policy if exists "tag kuldhet privat uzenetet" on private_messages;
create policy "tag kuldhet privat uzenetet" on private_messages
  for insert with check (sender_id = auth.uid() and is_conversation_member(conversation_id));
